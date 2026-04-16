import {
  Controller,
  Post,
  Param,
  Body,
  Version,
  HttpCode,
} from '@nestjs/common';
import { SensorsService } from '../sensors/sensors.service';
import { PrismaService } from '@/common/database/prisma.service';
import { Public } from '@/core/decorators/public.decorator';
import {
  LogDowntimeDto,
  LogQualityDto,
  LogRollWeightDto,
  AcknowledgeAlertDto,
} from './dto/log.dto';

@Controller()
@Public()
export class LogsController {
  constructor(
    private sensorsService: SensorsService,
    private prisma: PrismaService,
  ) {}

  @Post('downtime')
  @Version('1')
  @HttpCode(200)
  async logDowntime(@Body() dto: LogDowntimeDto) {
    // Log downtime event
    await this.prisma.event.create({
      data: {
        machineId: dto.machineId,
        type: 'downtime' as any,
        data: { reason: dto.reason, notes: dto.notes },
        timestamp: new Date(),
      },
    });

    return { success: true, message: 'Downtime logged' };
  }

  @Post('quality')
  @Version('1')
  @HttpCode(200)
  async logQuality(@Body() dto: LogQualityDto) {
    await this.prisma.event.create({
      data: {
        machineId: dto.machineId,
        type: 'quality' as any,
        data: { status: dto.status, defects: dto.defects },
        timestamp: new Date(),
      },
    });

    return { success: true, message: 'Quality logged' };
  }

  @Post('roll-weight')
  @Version('1')
  @HttpCode(200)
  async logRollWeight(@Body() dto: LogRollWeightDto) {
    await this.prisma.event.create({
      data: {
        machineId: dto.machineId,
        type: 'roll_weight' as any,
        data: { weight: dto.weight },
        timestamp: new Date(),
      },
    });

    return { success: true, message: 'Roll weight logged' };
  }

  @Post('alerts/:alertId/acknowledge')
  @Version('1')
  @HttpCode(200)
  async acknowledgeAlert(
    @Param('alertId') alertId: string,
    @Body() dto: AcknowledgeAlertDto,
  ) {
    // Mark alert as acknowledged
    // This is a simplified implementation
    return {
      success: true,
      message: 'Alert acknowledged',
      alertId,
      notes: dto.notes,
    };
  }
}

