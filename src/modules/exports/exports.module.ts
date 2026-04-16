import { Module } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { DatabaseModule } from '@/common/database/database.module';
import { LoggerModule } from '@/common/logger/logger.module';

@Module({
  imports: [TelemetryModule, DatabaseModule, LoggerModule],
  providers: [ExportsService],
  controllers: [ExportsController],
  exports: [ExportsService],
})
export class ExportsModule {}
