/**
 * HOOPERITS CMS CLI - Init Command
 * Initialize CMS in a project
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

export async function init() {
  console.log(chalk.bold('\n🚀 Initializing HOOPERITS CMS\n'));

  const spinner = ora();
  const cwd = process.cwd();

  try {
    // Check if package.json exists
    const packageJsonPath = path.join(cwd, 'package.json');
    try {
      await fs.access(packageJsonPath);
    } catch {
      console.error(chalk.red('Error: package.json not found. Please run this command in a Node.js project.'));
      process.exit(1);
    }

    // Read existing package.json
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    // Check for Next.js
    if (!packageJson.dependencies?.next && !packageJson.devDependencies?.next) {
      console.log(chalk.yellow('Warning: Next.js not detected. This CMS is designed for Next.js projects.'));
    }

    // 1. Add dependencies
    spinner.start('Adding CMS dependencies...');

    const deps = [
      '@hooperits/cms@latest',
      '@hooperits/client@latest',
      '@prisma/client',
      'next-auth',
      'zod',
    ];

    const devDeps = [
      'prisma',
      '@hooperits/cli@latest',
    ];

    execSync(`npm install ${deps.join(' ')}`, { stdio: 'pipe' });
    execSync(`npm install -D ${devDeps.join(' ')}`, { stdio: 'pipe' });

    spinner.succeed('Dependencies installed');

    // 2. Create cms directory structure
    spinner.start('Creating CMS directory structure...');

    const cmsDir = path.join(cwd, 'cms');
    const schemasDir = path.join(cmsDir, 'schemas');

    await fs.mkdir(schemasDir, { recursive: true });

    // Create example schema
    const exampleSchema = `/**
 * Example content type schema
 * Modify this file or create new ones in cms/schemas/
 */

import { defineSchema, fields } from '@hooperits/cms';

export const pageSchema = defineSchema({
  name: 'page',
  label: 'Page',
  labelPlural: 'Pages',
  icon: 'file-text',
  fields: {
    title: fields.text({
      label: 'Title',
      required: true,
      maxLength: 100,
    }),
    slug: fields.slug({
      label: 'URL Slug',
      from: 'title',
    }),
    content: fields.richText({
      label: 'Content',
    }),
    published: fields.boolean({
      label: 'Published',
      default: false,
    }),
  },
});
`;

    await fs.writeFile(path.join(schemasDir, 'page.ts'), exampleSchema);

    // Create schema index
    const schemaIndex = `/**
 * CMS Schema Registry
 * Import and register all schemas here
 */

import { registerSchemas } from '@hooperits/cms';
import { pageSchema } from './schemas/page';

export const schemas = registerSchemas([
  pageSchema,
  // Add more schemas here
]);
`;

    await fs.writeFile(path.join(cmsDir, 'index.ts'), schemaIndex);

    spinner.succeed('CMS directory created');

    // 3. Create/update Prisma schema
    spinner.start('Setting up Prisma...');

    const prismaDir = path.join(cwd, 'prisma');
    await fs.mkdir(prismaDir, { recursive: true });

    // Check if schema exists
    const schemaPath = path.join(prismaDir, 'schema.prisma');
    try {
      await fs.access(schemaPath);
      console.log(chalk.yellow('\n  Prisma schema already exists. Please manually add CMS models.'));
    } catch {
      // Create new schema
      const prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  EDITOR
  VIEWER
}

enum ContentStatus {
  DRAFT
  PUBLISHED
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      UserRole @default(VIEWER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  createdContent Content[] @relation("CreatedBy")
  updatedContent Content[] @relation("UpdatedBy")
  uploadedMedia  Media[]

  @@map("users")
}

model ContentType {
  id          String   @id @default(uuid())
  name        String   @unique
  label       String
  labelPlural String
  schema      Json
  icon        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  contents Content[]

  @@map("content_types")
}

model Content {
  id        String        @id @default(uuid())
  typeId    String
  type      ContentType   @relation(fields: [typeId], references: [id], onDelete: Cascade)
  data      Json
  status    ContentStatus @default(DRAFT)
  slug      String?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  createdById String
  createdBy   User   @relation("CreatedBy", fields: [createdById], references: [id])
  updatedById String
  updatedBy   User   @relation("UpdatedBy", fields: [updatedById], references: [id])

  @@unique([typeId, slug])
  @@index([typeId, status])
  @@index([typeId, createdAt])
  @@map("contents")
}

model Media {
  id           String   @id @default(uuid())
  filename     String
  mimeType     String
  size         Int
  path         String
  width        Int?
  height       Int?
  variants     Json?
  metadata     Json?
  createdAt    DateTime @default(now())
  uploadedById String
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])

  @@map("media")
}
`;

      await fs.writeFile(schemaPath, prismaSchema);
    }

    spinner.succeed('Prisma configured');

    // 4. Create .env.example if it doesn't exist
    spinner.start('Creating environment template...');

    const envExample = `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/myproject_cms"

# Auth
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Media Storage
MEDIA_STORAGE="filesystem"
MEDIA_PATH="./public/uploads"
`;

    const envExamplePath = path.join(cwd, '.env.example');
    try {
      await fs.access(envExamplePath);
    } catch {
      await fs.writeFile(envExamplePath, envExample);
    }

    spinner.succeed('Environment template created');

    // 5. Add scripts to package.json
    spinner.start('Adding npm scripts...');

    packageJson.scripts = {
      ...packageJson.scripts,
      'cms:migrate': 'prisma migrate dev',
      'cms:generate': 'hooperits-cms generate',
      'cms:create-admin': 'hooperits-cms create-admin',
    };

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

    spinner.succeed('Scripts added to package.json');

    // Done!
    console.log(chalk.green('\n✅ HOOPERITS CMS initialized successfully!\n'));
    console.log('Next steps:');
    console.log(chalk.cyan('  1. Create a PostgreSQL database'));
    console.log(chalk.cyan('  2. Copy .env.example to .env and fill in your values'));
    console.log(chalk.cyan('  3. Run: npm run cms:migrate'));
    console.log(chalk.cyan('  4. Run: npm run cms:create-admin'));
    console.log(chalk.cyan('  5. Start your app and visit /admin'));
    console.log('');

  } catch (error) {
    spinner.fail('Initialization failed');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}
