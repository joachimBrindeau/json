/**
 * Prisma adapter creation for NextAuth
 * Handles conditional database adapter initialization
 */

import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import { config } from '@/lib/config';

/**
 * Creates and returns Prisma adapter for NextAuth
 * Returns undefined if database is not configured
 * 
 * @returns Adapter instance or undefined
 */
export function createAuthAdapter(): Adapter | undefined {
  if (!config.database.url) {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { prisma } = require('@/lib/db');
  return PrismaAdapter(prisma) as Adapter;
}

/**
 * Gets Prisma client instance
 * Returns null if database is not configured
 * 
 * @returns Prisma client or null
 */
export function getPrismaClient() {
  if (!config.database.url) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { prisma } = require('@/lib/db');
  return prisma;
}

