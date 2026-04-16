import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/database/prisma.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ExportsService {
  private logger = new Logger(ExportsService.name);
  private exportPath: string;

  constructor(
    private prisma: PrismaService,
    private telemetryService: TelemetryService,
    private config: ConfigService,
  ) {
    this.exportPath = this.config.get('EXPORT_PATH', './exports');
    this.ensureExportPath();
  }

  private ensureExportPath() {
    if (!existsSync(this.exportPath)) {
      mkdirSync(this.exportPath, { recursive: true });
    }
  }

  /**
   * Trigger export
   */
  async triggerExport(machineId?: string) {
    try {
      const id = Date.now();
      const events = await this.telemetryService.queryEvents(machineId, undefined, 10000);

      const filename = `export-${id}.json`;
      const filepath = join(this.exportPath, filename);

      writeFileSync(filepath, JSON.stringify(events, null, 2));

      // Log export
      await this.prisma.export.create({
        data: {
          machineId: machineId ?? 'all',
          exportType: 'manual',
          exportPath: filepath,
          recordCount: events.length,
          dateRange: {},
          status: 'completed',
        } as any,
      });

      return {
        exportId: id,
        filename,
        recordCount: events.length,
        status: 'completed',
      };
    } catch (error: any) {
      this.logger.error(`Error triggering export: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Get export history
   */
  async getExportHistory(limit: number = 50) {
    return this.prisma.export.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
    });
  }

  /**
   * Get export status
   */
  async getExportStatus(exportId: string) {
    const exp = await this.prisma.export.findUnique({
      where: { id: parseInt(exportId) },
    });

    if (!exp) {
      return { status: 'not_found' };
    }

    return {
      exportId: exp.id,
      status: exp.status,
      recordCount: exp.recordCount,
      createdAt: exp.createdAt,
      exportPath: exp.exportPath,
    };
  }

  /**
   * Get recent exports
   */
  async getRecentExports(limit: number = 10) {
    const exports = await this.prisma.export.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });

    return {
      exports,
      count: exports.length,
    };
  }

  /**
   * Get export by ID
   */
  async getExport(exportId: string) {
    return this.prisma.export.findUnique({
      where: { id: parseInt(exportId) },
    });
  }

  /**
   * Verify export
   */
  async verifyExport(exportId: string) {
    const exp = await this.prisma.export.findUnique({
      where: { id: parseInt(exportId) },
    });

    if (!exp) {
      return { valid: false, message: 'Export not found' };
    }

    return {
      valid: true,
      exportId: exp.id,
      exportPath: exp.exportPath,
      recordCount: exp.recordCount,
      status: exp.status,
    };
  }
}
