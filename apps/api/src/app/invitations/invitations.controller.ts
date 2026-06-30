import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvitationsService } from './invitations.service';

interface CurrentUserRef {
  id: string;
}

@ApiTags('invitations')
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@Controller()
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post('orgs/:orgId/invitations')
  @ApiOperation({ summary: 'Invite someone to an org (admin / owner)' })
  invite(
    @CurrentUser() user: CurrentUserRef,
    @Param('orgId') orgId: string,
    @Body() body: { email: string; role?: string },
  ) {
    return this.invitations.invite(orgId, user.id, body.email, body.role ?? 'member');
  }

  @Get('orgs/:orgId/invitations')
  @ApiOperation({ summary: 'List pending invitations for an org' })
  list(@Param('orgId') orgId: string) {
    return this.invitations.list(orgId);
  }

  @Delete('orgs/:orgId/invitations/:id')
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  revoke(
    @CurrentUser() user: CurrentUserRef,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.invitations.revoke(orgId, id, user.id);
  }

  @Post('invitations/:token/accept')
  @ApiOperation({ summary: 'Accept an invitation by token' })
  accept(@CurrentUser() user: CurrentUserRef, @Param('token') token: string) {
    return this.invitations.accept(token, user.id);
  }
}
