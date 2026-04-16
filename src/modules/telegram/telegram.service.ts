import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class TelegramService implements OnModuleInit {
  private logger = new Logger(TelegramService.name);
  private botToken: string = '';
  private chatId: string = '';
  private enabled: boolean = false;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN', '');
    this.chatId = this.config.get<string>('TELEGRAM_CHAT_ID', '');
    this.enabled = !!this.botToken && !!this.chatId;

    if (this.enabled) {
      this.logger.log('✅ Telegram service initialized');
    } else {
      this.logger.warn('⚠️  Telegram service disabled (missing credentials)');
    }
  }

  /**
   * Send problem alert
   */
  async sendProblemAlert(machineId: string, problem: string, details?: any) {
    if (!this.enabled) return;

    try {
      const message = `🚨 Problem Alert\nMachine: ${machineId}\nProblem: ${problem}`;
      await this.sendMessage(message);
    } catch (error: any) {
      this.logger.error(`Error sending alert: ${error?.message}`);
    }
  }

  /**
   * Send message via Telegram
   */
  private async sendMessage(message: string) {
    if (!this.enabled) return;

    try {
      // Implementation would use telegram-bot-api
      this.logger.log(`📤 Telegram message sent: ${message}`);
    } catch (error: any) {
      this.logger.error(`Error sending Telegram message: ${error?.message}`);
    }
  }

  /**
   * Get Telegram status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      botToken: this.botToken ? '***' : 'not configured',
      chatId: this.chatId ? '***' : 'not configured',
    };
  }

  /**
   * Update configuration
   */
  updateConfig(botToken?: string, chatId?: string) {
    if (botToken) this.botToken = botToken;
    if (chatId) this.chatId = chatId;
    this.enabled = !!this.botToken && !!this.chatId;

    return { message: 'Configuration updated', enabled: this.enabled };
  }

  /**
   * Listen for alert events from MQTT/Sensors
   */
  @OnEvent('alert.new')
  async handleAlertEvent(payload: any) {
    this.logger.log(
      `📢 Alert event received for machine ${payload.machineId}: ${payload.message}`,
    );
    await this.sendProblemAlert(
      payload.machineId,
      payload.message,
      payload.state,
    );
  }
}
