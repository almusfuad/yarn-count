/**
 * MQTT Client Connection Management
 * Delegates message handling to via mqttService
 */

import mqtt from 'mqtt';
import mqttService from './modules/MQTT/mqttService.js';
import logger from './utils/logger.js';

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';

let client = null;

export function startMqtt() {
  logger.info(`🔗 Connecting to MQTT broker: ${MQTT_BROKER}`);

  client = mqtt.connect(MQTT_BROKER);

  client.on('connect', () => {
    logger.info('✅ MQTT connected');
    client.subscribe('Device/+/+', (err) => {
      if (err) {
        logger.error('❌ Subscribe error:', err.message);
      } else {
        logger.info('📡 Subscribed to Device/+/+ topic');
      }
    });
  });

  client.on('message', (topic, message) => {
    try {
      logger.info(`\n[MQTT-RCV] ${'═'.repeat(50)}`);
      logger.info(`[MQTT-RCV] TOPIC   → ${topic}`);
      logger.info(`[MQTT-RCV] PAYLOAD → ${message.toString()}`);

      // Parse topic and delegate to service
      const parsed = mqttService.parseTopicAndPayload(topic, message);
      if (!parsed) {
        logger.warn(`⚠️ Failed to parse MQTT message on topic: ${topic}`);
        return;
      }

      const { machineId, msgType, payload } = parsed;

      // Validate payload structure
      if (!mqttService.validatePayload(msgType, payload)) {
        logger.warn(`⚠️ Invalid payload structure for ${msgType}`);
        return;
      }

      // Delegate to service for handling
      mqttService.handleMqttMessage(machineId, msgType, payload);
    } catch (err) {
      logger.error(`❌ Error processing MQTT message on ${topic}:`, err.message);
    }
  });

  client.on('error', (err) => {
    logger.error('❌ MQTT error:', err.message);
  });

  client.on('disconnect', () => {
    logger.warn('⚠️ MQTT disconnected');
  });

  client.on('offline', () => {
    logger.warn('⚠️ MQTT client offline');
  });

  client.on('reconnect', () => {
    logger.info('🔄 MQTT reconnecting...');
  });
}

function stopMqtt() {
  if (client) {
    logger.info('Stopping MQTT client...');
    client.end();
  }
}

export { stopMqtt, client };
