import { Event } from './schemas.js';
import logger from '../utils/logger.js';

/**
 * Log an event to MongoDB asynchronously without blocking
 * Returns immediately, write happens in background
 * 
 * @param {string} type - Event type: pulse, status_change, problem, roll_weight, downtime, quality
 * @param {string} machineId - Machine identifier
 * @param {object} data - Type-specific event data
 * 
 * @example
 * logEvent('pulse', 'M1', { rotation: 5, runtime: '01:23', runtimeSeconds: 83 })
 * logEvent('status_change', 'M1', { newStatus: 'ON', oldStatus: 'OFF' })
 * logEvent('roll_weight', 'M1', { weight: 2.5, rollNumber: 42 })
 */
export async function logEvent(type, machineId, data) {
  try {
    // Fire and forget: don't wait for write to complete
    // This ensures broadcast is not blocked by MongoDB writes
    Promise.resolve().then(async () => {
      try {
        const event = new Event({
          type,
          machineId,
          timestamp: new Date(),
          data,
          createdAt: new Date(),
        });

        await event.save();
        // Optionally log successful write (can be noisy for high-frequency pulses)
        // console.log(`✅ Event logged: ${type} for ${machineId}`);
      } catch (writeError) {
        // Log write errors but don't throw (non-blocking)
        // Live data is unaffected if MongoDB write fails
        console.error(
          `❌ Failed to log event (${type}, ${machineId}):`,
          writeError.message
        );
        
        // Optional: queue failed writes for retry on next connection
        // For now, just log and continue
      }
    });

    // Return immediately - don't wait for Promise resolution
    return { queued: true };
  } catch (error) {
    // Catch synchronous errors only (shouldn't happen, but safety first)
    console.error(`❌ Error queueing event (${type}, ${machineId}):`, error.message);
    return { queued: false, error: error.message };
  }
}

/**
 * Batch log multiple events (useful for bulk operations)
 * Still non-blocking - events are queued for background writes
 */
export async function logEventBatch(events) {
  try {
    Promise.resolve().then(async () => {
      try {
        const formattedEvents = events.map((evt) => ({
          type: evt.type,
          machineId: evt.machineId,
          timestamp: new Date(),
          data: evt.data,
          createdAt: new Date(),
        }));

        await Event.insertMany(formattedEvents);
        console.log(`✅ Batch logged: ${events.length} events`);
      } catch (writeError) {
        console.error(
          `❌ Failed to log batch (${events.length} events):`,
          writeError.message
        );
      }
    });

    return { queued: true, count: events.length };
  } catch (error) {
    console.error(`❌ Error queueing batch:`, error.message);
    return { queued: false, error: error.message };
  }
}

/**
 * Get event count for a machine within date range
 * Used for health checks and debugging
 */
export async function getEventCount(machineId, startDate, endDate) {
  try {
    const count = await Event.countDocuments({
      machineId,
      timestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    });
    return count;
  } catch (error) {
    console.error('❌ Error getting event count:', error.message);
    return 0;
  }
}

/**
 * Query events with filters (used by history endpoints)
 */
export async function queryEvents(machineId, startDate, endDate, type = null) {
  try {
    const query = {
      machineId,
      timestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (type) {
      query.type = type;
    }

    const events = await Event.find(query)
      .sort({ timestamp: -1 })
      .lean();
    
    return events;
  } catch (error) {
    console.error('❌ Error querying events:', error.message);
    return [];
  }
}
