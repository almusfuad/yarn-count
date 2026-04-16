import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma-health.indicator';
import { ExportsModule } from '../exports/exports.module';

@Module({
  imports: [TerminusModule, ExportsModule],
  providers: [HealthService, PrismaHealthIndicator],
  controllers: [HealthController],
})
export class HealthModule {}
