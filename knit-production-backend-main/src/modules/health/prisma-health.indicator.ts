import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private prisma: PrismaService) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      const status = await this.prisma.getConnectionStatus();

      if (status.isConnected) {
        return this.getStatus('database', status.isConnected);
      } else {
        throw new Error(status.error || 'Unknown error');
      }
    } catch (error: any) {
      throw new HealthCheckError(
        'Database check failed',
        this.getStatus('database', false, { error: error?.message }),
      );
    }
  }
}
