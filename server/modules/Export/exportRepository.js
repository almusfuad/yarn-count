/**
 * Export Repository
 * Data access layer for Export collection in PostgreSQL
 */

import { prisma } from '../../db/prisma.js';
import logger from '../../utils/logger.js';

class ExportRepository {
  /**
   * Create a new export record
   */
  async createExport(exportData) {
    try {
      const exportRecord = await prisma.export.create({
        data: exportData,
      });
      logger.info(`✅ Export record created: ${exportRecord.id}`);
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
      const exportRecord = await prisma.export.findUnique({
        where: { id: exportId },
      });
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
      const where = {};

      if (filters.machineId) {
        where.machineId = filters.machineId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.exportType) {
        where.exportType = filters.exportType;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      const exports = await prisma.export.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const count = await prisma.export.count({ where });

      return {
        data: exports,
        total: count,
        limit,
        offset,
        pages: Math.ceil(count / limit),
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
      const exports = await prisma.export.findMany({
        where: { machineId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

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
      const exportRecord = await prisma.export.update({
        where: { id: exportId },
        data: updates,
      });

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
      const counts = await prisma.export.groupBy({
        by: ['status'],
        _count: true,
      });

      const result = {};
      counts.forEach(({ status, _count }) => {
        result[status] = _count;
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
      const exports = await prisma.export.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return exports;
    } catch (error) {
      logger.error('❌ Error getting recent exports:', error.message);
      return [];
    }
  }
}

export default new ExportRepository();
