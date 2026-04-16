import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { MqttService } from '@/transport/mqtt/mqtt.service';

@Injectable()
export class MqttHealthIndicator extends HealthIndicator {
  constructor(private mqtt: MqttService) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      const status = this.mqtt.getConnectionStatus();

      if (status.isConnected) {
        return this.getStatus('mqtt', status.isConnected);
      } else {
        throw new Error('MQTT broker disconnected');
      }
    } catch (error: any) {
      throw new HealthCheckError(
        'MQTT check failed',
        this.getStatus('mqtt', false, { error: error?.message }),
      );
    }
  }
}
