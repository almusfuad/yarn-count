import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

let isConnected = false;

/**
 * Connect to PostgreSQL via Prisma
 */
export async function connectToPostgres() {
  if (isConnected) {
    logger.info('PostgreSQL already connected');
    return prisma;
  }

  try {
    logger.info('Connecting to PostgreSQL...');
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    
    isConnected = true;
    logger.info('✅ PostgreSQL connected successfully');

    // Handle disconnection events
    prisma.$on('error', (err) => {
      logger.error('❌ PostgreSQL connection error:', err.message);
      isConnected = false;
    });

    return prisma;
  } catch (error) {
    logger.error('❌ PostgreSQL connection failed:', error.message);
    isConnected = false;
    throw error;
  }
}

/**
 * Check if PostgreSQL is connected
 */
export function isPostgresConnected() {
  return isConnected;
}

/**
 * Disconnect from PostgreSQL
 */
export async function disconnectFromPostgres() {
  if (isConnected) {
    await prisma.$disconnect();
    isConnected = false;
    logger.info('✅ PostgreSQL disconnected');
  }
}

/**
 * Get connection status for health checks
 */
export async function getConnectionStatus() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      isConnected: true,
      status: 'connected',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL',
    };
  } catch (error) {
    return {
      isConnected: false,
      status: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL',
    };
  }
}

export { prisma };
