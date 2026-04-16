import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { LoggerModule } from '@/common/logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
