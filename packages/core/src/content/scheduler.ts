/**
 * HOOPERITS CMS - Publish Scheduler
 * Polling-based scheduler for automatic content publishing
 */

import { db } from '../db';
import { getCache } from '../cache';
import { logger } from '../logger';
import type { Prisma } from '@prisma/client';

/**
 * Scheduler configuration
 */
export interface SchedulerConfig {
  /** Polling interval in milliseconds (default: 60000 = 1 minute) */
  intervalMs?: number;
  /** Maximum retries for failed publishes (default: 3) */
  maxRetries?: number;
  /** System user ID for automatic publishes */
  systemUserId: string;
}

/**
 * Result of processing scheduled content
 */
export interface ProcessResult {
  processed: number;
  published: number;
  failed: number;
  errors: Array<{ contentId: string; error: string }>;
}

const DEFAULT_INTERVAL_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_RETRIES = 3;

/**
 * Publish Scheduler class
 * Manages automatic publishing of scheduled content
 */
export class PublishScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private config: Required<SchedulerConfig>;

  constructor(config: SchedulerConfig) {
    this.config = {
      intervalMs: config.intervalMs ?? DEFAULT_INTERVAL_MS,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      systemUserId: config.systemUserId,
    };
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('[Scheduler] Already running');
      return;
    }

    this.isRunning = true;
    logger.info(`[Scheduler] Starting with ${this.config.intervalMs}ms interval`);

    // Run immediately on start
    this.processScheduledContent().catch((error) => {
      logger.error('[Scheduler] Initial processing failed', { error });
    });

    // Set up interval
    this.intervalId = setInterval(() => {
      this.processScheduledContent().catch((error) => {
        logger.error('[Scheduler] Processing failed', { error });
      });
    }, this.config.intervalMs);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    logger.info('[Scheduler] Stopped');
  }

  /**
   * Check if scheduler is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Process all scheduled content that is due for publishing
   */
  async processScheduledContent(): Promise<ProcessResult> {
    const result: ProcessResult = {
      processed: 0,
      published: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Find all content scheduled for now or earlier
      const scheduledContent = await db.content.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            lte: new Date(),
          },
        },
        select: {
          id: true,
          typeId: true,
          data: true,
          scheduledAt: true,
        },
      });

      if (scheduledContent.length === 0) {
        return result;
      }

      logger.info(`[Scheduler] Processing ${scheduledContent.length} scheduled items`);

      // Process each item
      for (const content of scheduledContent) {
        result.processed++;

        try {
          await this.publishContent(content.id, content.typeId, content.data);
          result.published++;
          logger.info(`[Scheduler] Published content ${content.id}`);
        } catch (error) {
          result.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push({ contentId: content.id, error: errorMessage });
          logger.error(`[Scheduler] Failed to publish content ${content.id}`, { error });
        }
      }

      logger.info(`[Scheduler] Completed: ${result.published} published, ${result.failed} failed`);
    } catch (error) {
      logger.error('[Scheduler] Failed to fetch scheduled content', { error });
    }

    return result;
  }

  /**
   * Publish a single content item
   */
  private async publishContent(
    contentId: string,
    typeId: string,
    data: Prisma.JsonValue
  ): Promise<void> {
    // Update content to published
    await db.content.update({
      where: { id: contentId },
      data: {
        status: 'PUBLISHED',
        publishedData: data as Prisma.InputJsonValue,
        publishedAt: new Date(),
        publishedById: this.config.systemUserId,
        scheduledAt: null,
      },
    });

    // Create publish event
    await db.publishEvent.create({
      data: {
        contentId,
        action: 'PUBLISH',
        userId: this.config.systemUserId,
        metadata: { automatic: true, scheduledPublish: true },
      },
    });

    // Invalidate cache
    const cache = getCache();
    cache.invalidateByTag(`content:${contentId}`);
    cache.invalidateByTag(`type:${typeId}`);
  }
}

/**
 * Create a new scheduler instance
 */
export function createScheduler(config: SchedulerConfig): PublishScheduler {
  return new PublishScheduler(config);
}

// Singleton instance for app-wide scheduler
let defaultScheduler: PublishScheduler | null = null;

/**
 * Get or create the default scheduler instance
 */
export function getScheduler(config?: SchedulerConfig): PublishScheduler | null {
  if (!defaultScheduler && config) {
    defaultScheduler = createScheduler(config);
  }
  return defaultScheduler;
}

/**
 * Initialize and start the default scheduler
 */
export function initializeScheduler(config: SchedulerConfig): PublishScheduler {
  if (defaultScheduler) {
    defaultScheduler.stop();
  }
  defaultScheduler = createScheduler(config);
  defaultScheduler.start();
  return defaultScheduler;
}

/**
 * Stop and cleanup the default scheduler
 */
export function shutdownScheduler(): void {
  if (defaultScheduler) {
    defaultScheduler.stop();
    defaultScheduler = null;
  }
}

/**
 * Auto-initialize scheduler if SCHEDULER_ENABLED is set
 * Call this from your app's instrumentation.ts or startup code
 *
 * Environment variables:
 * - SCHEDULER_ENABLED: Set to 'true' to enable the scheduler
 * - SCHEDULER_INTERVAL_MS: Polling interval (default: 60000)
 * - SCHEDULER_SYSTEM_USER_ID: User ID for automatic publishes (required)
 */
export async function autoInitializeScheduler(): Promise<PublishScheduler | null> {
  const enabled = process.env.SCHEDULER_ENABLED === 'true';

  if (!enabled) {
    logger.info('[Scheduler] Not enabled (set SCHEDULER_ENABLED=true to enable)');
    return null;
  }

  const systemUserId = process.env.SCHEDULER_SYSTEM_USER_ID;

  if (!systemUserId) {
    logger.warn('[Scheduler] SCHEDULER_SYSTEM_USER_ID not set, scheduler disabled');
    return null;
  }

  const intervalMs = parseInt(process.env.SCHEDULER_INTERVAL_MS || '60000', 10);

  return initializeScheduler({
    systemUserId,
    intervalMs,
  });
}

/**
 * Register graceful shutdown handlers for the scheduler
 * Call this from your app startup to ensure clean shutdown
 */
export function registerSchedulerShutdown(): void {
  const shutdown = () => {
    logger.info('[Scheduler] Shutting down...');
    shutdownScheduler();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
