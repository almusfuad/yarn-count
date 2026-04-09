// MQTT client and message router

const mqtt = require('mqtt');
const {
  handleMachineStatus,
  handleRawData,
  handleProblem
} = require('./machines');
const { broadcast } = require('./broadcast');

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';

let client = null;

function handleMqttMessage(topic, message) {
  try {
    const messageStr = message.toString();
    console.log(`\n[MQTT-RCV] ═══════════════════════════════════════`);
    console.log(`[MQTT-RCV] TOPIC  → ${topic}`);
    console.log(`[MQTT-RCV] PAYLOAD→ ${messageStr}`);

    const parts = topic.split('/');
    if (parts.length < 3) {
      console.error(`[MQTT-RCV] ✗ Invalid topic format: ${topic} (expected Device/machineId/type)`);
      return;
    }

    const [, machineId, msgType] = parts;
    let payload;

    try {
      payload = JSON.parse(messageStr);
    } catch (parseErr) {
      console.error(`[MQTT-RCV] ✗ JSON parse error: ${parseErr.message}`);
      return;
    }

    switch (msgType) {
      case 'machine_status':
        handleMachineStatus(machineId, payload);
        break;
      case 'machine_rawdata':
        handleRawData(machineId, payload);
        break;
      case 'problem':
        handleProblem(machineId, payload);
        break;
      default:
        console.warn(`[MQTT-RCV] ⚠ Unknown message type: ${msgType}`);
    }
  } catch (err) {
    console.error(`[MQTT-RCV] ✗ Unexpected error: ${err.message}`);
  }
}

function startMqtt() {
  console.log(`Connecting to MQTT broker: ${MQTT_BROKER}`);
  
  client = mqtt.connect(MQTT_BROKER);

  client.on('connect', () => {
    console.log('MQTT connected');
    client.subscribe('Device/+/+', (err) => {
      if (err) {
        console.error('Subscribe error:', err);
      } else {
        console.log('Subscribed to Device/+/+');
      }
    });
  });

  client.on('message', (topic, message) => {
    try {
      handleMqttMessage(topic, message);
    } catch (err) {
      console.error(`Error processing MQTT message on ${topic}:`, err);
    }
  });

  client.on('error', (err) => {
    console.error('MQTT error:', err);
  });

  client.on('disconnect', () => {
    console.log('MQTT disconnected');
  });
}

function stopMqtt() {
  if (client) {
    client.end();
  }
}

module.exports = {
  startMqtt,
  stopMqtt
};
