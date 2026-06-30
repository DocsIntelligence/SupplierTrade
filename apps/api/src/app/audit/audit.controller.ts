import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditService } from './audit.service';

@ApiTags('audit')
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Recent audit log entries' })
  list(
    @Query('actorId') actorId?: string,
    @Query('orgId') orgId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('limit') limit = '100',
    @Query('offset') offset = '0',
  ) {
    return this.audit.list({
      actorId,
      orgId,
      action,
      targetType,
      limit: Number(limit) || 100,
      offset: Number(offset) || 0,
    });
  }
}
