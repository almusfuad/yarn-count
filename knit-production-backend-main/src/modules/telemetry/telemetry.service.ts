import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma.service';
import { AppLoggerService } from '@/common/logger/logger.service';

@Injectable()
export class TelemetryService {
  constructor(
    private prisma: PrismaService,
    private logger: AppLoggerService,
  ) {}

  /**
   * Query events with optional filtering
   */
  async queryEvents(machineId?: string, type?: string, limit: number = 100) {
    try {
      const where: any = {};
      if (machineId) where.machineId = machineId;
      if (type) where.type = type;

      const events = await this.prisma.event.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: Math.min(limit, 1000),
      });

      return events;
    } catch (error: any) {
      this.logger.error(`Error querying events: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Get event count
   */
  async getEventCount(machineId?: string, type?: string) {
    try {
      const where: any = {};
      if (machineId) where.machineId = machineId;
      if (type) where.type = type;

      const count = await this.prisma.event.count({ where });
      return count;
    } catch (error: any) {
      this.logger.error(`Error counting events: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Get KPI snapshot for a machine
   */
  async getKpiBig(machineId: string) {
    try {
      const events = await this.prisma.event.findMany({
        where: { machineId },
        orderBy: { timestamp: 'desc' },
        take: 1000,
      });

      // Calculate KPIs
      const totalEvents = events.length;
      const alerts = events.filter((e) => e.type === 'problem').length;
      const problems = alerts;

      return {
        machineId,
        totalEvents,
        alerts,
        problems,
        timestamp: new Date(),
      };
    } catch (error: any) {
      this.logger.error(`Error getting KPI snapshot: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Get all KPI snapshots
   */
  async getAllKpiSnapshots() {
    try {
      // Group events by machineId and calculate KPIs
      const machines = await this.prisma.machine.findMany();

      const snapshots = await Promise.all(
        machines.map((m: any) => this.getKpiBig(m.id)),
      );

      return snapshots;
    } catch (error: any) {
      this.logger.error(`Error getting all KPI snapshots: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Get KPI snapshots for a machine
   */
  async getMachineKpiSnapshots(machineId: string, limit: number = 100) {
    try {
      const snapshots = await this.prisma.kPISnapshot.findMany({
        where: { machineId },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 1000),
      });

      return snapshots;
    } catch (error: any) {
      this.logger.error(`Error getting machine KPI snapshots: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Get machine statistics
   */
  async getMachineStats(machineId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const events = await this.prisma.event.findMany({
        where: {
          machineId,
          timestamp: { gte: today },
        },
      });

      const totalEvents = events.length;
      const alerts = events.filter((e) => e.type === 'problem').length;

      return {
        machineId,
        date: today,
        totalEvents,
        alerts,
        uptime: null,
        utilization: null,
      };
    } catch (error: any) {
      this.logger.error(`Error getting machine stats: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Log event (called from SensorsService via EventEmitter)
   */
  async logEvent(type: string, machineId: string, data: any) {
    try {
      await this.prisma.event.create({
        data: {
          machineId,
          type: type as any,
          data,
          timestamp: new Date(),
        },
      });
    } catch (error: any) {
      this.logger.error(`Error logging event: ${error?.message}`);
    }
  }
}
