import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Version,
  HttpCode,
} from '@nestjs/common';
import { ExportsService } from './exports.service';
import { Public } from '@/core/decorators/public.decorator';

@Controller({ path: 'exports' })
@Public()
export class ExportsController {
  constructor(private exportsService: ExportsService) {}

  @Post('trigger')
  @Version('1')
  @HttpCode(202)
  async triggerExport(@Body() body: { machineId?: string }) {
    return this.exportsService.triggerExport(body.machineId);
  }

  @Get('history')
  @Version('1')
  async getHistory(@Query('limit') limit?: number) {
    const exports = await this.exportsService.getExportHistory(limit);
    return { exports, count: exports.length };
  }

  @Get('status')
  @Version('1')
  async getStatus(@Query('exportId') exportId: string) {
    return this.exportsService.getExportStatus(exportId);
  }

  @Get('recent')
  @Version('1')
  async getRecent(@Query('limit') limit?: number) {
    return this.exportsService.getRecentExports(limit);
  }

  @Get(':id')
  @Version('1')
  async getExport(@Param('id') exportId: string) {
    const exp = await this.exportsService.getExport(exportId);
    if (!exp) {
      return { error: 'Export not found' };
    }
    return exp;
  }

  @Post(':id/verify')
  @Version('1')
  @HttpCode(200)
  async verifyExport(@Param('id') exportId: string) {
    return this.exportsService.verifyExport(exportId);
  }
}
