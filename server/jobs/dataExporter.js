import schedule from 'node-schedule';
import eventRepository from '../modules/Event/eventRepository.js';
import exportRepository from '../modules/Export/exportRepository.js';
import exportService from '../modules/Export/exportService.js';
import logger from '../utils/logger.js';

let weeklyJob = null;

/**
 * Export data older than 13.5 months to prevent loss due to TTL deletion
 * Runs weekly on Monday at 22:00 UTC
 */
export async function exportOldData() {
  try {
    logger.info('📦 Starting weekly data export...');

    // Calculate cutoff date: 13.5 months ago
    // This ensures we export before TTL (15 months) deletes the data
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setMonth(cutoffDate.getMonth() - 13);
    cutoffDate.setDate(cutoffDate.getDate() - 15); // 13.5 months ≈ 405 days

    logger.info(`📦 Exporting events older than ${cutoffDate.toISOString()}`);

    // Get all unique machineIds via repository
    const machines = await eventRepository.getDistinctMachineIds();

    if (machines.length === 0) {
      logger.info('✅ No machines found for export');
      return;
    }

    let totalExported = 0;

    // Export data for each machine
    for (const machineId of machines) {
      try {
        // Query events older than cutoff date via repository
        const events = await eventRepository.queryEvents(
          machineId,
          new Date('1970-01-01'),
          cutoffDate
        );

        if (events.length === 0) {
          logger.info(`📦 No old data to export for machine ${machineId}`);
          continue;
        }

        // Trigger export via service
        const startDate = new Date(Math.min(...events.map((e) => e.timestamp)));
        const endDate = new Date(Math.max(...events.map((e) => e.timestamp)));

        await exportService.triggerExport(machineId, startDate, endDate, 'weekly');
        
        logger.info(
          `✅ Queued export of ${events.length} events for ${machineId}`
        );
        totalExported += events.length;
      } catch (err) {
        logger.error(`❌ Failed to export data for ${machineId}: ${err.message}`);
      }
    }

    logger.info(`✅ Weekly export completed: ${totalExported} total events queued for export`);
  } catch (error) {
    logger.error(`❌ Weekly export failed: ${error.message}`);
  }
}

/**
 * Start the data exporter job
 * Runs weekly on Monday at 22:00 UTC
 */
export function startDataExporter() {
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
 * Called on server shutdown
 */
export function stopDataExporter() {
  if (weeklyJob) {
    weeklyJob.cancel();
    logger.info('✅ Weekly export job cancelled');
  }
}
