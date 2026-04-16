import { Injectable } from '@nestjs/common';
import { HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma-health.indicator';
import { PrismaService } from '@/common/database/prisma.service';
import { ExportsService } from '../exports/exports.service';

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private prisma: PrismaService,
    private exportsService: ExportsService,
  ) {}

  async checkHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaIndicator.isHealthy(),
    ]);
  }

  async checkDatabase(): Promise<any> {
    return this.prisma.getConnectionStatus();
  }

  async checkExports(): Promise<any> {
    try {
      const recent = await this.exportsService.getRecentExports(1);
      return {
        status: 'ok',
        lastExport: recent.exports[0] || null,
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error?.message,
      };
    }
  }
}
