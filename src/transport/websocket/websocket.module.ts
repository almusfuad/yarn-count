import { Module } from '@nestjs/common';
import { AppWebSocketGateway } from './websocket.gateway';
import { SensorsModule } from '@/modules/sensors/sensors.module';
import { TelemetryModule } from '@/modules/telemetry/telemetry.module';

@Module({
  imports: [SensorsModule, TelemetryModule],
  providers: [AppWebSocketGateway],
})
export class WebSocketGatewayModule {}
