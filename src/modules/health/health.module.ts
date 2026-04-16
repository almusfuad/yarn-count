import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma-health.indicator';
import { MqttHealthIndicator } from './mqtt-health.indicator';
import { ExportsModule } from '../exports/exports.module';
import { MqttTransportModule } from '@/transport/mqtt/mqtt.module';

@Module({
  imports: [TerminusModule, ExportsModule, MqttTransportModule],
  providers: [HealthService, PrismaHealthIndicator, MqttHealthIndicator],
  controllers: [HealthController],
})
export class HealthModule {}
