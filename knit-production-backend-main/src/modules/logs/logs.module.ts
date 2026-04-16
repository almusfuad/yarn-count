import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { SensorsModule } from '../sensors/sensors.module';

@Module({
  imports: [SensorsModule],
  controllers: [LogsController],
})
export class LogsModule {}
