/**
 * Event Repository
 * Data access layer for Event collection in MongoDB
 */

const { Event: EventModel } = require('../../db/schemas');
const logger = require('../../utils/logger');

class EventRepository {
  /**
   * Create a new event in MongoDB
   * Non-blocking: returns immediately, write happens asynchronously
   */
  async logEvent(type, machineId, data) {
    try {
      Promise.resolve().then(async () => {
        try {
          const event = new EventModel({
            type,
            machineId,
            timestamp: new Date(),
            data,
            createdAt: new Date(),
          });

          await event.save();
          // Optionally log successful write (can be noisy for high-frequency pulses)
          // logger.info(`✅ Event logged: ${type} for ${machineId}`);
        } catch (writeError) {
          // Log write errors but don't throw (non-blocking)
          logger.error(
            `❌ Failed to log event (${type}, ${machineId}):`,
            writeError.message
          );
        }
      });

      // Return immediately - don't wait for Promise resolution
      return { queued: true };
    } catch (error) {
      logger.error(`❌ Error queueing event (${type}, ${machineId}):`, error.message);
      return { queued: false, error: error.message };
    }
  }

  /**
   * Batch log multiple events
   * Still non-blocking - events are queued for background writes
   */
  async logEventBatch(events) {
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

          await EventModel.insertMany(formattedEvents);
          logger.info(`✅ Batch logged: ${events.length} events`);
        } catch (writeError) {
          logger.error(
            `❌ Failed to log batch (${events.length} events):`,
            writeError.message
          );
        }
      });

      return { queued: true, count: events.length };
    } catch (error) {
      logger.error(`❌ Error queueing batch:`, error.message);
      return { queued: false, error: error.message };
    }
  }

  /**
   * Get event count for a machine within date range
   */
  async getEventCount(machineId, startDate, endDate) {
    try {
      const count = await EventModel.countDocuments({
        machineId,
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      });
      return count;
    } catch (error) {
      logger.error('❌ Error getting event count:', error.message);
      return 0;
    }
  }

  /**
   * Query events with filters
   */
  async queryEvents(machineId, startDate, endDate, type = null) {
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

      const events = await EventModel.find(query)
        .sort({ timestamp: -1 })
        .lean();

      return events;
    } catch (error) {
      logger.error('❌ Error querying events:', error.message);
      return [];
    }
  }

  /**
   * Get events by type for a machine
   */
  async getEventsByType(machineId, type, limit = 100) {
    try {
      const events = await EventModel.find({ machineId, type })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return events;
    } catch (error) {
      logger.error(`❌ Error querying events by type (${type}):`, error.message);
      return [];
    }
  }

  /**
   * Get all distinct machine IDs that have events
   */
  async getDistinctMachineIds() {
    try {
      const machineIds = await EventModel.distinct('machineId');
      return machineIds;
    } catch (error) {
      logger.error('❌ Error getting distinct machine IDs:', error.message);
      return [];
    }
  }

  /**
   * Delete events older than a cutoff date
   */
  async deleteEventsBefore(cutoffDate) {
    try {
      const result = await EventModel.deleteMany({
        timestamp: { $lt: cutoffDate },
      });
      logger.info(`✅ Deleted ${result.deletedCount} events before ${cutoffDate}`);
      return result.deletedCount;
    } catch (error) {
      logger.error('❌ Error deleting old events:', error.message);
      return 0;
    }
  }
}

module.exports = new EventRepository();
