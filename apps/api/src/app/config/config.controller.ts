import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('config')
@Controller('config')
export class ConfigController {
  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get public app configuration' })
  @ApiResponse({
    status: 200,
    description: 'Public config values (safe to expose)',
  })
  publicConfig() {
    return {
      env: process.env['NODE_ENV'] ?? 'development',
      version: process.env['npm_package_version'] ?? '0.0.0',
    };
  }
}
