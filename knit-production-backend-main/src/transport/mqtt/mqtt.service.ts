import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, MqttClient } from 'mqtt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SensorsService } from '@/modules/sensors/sensors.service';
import { AppLoggerService } from '@/common/logger/logger.service';
import {
  MQTT_BROKER_URL,
  MQTT_TOPIC_FILTER,
  MqttMessageType,
} from '@/core/constants/mqtt.constants';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private client: MqttClient | null = null;
  private logger = new Logger(MqttService.name);
  private isConnected: boolean = false;

  constructor(
    private config: ConfigService,
    private sensorsService: SensorsService,
    private events: EventEmitter2,
    private appLogger: AppLoggerService,
  ) {}

  async onModuleInit() {
    try {
      const brokerUrl = this.config.get('MQTT_BROKER_URL', MQTT_BROKER_URL);
      const brokerPassword = this.config.get('MQTT_PASSWORD');
      const brokerUser = this.config.get('MQTT_USER');

      this.client = connect(brokerUrl, {
        username: brokerUser,
        password: brokerPassword,
        reconnectPeriod: 5000,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`✅ Connected to MQTT broker: ${brokerUrl}`);
        this.appLogger.log(`✅ Connected to MQTT broker: ${brokerUrl}`);
        this.logger.log(`📨 Subscribed to topic: ${MQTT_TOPIC_FILTER}`);
        this.client!.subscribe(MQTT_TOPIC_FILTER, { qos: 1 });
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      this.client.on('error', (error: any) => {
        this.logger.error(`❌ MQTT error: ${error?.message}`);
        this.appLogger.error(`❌ MQTT error: ${error?.message}`);
      });

      this.client.on('disconnect', () => {
        this.isConnected = false;
        this.logger.warn('⚠️  Disconnected from MQTT broker');
      });
    } catch (error: any) {
      this.logger.error(`Failed to initialize MQTT: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Handle MQTT messages
   */
  private async handleMessage(topic: string, message: Buffer) {
    try {
      // Parse topic: Device/{deviceId}/{messageType}
      const parts = topic.split('/');
      if (parts.length < 3) return;

      const machineId = parts[1];
      const messageType = parts[2];
      const payload = JSON.parse(message.toString());

      this.logger.debug(
        `📨 MQTT Message - Machine: ${machineId}, Type: ${messageType}`,
      );

      // Route to appropriate handler
      switch (messageType) {
        case MqttMessageType.STATUS:
          await this.sensorsService.handleMachineStatus(machineId, payload);
          break;

        case MqttMessageType.RAW_DATA:
          await this.sensorsService.handleRawData(machineId, payload);
          break;

        case MqttMessageType.PROBLEM:
          await this.sensorsService.handleProblem(machineId, payload);
          // Emit alert event for Telegram
          this.events.emit('alert.new', {
            machineId,
            type: 'problem',
            message: payload.problem,
            timestamp: new Date(),
          });
          break;

        case MqttMessageType.PROBLEM_RESOLVED:
          await this.sensorsService.handleProblemResolved(machineId);
          break;

        default:
          this.logger.warn(`Unknown MQTT message type: ${messageType}`);
      }
    } catch (error: any) {
      this.logger.error(`Error handling MQTT message: ${error?.message}`);
    }
  }

  /**
   * Publish MQTT message
   */
  async publish(topic: string, message: any, qos: number = 1) {
    try {
      this.client?.publish(topic, JSON.stringify(message), { qos } as any);
    } catch (error: any) {
      this.logger.error(`Error publishing MQTT message: ${error?.message}`);
    }
  }

  /**
   * Get MQTT connection status
   */
  getConnectionStatus(): { isConnected: boolean; status: string } {
    return {
      isConnected: this.isConnected,
      status: this.isConnected ? 'connected' : 'disconnected',
    };
  }

  /**
   * On module destroy
   */
  async onModuleDestroy() {
    if (this.client) {
      this.client.end();
      this.logger.log('MQTT client disconnected');
    }
  }
}
