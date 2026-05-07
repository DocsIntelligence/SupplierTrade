import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('config')
export class ConfigController {
  @Public()
  @Get('public')
  publicConfig() {
    return {
      env: process.env['NODE_ENV'] ?? 'development',
      version: process.env['npm_package_version'] ?? '0.0.0',
    };
  }
}
