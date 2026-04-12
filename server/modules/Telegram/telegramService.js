/**
 * Telegram Service
 * Handles Telegram notifications and alerts
 */

import logger from '../../utils/logger.js';

class TelegramService {
  constructor() {
    this.telegramClient = null;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
  }

  /**
   * Initialize Telegram client
   */
  setTelegramClient(client) {
    this.telegramClient = client;
  }

  /**
   * Send problem/alert notification
   */
  async sendProblemAlert(machineId, payload) {
    try {
      if (!this.telegramClient) {
        logger.warn('⚠️ Telegram client not initialized');
        return;
      }

      const { Problem, Downtime, Timestamp } = payload;
      const severity = Problem.includes('breakage') || Problem.includes('failure') 
        ? '🚨 CRITICAL' 
        : '⚠️ WARNING';

      const message = `
${severity} - Machine Alert
━━━━━━━━━━━━━━━━━━
Machine: ${machineId}
Problem: ${Problem}
Downtime: ${Downtime}
Time: ${Timestamp}
      `.trim();

      await this.sendMessage(message);
    } catch (error) {
      logger.error(`❌ Error sending problem alert:`, error.message);
    }
  }

  /**
   * Send status notification
   */
  async sendStatusUpdate(machineId, status) {
    try {
      if (!this.telegramClient) {
        logger.warn('⚠️ Telegram client not initialized');
        return;
      }

      const statusIcon = status === 'ON' ? '🟢' : status === 'OFF' ? '⚫' : '🟡';
      const message = `${statusIcon} Machine ${machineId} is now ${status}`;

      await this.sendMessage(message);
    } catch (error) {
      logger.error(`❌ Error sending status update:`, error.message);
    }
  }

  /**
   * Send generic message via Telegram
   */
  async sendMessage(text) {
    try {
      if (!this.telegramClient) {
        logger.warn('⚠️ Telegram client not initialized');
        return;
      }

      if (!this.chatId) {
        logger.warn('⚠️ Telegram chat ID not configured');
        return;
      }

      await this.telegramClient.sendMessage(this.chatId, text);
      logger.info(`✅ Telegram message sent`);
    } catch (error) {
      logger.error(`❌ Error sending Telegram message:`, error.message);
    }
  }

  /**
   * Queue message for later sending (batch processing)
   */
  async queueMessage(text) {
    try {
      // Could implement a message queue here for batch sending
      // For now, send immediately
      await this.sendMessage(text);
    } catch (error) {
      logger.error(`❌ Error queuing message:`, error.message);
    }
  }

  /**
   * Format machine metrics for notification
   */
  formatMetricsMessage(machineId, metrics) {
    try {
      return `
📊 Machine ${machineId} Update
━━━━━━━━━━━━━━━━━━
Status: ${metrics.status}
Runtime: ${metrics.runtime}
Downtime: ${metrics.downtime}
Total Count: ${metrics.totalCount}
Utilization: ${metrics.utilization}%
Active Problems: ${metrics.activeProblems}
      `.trim();
    } catch (error) {
      logger.error(`❌ Error formatting metrics message:`, error.message);
      return 'Error formatting metrics';
    }
  }
}

export default new TelegramService();
