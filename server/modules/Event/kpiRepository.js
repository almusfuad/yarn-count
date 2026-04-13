/**
 * KPI Repository
 * Data access layer for KPI Snapshots collection in PostgreSQL
 */

import { prisma } from '../../db/prisma.js';
import logger from '../../utils/logger.js';

class KPIRepository {
  /**
   * Save a KPI snapshot
   */
  async saveSnapshot(snapshotData) {
    try {
      const snapshot = await prisma.kPISnapshot.create({
        data: snapshotData,
      });
      logger.info(`✅ KPI snapshot saved for ${snapshotData.machineId} (${snapshotData.period})`);
      return snapshot;
    } catch (error) {
      logger.error('❌ Error saving KPI snapshot:', error.message);
      throw error;
    }
  }

  /**
   * Get snapshot for a machine on a specific date
   */
  async getSnapshot(machineId, snapshotDate, period = 'daily') {
    try {
      const snapshot = await prisma.kPISnapshot.findFirst({
        where: {
          machineId,
          snapshotDate,
          period,
        },
      });

      return snapshot;
    } catch (error) {
      logger.error('❌ Error getting snapshot:', error.message);
      return null;
    }
  }

  /**
   * Get snapshots for a machine within date range
   */
  async getSnapshotsForMachine(machineId, startDate, endDate, period = 'daily') {
    try {
      const snapshots = await prisma.kPISnapshot.findMany({
        where: {
          machineId,
          period,
          snapshotDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        orderBy: { snapshotDate: 'desc' },
      });

      return snapshots;
    } catch (error) {
      logger.error('❌ Error getting snapshots for machine:', error.message);
      return [];
    }
  }

  /**
   * Get snapshots for all machines on a specific date
   */
  async getSnapshotsByDate(snapshotDate, period = 'daily') {
    try {
      const snapshots = await prisma.kPISnapshot.findMany({
        where: {
          snapshotDate,
          period,
        },
      });

      return snapshots;
    } catch (error) {
      logger.error('❌ Error getting snapshots by date:', error.message);
      return [];
    }
  }

  /**
   * Batch save multiple snapshots
   */
  async saveBatchSnapshots(snapshotsData) {
    try {
      const saved = await prisma.kPISnapshot.createMany({
        data: snapshotsData,
      });
      logger.info(`✅ Batch saved ${saved.count} KPI snapshots`);
      return saved;
    } catch (error) {
      logger.error('❌ Error batch saving snapshots:', error.message);
      throw error;
    }
  }

  /**
   * Get latest snapshot for a machine
   */
  async getLatestSnapshot(machineId, period = 'daily') {
    try {
      const snapshot = await prisma.kPISnapshot.findFirst({
        where: {
          machineId,
          period,
        },
        orderBy: { snapshotDate: 'desc' },
      });

      return snapshot;
    } catch (error) {
      logger.error('❌ Error getting latest snapshot:', error.message);
      return null;
    }
  }

  /**
   * Aggregate KPI metrics across all machines using raw SQL
   */
  async aggregateMetrics(startDate, endDate, period = 'daily') {
    try {
      const result = await prisma.$queryRaw`
        SELECT
          SUM(CAST(metrics->>'totalPulses' AS INTEGER)) as "totalPulses",
          SUM(CAST(metrics->>'totalRuntime' AS INTEGER)) as "totalRuntime",
          SUM(CAST(metrics->>'totalDowntime' AS INTEGER)) as "totalDowntime",
          SUM(CAST(metrics->>'problemCount' AS INTEGER)) as "totalProblems",
          SUM(CAST(metrics->>'qualityDefects' AS INTEGER)) as "totalQualityDefects",
          AVG(CAST(metrics->>'averageRollWeight' AS FLOAT)) as "avgRollWeight",
          COUNT(DISTINCT "machineId") as "machineCount"
        FROM kpi_snapshots
        WHERE period = ${period}
          AND "snapshotDate" >= ${new Date(startDate)}
          AND "snapshotDate" <= ${new Date(endDate)}
      `;

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error('❌ Error aggregating metrics:', error.message);
      return null;
    }
  }

  /**
   * Delete old snapshots before a cutoff date
   */
  async deleteSnapshotsBefore(cutoffDate) {
    try {
      const result = await prisma.kPISnapshot.deleteMany({
        where: {
          snapshotDate: { lt: cutoffDate },
        },
      });

      logger.info(`✅ Deleted ${result.count} KPI snapshots before ${cutoffDate}`);
      return result.count;
    } catch (error) {
      logger.error('❌ Error deleting old snapshots:', error.message);
      return 0;
    }
  }

  /**
   * Check if snapshot exists for a machine on a date
   */
  async snapshotExists(machineId, snapshotDate, period = 'daily') {
    try {
      const exists = await prisma.kPISnapshot.findFirst({
        where: {
          machineId,
          snapshotDate,
          period,
        },
      });

      return !!exists;
    } catch (error) {
      logger.error('❌ Error checking snapshot existence:', error.message);
      return false;
    }
  }
}

export default new KPIRepository();
