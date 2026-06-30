import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiKeysService, CreateApiKeyInput } from './api-keys.service';

interface CurrentUserRef {
  id: string;
}

@ApiTags('api-keys')
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@Controller('me/api-keys')
export class ApiKeysController {
  constructor(private readonly keys: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List my API keys (no secrets)' })
  list(@CurrentUser() user: CurrentUserRef) {
    return this.keys.listMine(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an API key — the raw token is returned ONCE' })
  create(@CurrentUser() user: CurrentUserRef, @Body() body: CreateApiKeyInput) {
    return this.keys.create(user.id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  revoke(@CurrentUser() user: CurrentUserRef, @Param('id') id: string) {
    return this.keys.revoke(user.id, id);
  }
}
