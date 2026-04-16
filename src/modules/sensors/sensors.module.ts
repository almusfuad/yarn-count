import { Module } from '@nestjs/common';
import { SensorsService } from './sensors.service';
import { SensorsController } from './sensors.controller';
import { DatabaseModule } from '@/common/database/database.module';
import { RedisModule } from '@/common/redis/redis.module';  
import { LoggerModule } from '@/common/logger/logger.module';

@Module({
  imports: [DatabaseModule, RedisModule, LoggerModule],
  providers: [SensorsService],
  controllers: [SensorsController],
  exports: [SensorsService],
})
export class SensorsModule {}
