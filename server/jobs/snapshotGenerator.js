const schedule = require('node-schedule');
const eventRepository = require('../modules/Event/eventRepository');
const kpiRepository = require('../modules/Event/kpiRepository');
const { calculateKPIMetrics } = require('../utils/snapshotCalculator');
const logger = require('../utils/logger');

let dailyJob = null;
let weeklyJob = null;

/**
 * Generate daily KPI snapshots at 00:05 UTC
 * Aggregates all events from the previous day for each machine
 */
async function generateDailySnapshots() {
  try {
    logger.info('📊 Starting daily snapshot generation...');

    // Calculate yesterday's date range
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const dayEnd = new Date(yesterday);
    dayEnd.setHours(23, 59, 59, 999);

    // Get all unique machineIds from yesterday's events via repository
    const machines = await eventRepository.getDistinctMachineIds();

    if (machines.length === 0) {
      logger.info('✅ No events found for daily snapshot generation');
      return;
    }

    let snapshotsCreated = 0;

    // Create snapshot for each machine
    for (const machineId of machines) {
      try {
        // Check if snapshot already exists
        const exists = await kpiRepository.snapshotExists(machineId, yesterday, 'daily');
        if (exists) {
          logger.info(`⏭️  Daily snapshot already exists for ${machineId}`);
          continue;
        }

        const metrics = await calculateKPIMetrics(machineId, yesterday, dayEnd);

        // Save snapshot via repository
        await kpiRepository.saveSnapshot({
          machineId,
          period: 'daily',
          snapshotDate: yesterday,
          metrics,
          createdAt: new Date()
        });

        snapshotsCreated++;
      } catch (err) {
        logger.error(
          `❌ Failed to generate daily snapshot for ${machineId}: ${err.message}`
        );
      }
    }

    logger.info(`✅ Daily snapshot generation completed: ${snapshotsCreated} snapshots created`);
  } catch (error) {
    logger.error(`❌ Daily snapshot generation failed: ${error.message}`);
  }
}

/**
 * Generate weekly KPI snapshots at 00:10 UTC on Sundays
 * Aggregates all events from the previous week (Mon-Sun) for each machine
 */
async function generateWeeklySnapshots() {
  try {
    logger.info('📊 Starting weekly snapshot generation...');

    // Calculate last week's date range (previous Sunday to Saturday)
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek; // If Sunday, go back 7 days; else go back to previous Sunday

    const weekStart = new Date(now);
    weekStart.setUTCDate(weekStart.getUTCDate() - daysToSubtract);
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    // Get all unique machineIds from last week's events via repository
    const machines = await eventRepository.getDistinctMachineIds();

    if (machines.length === 0) {
      logger.info('✅ No events found for weekly snapshot generation');
      return;
    }

    let snapshotsCreated = 0;

    // Create snapshot for each machine
    for (const machineId of machines) {
      try {
        // Check if snapshot already exists
        const exists = await kpiRepository.snapshotExists(machineId, weekStart, 'weekly');
        if (exists) {
          logger.info(`⏭️  Weekly snapshot already exists for ${machineId}`);
          continue;
        }

        const metrics = await calculateKPIMetrics(machineId, weekStart, weekEnd);

        // Save snapshot via repository
        await kpiRepository.saveSnapshot({
          machineId,
          period: 'weekly',
          snapshotDate: weekStart,
          metrics,
          createdAt: new Date()
        });

        snapshotsCreated++;
      } catch (err) {
        logger.error(
          `❌ Failed to generate weekly snapshot for ${machineId}: ${err.message}`
        );
      }
    }

    logger.info(`✅ Weekly snapshot generation completed: ${snapshotsCreated} snapshots created`);
  } catch (error) {
    logger.error(`❌ Weekly snapshot generation failed: ${error.message}`);
  }
}

/**
 * Start the snapshot generator jobs
 * Called on server startup
 */
function startSnapshotGenerator() {
  try {
    // Daily job: 00:05 UTC every day
    const dailyCron = process.env.SNAPSHOT_DAILY_CRON || '0 5 * * *';
    dailyJob = schedule.scheduleJob(dailyCron, generateDailySnapshots);
    logger.info(`✅ Daily snapshot job scheduled: ${dailyCron}`);

    // Weekly job: 00:10 UTC every Sunday
    const weeklyCron = process.env.SNAPSHOT_WEEKLY_CRON || '0 10 * * 0';
    weeklyJob = schedule.scheduleJob(weeklyCron, generateWeeklySnapshots);
    logger.info(`✅ Weekly snapshot job scheduled: ${weeklyCron}`);

    // Optionally run on startup (commented out for now)
    // generateDailySnapshots();
    // generateWeeklySnapshots();
  } catch (error) {
    logger.error(`❌ Error starting snapshot generator: ${error.message}`);
    throw error;
  }
}

/**
 * Stop the snapshot generator jobs
 * Called on server shutdown
 */
function stopSnapshotGenerator() {
  if (dailyJob) {
    dailyJob.cancel();
    logger.info('✅ Daily snapshot job cancelled');
  }
  if (weeklyJob) {
    weeklyJob.cancel();
    logger.info('✅ Weekly snapshot job cancelled');
  }
}

module.exports = {
  generateDailySnapshots,
  generateWeeklySnapshots,
  startSnapshotGenerator,
  stopSnapshotGenerator,
};

/**
 * Start the snapshot generator jobs
 * Called on server startup
 */
function startSnapshotGenerator() {
  try {
    // Daily job: 00:05 UTC every day
    const dailyCron = process.env.SNAPSHOT_DAILY_CRON || '0 5 * * *';
    dailyJob = schedule.scheduleJob(dailyCron, generateDailySnapshots);
    logger.info(`✅ Daily snapshot job scheduled: ${dailyCron}`);

    // Weekly job: 00:10 UTC every Sunday
    const weeklyCron = process.env.SNAPSHOT_WEEKLY_CRON || '0 10 * * 0';
    weeklyJob = schedule.scheduleJob(weeklyCron, generateWeeklySnapshots);
    logger.info(`✅ Weekly snapshot job scheduled: ${weeklyCron}`);

    // Optionally run on startup (commented out for now)
    // generateDailySnapshots();
    // generateWeeklySnapshots();
  } catch (error) {
    logger.error(`❌ Error starting snapshot generator: ${error.message}`);
    throw error;
  }
}

/**
 * Stop the snapshot generator jobs
 * Called on server shutdown
 */
function stopSnapshotGenerator() {
  if (dailyJob) {
    dailyJob.cancel();
    logger.info('✅ Daily snapshot job cancelled');
  }
  if (weeklyJob) {
    weeklyJob.cancel();
    logger.info('✅ Weekly snapshot job cancelled');
  }
}

module.exports = {
  generateDailySnapshots,
  generateWeeklySnapshots,
  startSnapshotGenerator,
  stopSnapshotGenerator,
};
