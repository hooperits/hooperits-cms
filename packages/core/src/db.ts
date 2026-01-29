/**
 * HOOPERITS CMS - Database Client
 * Singleton Prisma client with connection handling
 */

import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global `var` declarations for Prisma singleton
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });
}

// Prevent multiple instances of Prisma Client in development
export const db = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db;
}

export type Database = typeof db;

export async function connectDatabase(): Promise<void> {
  await db.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await db.$disconnect();
}
