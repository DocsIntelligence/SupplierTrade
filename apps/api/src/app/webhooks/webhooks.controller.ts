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
import { OrgService } from '../org/org.service';
import { WebhooksService } from './webhooks.service';

interface CurrentUserRef {
  id: string;
}

@ApiTags('webhooks')
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@Controller('orgs/:orgId/webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooks: WebhooksService,
    private readonly orgs: OrgService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List webhook endpoints for this org' })
  async list(@CurrentUser() user: CurrentUserRef, @Param('orgId') orgId: string) {
    await this.orgs.assertMember(orgId, user.id);
    return this.webhooks.list(orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Register a webhook endpoint' })
  async create(
    @CurrentUser() user: CurrentUserRef,
    @Param('orgId') orgId: string,
    @Body() body: { url: string; events: string[] },
  ) {
    await this.orgs.assertPrivileged(orgId, user.id);
    return this.webhooks.create(orgId, body.url, body.events);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Activate / deactivate an endpoint' })
  async toggle(
    @CurrentUser() user: CurrentUserRef,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() body: { active: boolean },
  ) {
    await this.orgs.assertPrivileged(orgId, user.id);
    return this.webhooks.toggle(id, body.active);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a webhook endpoint' })
  async remove(
    @CurrentUser() user: CurrentUserRef,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    await this.orgs.assertPrivileged(orgId, user.id);
    return this.webhooks.remove(id);
  }

  @Get(':id/deliveries')
  @ApiOperation({ summary: 'Recent deliveries for an endpoint' })
  async deliveries(
    @CurrentUser() user: CurrentUserRef,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    await this.orgs.assertMember(orgId, user.id);
    return this.webhooks.deliveries(id);
  }
}
