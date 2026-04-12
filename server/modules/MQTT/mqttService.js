/**
 * MQTT Service
 * Orchestrates routing of MQTT messages to appropriate handlers
 */

import machineService from '../Machine/machineService.js';
import telegramService from '../Telegram/telegramService.js';
import logger from '../../utils/logger.js';

class MQTTService {
  /**
   * Handle incoming MQTT message and route to appropriate handler
   */
  handleMqttMessage(machineId, msgType, payload) {
    try {
      logger.info(`[MQTT] Received: Device/${machineId}/${msgType}`);
      logger.info(`[MQTT] Payload: ${JSON.stringify(payload)}`);

      switch (msgType) {
        case 'Machine_Status':
          machineService.handleMachineStatus(machineId, payload);
          break;

        case 'Raw_Data':
          machineService.handleRawData(machineId, payload);
          break;

        case 'Problem':
          machineService.handleProblem(machineId, payload);
          // Send Telegram notification for problems
          telegramService.sendProblemAlert(machineId, payload);
          break;

        default:
          logger.warn(`[MQTT] Unknown message type: ${msgType}`);
      }
    } catch (error) {
      logger.error(`❌ Error handling MQTT message:`, error.message);
    }
  }

  /**
   * Parse MQTT topic to extract machine ID and message type
   * Topic format: Device/{machineId}/{msgType}
   */
  parseTopicAndPayload(topic, rawMessage) {
    try {
      const parts = topic.split('/');
      if (parts.length !== 3 || parts[0] !== 'Device') {
        logger.warn(`[MQTT] Invalid topic format: ${topic}`);
        return null;
      }

      const machineId = parts[1];
      const msgType = parts[2];

      let payload;
      try {
        payload = JSON.parse(rawMessage.toString());
      } catch (parseError) {
        logger.warn(`[MQTT] Failed to parse JSON payload for ${topic}:`, parseError.message);
        payload = { raw: rawMessage.toString() };
      }

      return { machineId, msgType, payload };
    } catch (error) {
      logger.error(`❌ Error parsing MQTT topic:`, error.message);
      return null;
    }
  }

  /**
   * Validate MQTT payload structure
   */
  validatePayload(msgType, payload) {
    try {
      switch (msgType) {
        case 'Machine_Status':
          return (
            payload.Status &&
            (payload.Status === 'ON' || payload.Status === 'OFF') &&
            typeof payload.RT === 'string' &&
            typeof payload.DT === 'string'
          );

        case 'Raw_Data':
          return (
            typeof payload.Rotation === 'number' &&
            typeof payload.RT === 'string'
          );

        case 'Problem':
          return (
            payload.Problem &&
            typeof payload.Problem === 'string' &&
            typeof payload.Downtime === 'string'
          );

        default:
          return true; // Unknown types pass through
      }
    } catch (error) {
      logger.error(`❌ Error validating payload:`, error.message);
      return false;
    }
  }
}

export default new MQTTService();
