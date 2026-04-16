import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      
      // Test connection
      await this.$queryRaw`SELECT 1`;
      
      this.logger.log('✅ PostgreSQL connected successfully');
    } catch (error: any) {
      this.logger.error(`❌ PostgreSQL connection failed: ${error?.message}`);
      throw error;
    }
  }

  async onApplicationShutdown() {
    try {
      await this.$disconnect();
      this.logger.log('PostgreSQL disconnected');
    } catch (error: any) {
      this.logger.error(`Error disconnecting from PostgreSQL: ${error?.message}`);
    }
  }

  async getConnectionStatus() {
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        isConnected: true,
        status: 'connected',
      };
    } catch (error: any) {
      return {
        isConnected: false,
        status: 'disconnected',
        error: error?.message,
      };
    }
  }
}
