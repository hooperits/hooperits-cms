/**
 * HOOPERITS CMS CLI - Versions Command
 * Manage document versions and retention cleanup
 */

import chalk from 'chalk';
import ora from 'ora';
import { PrismaClient } from '@prisma/client';

interface VersionsOptions {
  cleanup?: boolean;
  contentType?: string;
  dryRun?: boolean;
  stats?: boolean;
}

const prisma = new PrismaClient();

export async function versions(options: VersionsOptions) {
  console.log(chalk.bold('\n📚 Document Versions Management\n'));

  const spinner = ora();

  try {
    if (options.stats) {
      await showStats(spinner, options.contentType);
    } else if (options.cleanup) {
      await runCleanup(spinner, options.contentType, options.dryRun);
    } else {
      // Default: show stats
      await showStats(spinner, options.contentType);
    }
  } catch (error) {
    spinner.fail('Operation failed');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function showStats(spinner: ReturnType<typeof ora>, contentType?: string) {
  spinner.start('Fetching version statistics...');

  const where = contentType
    ? { content: { contentType: { name: contentType } } }
    : {};

  const [totalVersions, versionsByType, oldestVersion, totalSize] = await Promise.all([
    prisma.documentVersion.count({ where }),
    prisma.documentVersion.groupBy({
      by: ['changeType'],
      _count: true,
      where,
    }),
    prisma.documentVersion.findFirst({
      where,
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.documentVersion.aggregate({
      _sum: { size: true },
      where,
    }),
  ]);

  spinner.succeed('Statistics retrieved');

  console.log(chalk.bold('\n📊 Version Statistics\n'));

  if (contentType) {
    console.log(chalk.gray(`Filtered by content type: ${contentType}\n`));
  }

  console.log(`  Total versions: ${chalk.cyan(totalVersions.toLocaleString())}`);
  console.log(`  Total size: ${chalk.cyan(formatBytes(totalSize._sum.size || 0))}`);

  if (oldestVersion) {
    console.log(`  Oldest version: ${chalk.cyan(oldestVersion.createdAt.toLocaleDateString())}`);
  }

  console.log(chalk.bold('\n  By change type:'));
  for (const group of versionsByType) {
    console.log(`    ${group.changeType}: ${chalk.cyan(group._count.toLocaleString())}`);
  }

  console.log();
}

async function runCleanup(
  spinner: ReturnType<typeof ora>,
  contentType?: string,
  dryRun?: boolean
) {
  spinner.start('Loading retention policies...');

  // Get retention policies
  const policies = await prisma.retentionPolicy.findMany({
    include: {
      contentType: true,
    },
    where: contentType
      ? { contentType: { name: contentType } }
      : undefined,
  });

  if (policies.length === 0) {
    spinner.info('No retention policies configured');
    console.log(chalk.yellow('\nConfigure retention policies in the admin panel first.\n'));
    return;
  }

  spinner.succeed(`Found ${policies.length} retention policies`);

  let totalDeleted = 0;

  for (const policy of policies) {
    console.log(chalk.bold(`\n📁 ${policy.contentType.label}`));

    // Get contents for this type
    const contents = await prisma.content.findMany({
      where: { contentTypeId: policy.contentTypeId },
      select: { id: true },
    });

    for (const content of contents) {
      // Find versions to delete based on policy
      const versionsToDelete: string[] = [];

      // Apply max versions limit
      if (policy.maxVersions) {
        const excess = await prisma.documentVersion.findMany({
          where: {
            contentId: content.id,
            isProtected: false,
            ...(policy.keepNamedVersions && { name: null }),
            ...(policy.keepPublishVersions && { changeType: { not: 'PUBLISH' } }),
          },
          orderBy: { versionNumber: 'desc' },
          skip: policy.maxVersions,
          select: { id: true },
        });
        versionsToDelete.push(...excess.map((v) => v.id));
      }

      // Apply max age limit
      if (policy.maxAgeDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.maxAgeDays);

        const oldVersions = await prisma.documentVersion.findMany({
          where: {
            contentId: content.id,
            isProtected: false,
            createdAt: { lt: cutoffDate },
            ...(policy.keepNamedVersions && { name: null }),
            ...(policy.keepPublishVersions && { changeType: { not: 'PUBLISH' } }),
          },
          select: { id: true },
        });
        versionsToDelete.push(...oldVersions.map((v) => v.id));
      }

      // Deduplicate
      const uniqueIds = [...new Set(versionsToDelete)];

      if (uniqueIds.length > 0) {
        if (dryRun) {
          console.log(chalk.yellow(`  Would delete ${uniqueIds.length} versions for content ${content.id}`));
        } else {
          await prisma.documentVersion.deleteMany({
            where: { id: { in: uniqueIds } },
          });
          console.log(chalk.green(`  Deleted ${uniqueIds.length} versions for content ${content.id}`));
        }
        totalDeleted += uniqueIds.length;
      }
    }

    // Update last cleanup timestamp
    if (!dryRun) {
      await prisma.retentionPolicy.update({
        where: { id: policy.id },
        data: { lastCleanupAt: new Date() },
      });
    }
  }

  console.log();

  if (dryRun) {
    console.log(chalk.yellow(`\n🔍 Dry run: Would delete ${totalDeleted} versions total\n`));
    console.log(chalk.gray('Run without --dry-run to actually delete versions.\n'));
  } else if (totalDeleted > 0) {
    console.log(chalk.green(`\n✅ Cleanup complete! Deleted ${totalDeleted} versions.\n`));
  } else {
    console.log(chalk.gray('\nNo versions to clean up based on current policies.\n'));
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
