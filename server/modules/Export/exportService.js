/**
 * Export Service
 * Handles data export orchestration, file generation, and metadata management
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const eventRepository = require('../Event/eventRepository');
const exportRepository = require('./exportRepository');
const logger = require('../../utils/logger');

const EXPORT_PATH = process.env.EXPORT_PATH || './exports';

class ExportService {
  constructor() {
    this.ensureExportDir();
  }

  /**
   * Ensure export directory exists
   */
  async ensureExportDir() {
    try {
      await fs.mkdir(EXPORT_PATH, { recursive: true });
    } catch (error) {
      logger.error('❌ Error ensuring export directory:', error.message);
    }
  }

  /**
   * Trigger a manual export
   */
  async triggerExport(machineId, startDate, endDate, exportType = 'manual') {
    try {
      // Create export record
      const exportRecord = await exportRepository.createExport({
        machineId,
        exportType,
        dateRange: {
          start: new Date(startDate),
          end: new Date(endDate)
        },
        status: 'pending'
      });

      // Generate export file asynchronously
      this.generateExportFile(exportRecord._id, machineId, startDate, endDate);

      return {
        exportId: exportRecord._id,
        status: 'pending',
        message: 'Export queued for processing'
      };
    } catch (error) {
      logger.error(`❌ Error triggering export:`, error.message);
      throw error;
    }
  }

  /**
   * Generate export file (async operation)
   */
  async generateExportFile(exportId, machineId, startDate, endDate) {
    try {
      logger.info(`📄 Starting export generation: ${exportId}`);

      // Query events for the date range
      const events = await eventRepository.queryEvents(machineId, new Date(startDate), new Date(endDate));

      if (!events || events.length === 0) {
        await exportRepository.updateExport(exportId, {
          status: 'completed',
          recordCount: 0,
          fileSize: 0,
          checksum: crypto.createHash('sha256').update('').digest('hex')
        });
        logger.info(`✅ Export completed (no events): ${exportId}`);
        return;
      }

      // Prepare export data
      const exportData = {
        machineId,
        dateRange: { start: startDate, end: endDate },
        recordCount: events.length,
        generatedAt: new Date().toISOString(),
        events
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const checksum = crypto.createHash('sha256').update(jsonContent).digest('hex');

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${machineId}_export_${timestamp}.json`;
      const filepath = path.join(EXPORT_PATH, filename);

      // Write file
      await fs.writeFile(filepath, jsonContent);
      const fileSize = jsonContent.length;

      logger.info(`✅ Export file written: ${filepath}`);

      // Update export record
      await exportRepository.updateExport(exportId, {
        status: 'completed',
        exportPath: filepath,
        recordCount: events.length,
        fileSize,
        checksum
      });

      logger.info(`✅ Export completed: ${exportId}`);
    } catch (error) {
      logger.error(`❌ Error generating export file:`, error.message);

      // Mark export as failed
      try {
        await exportRepository.updateExport(exportId, {
          status: 'failed',
          errorMessage: error.message
        });
      } catch (updateError) {
        logger.error(`❌ Error marking export as failed:`, updateError.message);
      }
    }
  }

  /**
   * Get export history with pagination
   */
  async getExportHistory(machineId = null, limit = 10, offset = 0) {
    try {
      const filters = {};
      if (machineId) {
        filters.machineId = machineId;
      }

      const result = await exportRepository.getExports(filters, limit, offset);
      return result;
    } catch (error) {
      logger.error(`❌ Error getting export history:`, error.message);
      return { data: [], total: 0, limit, offset, pages: 0 };
    }
  }

  /**
   * Get export by ID
   */
  async getExportById(exportId) {
    try {
      return await exportRepository.getExportById(exportId);
    } catch (error) {
      logger.error(`❌ Error getting export by ID:`, error.message);
      return null;
    }
  }

  /**
   * Get export status summary
   */
  async getExportStatus() {
    try {
      const counts = await exportRepository.getExportCountByStatus();
      return {
        pending: counts.pending || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        total: (counts.pending || 0) + (counts.completed || 0) + (counts.failed || 0)
      };
    } catch (error) {
      logger.error(`❌ Error getting export status:`, error.message);
      return { pending: 0, completed: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Get recent exports
   */
  async getRecentExports(limit = 10) {
    try {
      return await exportRepository.getRecentExports(limit);
    } catch (error) {
      logger.error(`❌ Error getting recent exports:`, error.message);
      return [];
    }
  }

  /**
   * Verify export data integrity
   */
  async verifyExport(exportId) {
    try {
      const exportRecord = await exportRepository.getExportById(exportId);
      if (!exportRecord) {
        return { valid: false, message: 'Export not found' };
      }

      if (exportRecord.status !== 'completed') {
        return { valid: false, message: 'Export not completed' };
      }

      // Read file and verify checksum
      const content = await fs.readFile(exportRecord.exportPath, 'utf-8');
      const calculatedChecksum = crypto.createHash('sha256').update(content).digest('hex');

      if (calculatedChecksum !== exportRecord.checksum) {
        return { valid: false, message: 'Checksum mismatch - file may be corrupted' };
      }

      return { valid: true, message: 'Export data is valid', fileSize: exportRecord.fileSize };
    } catch (error) {
      logger.error(`❌ Error verifying export:`, error.message);
      return { valid: false, message: error.message };
    }
  }
}

module.exports = new ExportService();
