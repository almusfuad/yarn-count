import { Controller, Get, Version, VersioningType } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '@/core/decorators/public.decorator';
import { VERSION_NEUTRAL } from '@nestjs/common';

@Controller({ path: 'health' })
@Public()
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @Version(['1', VERSION_NEUTRAL])
  async getHealth() {
    try {
      const result = await this.healthService.checkHealth();
      return {
        status: 'ok',
        checks: result.details,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        error: error?.message || 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  @Get('db')
  @Version('1')
  async checkDatabase() {
    return this.healthService.checkDatabase();
  }

  @Get('exports')
  @Version('1')
  async checkExports() {
    return this.healthService.checkExports();
  }
}
