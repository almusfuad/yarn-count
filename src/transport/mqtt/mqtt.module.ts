import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { SensorsModule } from '@/modules/sensors/sensors.module';

@Module({
  imports: [SensorsModule],
  providers: [MqttService],
})
export class MqttTransportModule {}
