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
  const payload = JSON.parse(message.toString());
  const parts = topic.split('/');
  
  if (parts.length < 3) return;
  
  const [, machineId, msgType] = parts;

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
      console.log(`Unknown message type: ${msgType}`);
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
