import { Controller, Get, Param, Version } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Public } from '@/core/decorators/public.decorator';

@Controller({ path: 'dashboard' })
@Public()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @Version('1')
  async getDashboard() {
    return this.dashboardService.getDashboardOverview();
  }

  @Get('machine-kpis')
  @Version('1')
  async getMachineKpis() {
    const kpis = await this.dashboardService.getMachineKpis();
    return { kpis, count: kpis.length };
  }

  @Get('machine/:id/kpi')
  @Version('1')
  async getMachineKpi(@Param('id') machineId: string) {
    return this.dashboardService.getMachineKpi(machineId);
  }
}

