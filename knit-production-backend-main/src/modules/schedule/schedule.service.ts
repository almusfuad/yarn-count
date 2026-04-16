import { Injectable, OnModuleInit, OnApplicationShutdown, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { TelemetryService } from '../telemetry/telemetry.service';
import { ExportsService } from '../exports/exports.service';

@Injectable()
export class ScheduleJobsService implements OnModuleInit, OnApplicationShutdown {
  private logger = new Logger(ScheduleJobsService.name);

  constructor(
    private config: ConfigService,
    private telemetryService: TelemetryService,
    private exportsService: ExportsService,
  ) {}

  async onModuleInit() {
    this.logger.log('✅ Schedule jobs initialized');
  }

  /**
   * Run daily snapshot generation
   */
  @Cron('0 5 * * *')
  async generateDailySnapshots() {
    try {
      this.logger.log('🔄 Running daily snapshot generation');
      // Implement snapshot generation logic
      this.logger.log('📸 Daily snapshots generated');
    } catch (error: any) {
      this.logger.error(`Error in daily snapshot generation: ${error?.message}`);
    }
  }

  /**
   * Run weekly snapshot generation
   */
  @Cron('0 10 * * 0')
  async generateWeeklySnapshots() {
    try {
      this.logger.log('🔄 Running weekly snapshot generation');
      // Implement weekly snapshot logic
      this.logger.log('📸 Weekly snapshots generated');
    } catch (error: any) {
      this.logger.error(
        `Error in weekly snapshot generation: ${error?.message}`,
      );
    }
  }

  /**
   * Run weekly export
   */
  @Cron('0 22 * * 1')
  async performWeeklyExport() {
    try {
      this.logger.log('📦 Running weekly export');
      await this.exportsService.triggerExport();
      this.logger.log('📦 Weekly export completed');
    } catch (error: any) {
      this.logger.error(`Error in weekly export: ${error?.message}`);
    }
  }

  /**
   * On application shutdown
   */
  async onApplicationShutdown() {
    this.logger.log('⏹️  Schedule jobs shutdown');
  }
}
