import { ConsoleLogger, Injectable } from '@nestjs/common';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AppLoggerService extends ConsoleLogger {
  private logPath!: string;

  constructor() {
    super();
    this.setupLogPath();
  }

  private setupLogPath() {
    const logsDir = join(process.cwd(), 'logs');
    try {
      mkdirSync(logsDir, { recursive: true });
    } catch (error: any) {
      console.error(`Failed to create logs directory: ${error?.message}`);
    }

    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    this.logPath = join(logsDir, `app-${dateStr}.log`);
  }

  private writeToFile(message: string, level: string) {
    try {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level}] ${message}\n`;
      appendFileSync(this.logPath, logMessage);
    } catch (error: any) {
      console.error(`Failed to write to log file: ${error?.message}`);
    }
  }

  log(message: string, context?: string) {
    const fullMessage = context ? `[${context}] ${message}` : message;
    super.log(fullMessage);
    this.writeToFile(fullMessage, 'LOG');
  }

  error(message: string, stack?: string, context?: string) {
    const fullMessage = context ? `[${context}] ${message}` : message;
    super.error(fullMessage, stack);
    this.writeToFile(`${fullMessage} ${stack ? `\n${stack}` : ''}`, 'ERROR');
  }

  warn(message: string, context?: string) {
    const fullMessage = context ? `[${context}] ${message}` : message;
    super.warn(fullMessage);
    this.writeToFile(fullMessage, 'WARN');
  }

  debug(message: string, context?: string) {
    const fullMessage = context ? `[${context}] ${message}` : message;
    super.debug(fullMessage);
    this.writeToFile(fullMessage, 'DEBUG');
  }

  verbose(message: string, context?: string) {
    const fullMessage = context ? `[${context}] ${message}` : message;
    super.verbose(fullMessage);
    this.writeToFile(fullMessage, 'VERBOSE');
  }
}
