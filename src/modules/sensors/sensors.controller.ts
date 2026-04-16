import {
  Controller,
  Get,
  Param,
  Version,
  NotFoundException,
} from '@nestjs/common';
import { SensorsService } from './sensors.service';
import { Public } from '@/core/decorators/public.decorator';

@Controller({ path: 'machines' })
@Public()
export class SensorsController {
  constructor(private sensorsService: SensorsService) {}

  @Get()
  @Version('1')
  async getAllMachines() {
    const machines = await this.sensorsService.getAllMachineSummaries();
    return {
      machines,
      count: machines.length,
    };
  }

  @Get(':id')
  @Version('1')
  async getMachineStatus(@Param('id') machineId: string) {
    const machine = await this.sensorsService.getMachineDetails(machineId);
    if (!machine) {
      throw new NotFoundException(`Machine with id '${machineId}' not found`);
    }
    return machine;
  }

  @Get(':id/details')
  @Version('1')
  async getMachineDetails(@Param('id') machineId: string) {
    const details = await this.sensorsService.getMachineDetails(machineId);
    if (!details) {
      throw new NotFoundException(`Machine with id '${machineId}' not found`);
    }
    return {
      machineId,
      ...details,
    };
  }
}
