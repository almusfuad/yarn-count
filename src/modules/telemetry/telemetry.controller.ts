import { Controller, Get, Param, Query, Version } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { Public } from '@/core/decorators/public.decorator';
import { QueryEventsDto, QuerySnapshotDto } from './dto/query-events.dto';

@Controller({ path: 'history' })
@Public()
export class TelemetryController {
  constructor(private telemetryService: TelemetryService) {}

  @Get('events')
  @Version('1')
  async getEvents(@Query() query: QueryEventsDto) {
    const events = await this.telemetryService.queryEvents(
      query.machineId,
      query.type,
      query.limit || 100,
    );
    return { events, count: events.length };
  }

  @Get('events/count')
  @Version('1')
  async getEventCount(@Query() query: QueryEventsDto) {
    const count = await this.telemetryService.getEventCount(
      query.machineId,
      query.type,
    );
    return { count };
  }

  @Get('kpi-snapshot')
  @Version('1')
  async getKpiSnapshot(@Query('machineId') machineId: string) {
    const snapshot = await this.telemetryService.getKpiBig(machineId);
    return snapshot;
  }

  @Get('kpi-snapshots')
  @Version('1')
  async getKpiSnapshots(@Query() query: QuerySnapshotDto) {
    if (query.machineId) {
      const snapshots = await this.telemetryService.getMachineKpiSnapshots(
        query.machineId,
        query.limit,
      );
      return { snapshots };
    } else {
      const snapshots = await this.telemetryService.getAllKpiSnapshots();
      return { snapshots, count: snapshots.length };
    }
  }

  @Get('machine/:id/stats')
  @Version('1')
  async getMachineStats(@Param('id') machineId: string) {
    const stats = await this.telemetryService.getMachineStats(machineId);
    return stats;
  }
}
