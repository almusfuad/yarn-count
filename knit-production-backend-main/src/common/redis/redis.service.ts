import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface MachineState {
  id: string;
  status: string;
  lastSeen: Date;
  currentRoll?: any;
  totalRollsToday?: number;
  problemActive?: boolean;
  [key: string]: any;
}

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private client!: Redis;
  private readonly logger = new Logger(RedisService.name);
  private readonly prefix = 'machine:';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const host = this.configService.get('REDIS_HOST', 'localhost');
      const port = this.configService.get('REDIS_PORT', 6379);
      const password = this.configService.get('REDIS_PASSWORD');

      this.client = new Redis({
        host,
        port,
        password,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        enableReadyCheck: true,
        enableOfflineQueue: true,
      });

      // Test connection
      await this.client.ping();
      this.logger.log(`✅ Redis connected successfully on ${host}:${port}`);
    } catch (error: any) {
      this.logger.error(`❌ Redis connection failed: ${error?.message}`);
      throw error;
    }
  }

  async onApplicationShutdown() {
    try {
      await this.client.quit();
      this.logger.log('Redis disconnected');
    } catch (error: any) {
      this.logger.error(`Error disconnecting from Redis: ${error?.message}`);
    }
  }

  async getMachineState(machineId: string): Promise<MachineState | null> {
    try {
      const data = await this.client.get(`${this.prefix}${machineId}`);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error: any) {
      this.logger.error(
        `Error getting machine state for ${machineId}: ${error?.message}`,
      );
      return null;
    }
  }

  async setMachineState(machineId: string, state: MachineState): Promise<void> {
    try {
      await this.client.set(
        `${this.prefix}${machineId}`,
        JSON.stringify(state),
      );
    } catch (error: any) {
      this.logger.error(
        `Error setting machine state for ${machineId}: ${error?.message}`,
      );
    }
  }

  async getAllMachineStates(): Promise<Record<string, MachineState>> {
    try {
      const keys = await this.client.keys(`${this.prefix}*`);
      const states: Record<string, MachineState> = {};

      for (const key of keys) {
        const data = await this.client.get(key);
        if (data) {
          const machineId = key.replace(this.prefix, '');
          states[machineId] = JSON.parse(data);
        }
      }

      return states;
    } catch (error: any) {
      this.logger.error(`Error getting all machine states: ${error?.message}`);
      return {};
    }
  }

  async deleteMachineState(machineId: string): Promise<void> {
    try {
      await this.client.del(`${this.prefix}${machineId}`);
    } catch (error: any) {
      this.logger.error(
        `Error deleting machine state for ${machineId}: ${error?.message}`,
      );
    }
  }

  async clearAllMachineStates(): Promise<void> {
    try {
      const keys = await this.client.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error: any) {
      this.logger.error(`Error clearing machine states: ${error?.message}`);
    }
  }

  getClient(): Redis {
    return this.client;
  }
}
