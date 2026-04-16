import { Module } from '@nestjs/common';
import { ScheduleJobsService } from './schedule.service';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { ExportsModule } from '../exports/exports.module';

@Module({
  imports: [TelemetryModule, ExportsModule],
  providers: [ScheduleJobsService],
})
export class ScheduleJobsModule {}
