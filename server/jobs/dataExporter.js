const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');
const { Event, Export } = require('../db/schemas');
const logger = require('../utils/logger');

let weeklyJob = null;

/**
 * Export data older than 13.5 months to prevent loss due to TTL deletion
 * Runs weekly on Monday at 22:00 UTC
 */
async function exportOldData() {
  try {
    logger.info('📦 Starting weekly data export...');

    // Calculate cutoff date: 13.5 months ago
    // This ensures we export before TTL (15 months) deletes the data
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setMonth(cutoffDate.getMonth() - 13);
    cutoffDate.setDate(cutoffDate.getDate() - 15); // 13.5 months ≈ 405 days

    logger.info(`📦 Exporting events older than ${cutoffDate.toISOString()}`);

    // Create export directory if it doesn't exist
    const exportDir = process.env.EXPORT_PATH || './exports';
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Get all unique machineIds
    const machines = await Event.distinct('machineId');

    if (machines.length === 0) {
      logger.info('✅ No machines found for export');
      return;
    }

    let totalExported = 0;

    // Export data for each machine
    for (const machineId of machines) {
      try {
        // Query events older than cutoff date
        const events = await Event.find({
          machineId,
          timestamp: { $lt: cutoffDate },
        })
          .sort({ timestamp: -1 })
          .lean();

        if (events.length === 0) {
          logger.info(`📦 No old data to export for machine ${machineId}`);
          continue;
        }

        // Generate export filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${machineId}_export_${timestamp}.json`;
        const filepath = path.join(exportDir, filename);

        // Write events to file
        const exportData = {
          machineId,
          exportDate: new Date().toISOString(),
          dataRange: {
            start: new Date(Math.min(...events.map((e) => e.timestamp))).toISOString(),
            end: new Date(Math.max(...events.map((e) => e.timestamp))).toISOString(),
          },
          eventCount: events.length,
          events,
        };

        fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
        const fileSize = fs.statSync(filepath).size;

        // Calculate checksum (simple hash for verification)
        const crypto = require('crypto');
        const checksum = crypto
          .createHash('sha256')
          .update(JSON.stringify(exportData))
          .digest('hex');

        // Record export in database
        const exportRecord = new Export({
          machineId,
          exportType: 'weekly',
          dateRange: {
            start: new Date(Math.min(...events.map((e) => e.timestamp))),
            end: new Date(Math.max(...events.map((e) => e.timestamp))),
          },
          exportPath: filepath,
          recordCount: events.length,
          exportedAt: new Date(),
          status: 'completed',
          fileSize,
          checksum,
        });

        await exportRecord.save();
        logger.info(
          `✅ Exported ${events.length} events for ${machineId} to ${filename}`
        );
        totalExported += events.length;
      } catch (err) {
        logger.error(`❌ Failed to export data for ${machineId}: ${err.message}`);

        // Record failed export
        const failedExport = new Export({
          machineId,
          exportType: 'weekly',
          dateRange: {
            start: cutoffDate,
            end: new Date(),
          },
          exportPath: 'N/A',
          recordCount: 0,
          exportedAt: new Date(),
          status: 'failed',
          errorMessage: err.message,
        });

        await failedExport.save();
      }
    }

    logger.info(`✅ Weekly export completed: ${totalExported} total events exported`);
  } catch (error) {
    logger.error(`❌ Weekly export failed: ${error.message}`);
  }
}

/**
 * Manual export trigger via API
 * @param {Date} startDate - Export data starting from this date
 * @param {Date} endDate - Export data up to this date
 * @param {string} machineId - Optional: specific machine to export (if not provided, exports all)
 */
async function triggerManualExport(startDate, endDate, machineId = null) {
  try {
    logger.info(`📦 Triggering manual export from ${startDate} to ${endDate}`);

    const exportDir = process.env.EXPORT_PATH || './exports';
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Query events in date range
    const query = {
      timestamp: { $gte: startDate, $lte: endDate },
    };
    if (machineId) {
      query.machineId = machineId;
    }

    const events = await Event.find(query).sort({ timestamp: -1 }).lean();

    if (events.length === 0) {
      logger.info('✅ No events found for manual export');
      return { success: false, message: 'No events found in date range' };
    }

    // Group by machineId if multiple machines
    const eventsByMachine = events.reduce((acc, event) => {
      if (!acc[event.machineId]) {
        acc[event.machineId] = [];
      }
      acc[event.machineId].push(event);
      return acc;
    }, {});

    const exportedFiles = [];

    // Export each machine's data
    for (const [mId, mEvents] of Object.entries(eventsByMachine)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${mId}_export_manual_${timestamp}.json`;
      const filepath = path.join(exportDir, filename);

      const exportData = {
        machineId: mId,
        exportDate: new Date().toISOString(),
        exportType: 'manual',
        dataRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        eventCount: mEvents.length,
        events: mEvents,
      };

      fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
      const fileSize = fs.statSync(filepath).size;

      // Calculate checksum
      const crypto = require('crypto');
      const checksum = crypto
        .createHash('sha256')
        .update(JSON.stringify(exportData))
        .digest('hex');

      // Record export
      const exportRecord = new Export({
        machineId: mId,
        exportType: 'manual',
        dateRange: {
          start: startDate,
          end: endDate,
        },
        exportPath: filepath,
        recordCount: mEvents.length,
        exportedAt: new Date(),
        status: 'completed',
        fileSize,
        checksum,
      });

      await exportRecord.save();
      exportedFiles.push({
        filename,
        recordCount: mEvents.length,
        fileSize,
      });
    }

    logger.info(`✅ Manual export completed: ${exportedFiles.length} files created`);
    return { success: true, files: exportedFiles };
  } catch (error) {
    logger.error(`❌ Manual export failed: ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Start the data exporter job
 * Runs weekly on Monday at 22:00 UTC
 */
function startDataExporter() {
  try {
    // Weekly job: 22:00 UTC every Monday
    const weeklyCron = process.env.EXPORT_WEEKLY_CRON || '0 22 * * 1';
    weeklyJob = schedule.scheduleJob(weeklyCron, exportOldData);
    logger.info(`✅ Weekly export job scheduled: ${weeklyCron}`);
  } catch (error) {
    logger.error(`❌ Error starting data exporter: ${error.message}`);
    throw error;
  }
}

/**
 * Stop the data exporter job
 */
function stopDataExporter() {
  if (weeklyJob) {
    weeklyJob.cancel();
    logger.info('✅ Weekly export job cancelled');
  }
}

module.exports = {
  exportOldData,
  triggerManualExport,
  startDataExporter,
  stopDataExporter,
};
