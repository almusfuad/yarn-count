import { Controller, Get, Version } from '@nestjs/common';
import { VersionService } from './version.service';
import { Public } from '@/core/decorators/public.decorator';
import { VERSION_NEUTRAL } from '@nestjs/common';

@Controller()
@Public()
export class VersionController {
  constructor(private versionService: VersionService) {}

  @Get('versions')
  @Version(VERSION_NEUTRAL)
  getVersions() {
    return this.versionService.getVersions();
  }

  @Get('version')
  @Version('1')
  getVersion() {
    return this.versionService.getVersion();
  }
}
