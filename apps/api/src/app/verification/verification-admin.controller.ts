import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { VerificationService } from './verification.service';

interface CurrentUserRef {
  id: string;
}

@ApiTags('admin-verification')
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/verification')
export class VerificationAdminController {
  constructor(private readonly verification: VerificationService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Pending verification review queue' })
  queue() {
    return this.verification.queue();
  }

  @Post(':id/decide')
  @ApiOperation({ summary: 'Approve or reject a verification' })
  decide(
    @CurrentUser() admin: CurrentUserRef,
    @Param('id') id: string,
    @Body() body: { decision: 'approve' | 'reject'; reason?: string; purgeEvidence?: boolean },
  ) {
    return this.verification.decide(id, body, admin.id);
  }
}
