/**
 * KPI Repository
 * Data access layer for KPI Snapshots collection in MongoDB
 */

import { KPISnapshot } from '../../db/schemas.js';
import logger from '../../utils/logger.js';

class KPIRepository {
  /**
   * Save a KPI snapshot
   */
  async saveSnapshot(snapshotData) {
    try {
      const snapshot = new KPISnapshot(snapshotData);
      await snapshot.save();
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
      const snapshot = await KPISnapshot.findOne({
        machineId,
        snapshotDate,
        period
      }).lean();

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
      const snapshots = await KPISnapshot.find({
        machineId,
        period,
        snapshotDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
        .sort({ snapshotDate: -1 })
        .lean();

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
      const snapshots = await KPISnapshot.find({
        snapshotDate,
        period
      }).lean();

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
      const saved = await KPISnapshot.insertMany(snapshotsData);
      logger.info(`✅ Batch saved ${saved.length} KPI snapshots`);
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
      const snapshot = await KPISnapshot.findOne({
        machineId,
        period
      })
        .sort({ snapshotDate: -1 })
        .lean();

      return snapshot;
    } catch (error) {
      logger.error('❌ Error getting latest snapshot:', error.message);
      return null;
    }
  }

  /**
   * Aggregate KPI metrics across all machines
   */
  async aggregateMetrics(startDate, endDate, period = 'daily') {
    try {
      const aggregation = await KPISnapshot.aggregate([
        {
          $match: {
            period,
            snapshotDate: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalPulses: { $sum: '$metrics.totalPulses' },
            totalRuntime: { $sum: '$metrics.totalRuntime' },
            totalDowntime: { $sum: '$metrics.totalDowntime' },
            totalProblems: { $sum: '$metrics.problemCount' },
            totalQualityDefects: { $sum: '$metrics.qualityDefects' },
            avgRollWeight: { $avg: '$metrics.averageRollWeight' },
            machineCount: { $sum: 1 }
          }
        }
      ]);

      return aggregation.length > 0 ? aggregation[0] : null;
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
      const result = await KPISnapshot.deleteMany({
        snapshotDate: { $lt: cutoffDate }
      });

      logger.info(`✅ Deleted ${result.deletedCount} KPI snapshots before ${cutoffDate}`);
      return result.deletedCount;
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
      const exists = await KPISnapshot.exists({
        machineId,
        snapshotDate,
        period
      });

      return !!exists;
    } catch (error) {
      logger.error('❌ Error checking snapshot existence:', error.message);
      return false;
    }
  }
}

export default new KPIRepository();
