import { Module } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';
import { TelemetryModule } from '../telemetry/telemetry.module';

@Module({
  imports: [TelemetryModule],
  providers: [ExportsService],
  controllers: [ExportsController],
  exports: [ExportsService],
})
export class ExportsModule {}
