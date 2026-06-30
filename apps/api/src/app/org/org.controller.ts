import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrgService } from './org.service';

interface CurrentUserRef {
  id: string;
}

@ApiTags('orgs')
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@Controller('orgs')
export class OrgController {
  constructor(private readonly orgs: OrgService) {}

  @Get('me')
  @ApiOperation({ summary: 'Organizations I belong to' })
  mine(@CurrentUser() user: CurrentUserRef) {
    return this.orgs.listMine(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an organization (creator becomes owner)' })
  create(@CurrentUser() user: CurrentUserRef, @Body() body: { name: string; slug?: string }) {
    return this.orgs.create(user.id, body);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get one organization by slug' })
  getBySlug(@Param('slug') slug: string) {
    return this.orgs.getBySlug(slug);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List members of an org' })
  listMembers(@Param('id') id: string, @CurrentUser() user: CurrentUserRef) {
    return this.orgs.assertMember(id, user.id).then(() => this.orgs.listMembers(id));
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'Change a member’s role' })
  updateRole(
    @CurrentUser() user: CurrentUserRef,
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Body() body: { role: string },
  ) {
    return this.orgs.updateMemberRole(id, targetUserId, user.id, body.role);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member' })
  remove(
    @CurrentUser() user: CurrentUserRef,
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.orgs.removeMember(id, targetUserId, user.id);
  }
}
