/**
 * Export Repository
 * Data access layer for Export collection in MongoDB
 */

import { Export as ExportModel } from '../../db/schemas.js';
import logger from '../../utils/logger.js';

class ExportRepository {
  /**
   * Create a new export record
   */
  async createExport(exportData) {
    try {
      const exportRecord = new ExportModel(exportData);
      await exportRecord.save();
      logger.info(`✅ Export record created: ${exportRecord._id}`);
      return exportRecord;
    } catch (error) {
      logger.error('❌ Error creating export record:', error.message);
      throw error;
    }
  }

  /**
   * Get export by ID
   */
  async getExportById(exportId) {
    try {
      const exportRecord = await ExportModel.findById(exportId).lean();
      return exportRecord;
    } catch (error) {
      logger.error('❌ Error getting export by ID:', error.message);
      return null;
    }
  }

  /**
   * Get exports with pagination and filtering
   */
  async getExports(filters = {}, limit = 10, offset = 0) {
    try {
      const query = {};

      if (filters.machineId) {
        query.machineId = filters.machineId;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.exportType) {
        query.exportType = filters.exportType;
      }

      if (filters.startDate || filters.endDate) {
        query.exportedAt = {};
        if (filters.startDate) {
          query.exportedAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.exportedAt.$lte = new Date(filters.endDate);
        }
      }

      const exports = await ExportModel.find(query)
        .sort({ exportedAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      const count = await ExportModel.countDocuments(query);

      return {
        data: exports,
        total: count,
        limit,
        offset,
        pages: Math.ceil(count / limit)
      };
    } catch (error) {
      logger.error('❌ Error getting exports:', error.message);
      return { data: [], total: 0, limit, offset, pages: 0 };
    }
  }

  /**
   * Get exports for a specific machine
   */
  async getExportsByMachine(machineId, limit = 50) {
    try {
      const exports = await ExportModel.find({ machineId })
        .sort({ exportedAt: -1 })
        .limit(limit)
        .lean();

      return exports;
    } catch (error) {
      logger.error(`❌ Error getting exports for machine ${machineId}:`, error.message);
      return [];
    }
  }

  /**
   * Update export status and metadata
   */
  async updateExport(exportId, updates) {
    try {
      const exportRecord = await ExportModel.findByIdAndUpdate(
        exportId,
        updates,
        { new: true }
      ).lean();

      logger.info(`✅ Export record updated: ${exportId}`);
      return exportRecord;
    } catch (error) {
      logger.error('❌ Error updating export record:', error.message);
      throw error;
    }
  }

  /**
   * Get export count by status
   */
  async getExportCountByStatus() {
    try {
      const counts = await ExportModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {};
      counts.forEach(({ _id, count }) => {
        result[_id] = count;
      });

      return result;
    } catch (error) {
      logger.error('❌ Error getting export count by status:', error.message);
      return {};
    }
  }

  /**
   * Get recent exports
   */
  async getRecentExports(limit = 10) {
    try {
      const exports = await ExportModel.find()
        .sort({ exportedAt: -1 })
        .limit(limit)
        .lean();

      return exports;
    } catch (error) {
      logger.error('❌ Error getting recent exports:', error.message);
      return [];
    }
  }
}

export default new ExportRepository();
