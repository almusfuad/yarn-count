import { Injectable } from '@nestjs/common';
import { SensorsService } from '../sensors/sensors.service';
import { TelemetryService } from '../telemetry/telemetry.service';

@Injectable()
export class DashboardService {
  constructor(
    private sensorsService: SensorsService,
    private telemetryService: TelemetryService,
  ) {}

  /**
   * Get dashboard overview
   */
  async getDashboardOverview() {
    const machines = await this.sensorsService.getAllMachineSummaries();
    const kpis = await this.telemetryService.getAllKpiSnapshots();

    return {
      machines,
      kpis,
      totalMachines: machines.length,
      activeMachines: machines.filter((m) => m.status === 'running').length,
      problemsMachines: machines.filter((m) => m.problemActive).length,
      timestamp: new Date(),
    };
  }

  /**
   * Get machine KPIs
   */
  async getMachineKpis() {
    return this.telemetryService.getAllKpiSnapshots();
  }

  /**
   * Get KPI for specific machine
   */
  async getMachineKpi(machineId: string) {
    return this.telemetryService.getKpiBig(machineId);
  }
}
