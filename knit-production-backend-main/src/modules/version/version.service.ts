import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VersionService {
  constructor(private config: ConfigService) {}

  getVersions() {
    return {
      versions: ['1'],
      current: '1',
      api: 'production-monitoring-server',
    };
  }

  getVersion() {
    const packageJson = require('../../../package.json');
    return {
      version: packageJson.version || '1.0.0',
      name: packageJson.name,
      buildTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
