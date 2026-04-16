import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { SensorsModule } from '../sensors/sensors.module';
import { TelemetryModule } from '../telemetry/telemetry.module';

@Module({
  imports: [SensorsModule, TelemetryModule],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
