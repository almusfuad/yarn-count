export const MQTT_BROKER_URL = 'mqtt://mosquitto:1883';
export const MQTT_TOPIC_FILTER = 'Device/+/+';

export enum MqttMessageType {
  STATUS = 'Status',
  RAW_DATA = 'RawData',
  PROBLEM = 'Problem',
  PROBLEM_RESOLVED = 'ProblemResolved',
}

export enum MqttQoS {
  AT_MOST_ONCE = 0,
  AT_LEAST_ONCE = 1,
  EXACTLY_ONCE = 2,
}
