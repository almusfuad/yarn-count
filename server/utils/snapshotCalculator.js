import { prisma } from '../db/prisma.js';

/**
 * Calculate KPI metrics from raw events for a date range
 * Used by snapshot generator to create pre-computed aggregates
 */
export async function calculateKPIMetrics(machineId, startDate, endDate) {
  try {
    // Query all events for the machine in the date range
    const events = await prisma.event.findMany({
      where: {
        machineId,
        timestamp: { gte: startDate, lte: endDate },
      },
    });

    // Initialize metrics
    const metrics = {
      totalPulses: 0,
      totalRuntime: 0, // in seconds
      totalDowntime: 0, // in seconds
      problemCount: 0,
      averageRollWeight: 0,
      qualityLogCount: 0,
      downtimeLogCount: 0,
      machineTimesActuallyRanInMinutes: 0,
      actualRollsCompleted: 0,
      qualityDefects: 0,
    };

    // Aggregate metrics by event type
    const runtimeValues = [];
    const downtimeValues = [];
    const weightValues = [];

    for (const event of events) {
      switch (event.type) {
        case 'pulse':
          metrics.totalPulses++;
          if (event.data.runtimeSeconds) {
            runtimeValues.push(event.data.runtimeSeconds);
            metrics.actualRollsCompleted = Math.max(
              metrics.actualRollsCompleted,
              event.data.rollsCompleted || 0
            );
          }
          break;

        case 'status_change':
          if (event.data.runtimeSeconds) {
            metrics.totalRuntime = Math.max(
              metrics.totalRuntime,
              event.data.runtimeSeconds
            );
          }
          if (event.data.downtimeSeconds) {
            metrics.totalDowntime = Math.max(
              metrics.totalDowntime,
              event.data.downtimeSeconds
            );
          }
          break;

        case 'problem':
          metrics.problemCount++;
          break;

        case 'roll_weight':
          if (event.data.weight) {
            weightValues.push(event.data.weight);
          }
          break;

        case 'downtime':
          metrics.downtimeLogCount++;
          break;

        case 'quality':
          metrics.qualityLogCount++;
          metrics.qualityDefects++;
          break;

        default:
          break;
      }
    }

    // Calculate averages
    if (weightValues.length > 0) {
      metrics.averageRollWeight =
        weightValues.reduce((a, b) => a + b, 0) / weightValues.length;
    }

    metrics.machineTimesActuallyRanInMinutes = Math.round(
      metrics.totalRuntime / 60
    );

    return metrics;
  } catch (error) {
    console.error('❌ Error calculating KPI metrics:', error.message);
    throw error;
  }
}
