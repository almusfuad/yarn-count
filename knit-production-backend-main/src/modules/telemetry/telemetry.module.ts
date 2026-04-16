import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { DatabaseModule } from '@/common/database/database.module';
import { LoggerModule } from '@/common/logger/logger.module';

@Module({
  imports: [DatabaseModule, LoggerModule],
  providers: [TelemetryService],
  controllers: [TelemetryController],
  exports: [TelemetryService],
})
export class TelemetryModule {}
