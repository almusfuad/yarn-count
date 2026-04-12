/**
 * Event Service
 * Business logic for event management and logging
 */

import eventRepository from './eventRepository.js';
import logger from '../../utils/logger.js';

class EventService {
  /**
   * Log an event
   */
  async logEvent(type, machineId, data) {
    try {
      return await eventRepository.logEvent(type, machineId, data);
    } catch (error) {
      logger.error(`❌ Error in EventService.logEvent:`, error.message);
      throw error;
    }
  }

  /**
   * Batch log events
   */
  async logEventBatch(events) {
    try {
      return await eventRepository.logEventBatch(events);
    } catch (error) {
      logger.error(`❌ Error in EventService.logEventBatch:`, error.message);
      throw error;
    }
  }

  /**
   * Query events for a machine within date range
   */
  async queryEvents(machineId, startDate, endDate, type = null) {
    try {
      return await eventRepository.queryEvents(machineId, startDate, endDate, type);
    } catch (error) {
      logger.error(`❌ Error in EventService.queryEvents:`, error.message);
      return [];
    }
  }

  /**
   * Get events by type
   */
  async getEventsByType(machineId, type, limit = 100) {
    try {
      return await eventRepository.getEventsByType(machineId, type, limit);
    } catch (error) {
      logger.error(`❌ Error in EventService.getEventsByType:`, error.message);
      return [];
    }
  }

  /**
   * Get event count
   */
  async getEventCount(machineId, startDate, endDate) {
    try {
      return await eventRepository.getEventCount(machineId, startDate, endDate);
    } catch (error) {
      logger.error(`❌ Error in EventService.getEventCount:`, error.message);
      return 0;
    }
  }

  /**
   * Get all distinct machine IDs
   */
  async getDistinctMachineIds() {
    try {
      return await eventRepository.getDistinctMachineIds();
    } catch (error) {
      logger.error(`❌ Error in EventService.getDistinctMachineIds:`, error.message);
      return [];
    }
  }

  /**
   * Get machine event statistics
   */
  async getMachineEventStats(machineId, startDate, endDate) {
    try {
      const eventTypes = ['pulse', 'status_change', 'problem', 'roll_weight', 'downtime', 'quality'];
      const stats = {};

      for (const type of eventTypes) {
        stats[type] = await eventRepository.getEventsByType(machineId, type, 1000).then(events => events.length);
      }

      return {
        machineId,
        startDate,
        endDate,
        ...stats
      };
    } catch (error) {
      logger.error(`❌ Error in EventService.getMachineEventStats:`, error.message);
      return null;
    }
  }
}

export default new EventService();
