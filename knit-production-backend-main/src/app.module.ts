import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

// Core modules
import { DatabaseModule } from './common/database/database.module';
import { LoggerModule } from './common/logger/logger.module';
import { RedisModule } from './common/redis/redis.module';

// Domain modules
import { SensorsModule } from './modules/sensors/sensors.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { LogsModule } from './modules/logs/logs.module';
import { ExportsModule } from './modules/exports/exports.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { VersionModule } from './modules/version/version.module';
import { ScheduleJobsModule } from './modules/schedule/schedule.module';

// Transport modules
import { MqttTransportModule } from './transport/mqtt/mqtt.module';
import { WebSocketGatewayModule } from './transport/websocket/websocket.module';

// Auth guard
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    // Global config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),


    // Event bus (decouples cross-module communication)
    EventEmitterModule.forRoot(),

    // Global infrastructure modules
    DatabaseModule,
    LoggerModule,
    RedisModule,

    // Schedule module for cron jobs
    ScheduleModule.forRoot(),

    // Domain modules
    SensorsModule,
    TelemetryModule,
    DashboardModule,
    LogsModule,
    ExportsModule,
    HealthModule,
    AuthModule,
    TelegramModule,
    VersionModule,
    ScheduleJobsModule,

    // Transport modules
    MqttTransportModule,
    WebSocketGatewayModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
