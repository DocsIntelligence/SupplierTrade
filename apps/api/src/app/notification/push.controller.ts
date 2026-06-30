import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PushService } from './push.service';

interface CurrentUserRef {
  id: string;
}

interface WebPushSub {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  ua?: string;
}

@ApiTags('push')
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Public()
  @Get('public-key')
  @ApiOperation({ summary: 'VAPID public key for the browser to subscribe' })
  publicKey() {
    return { key: this.push.publicKey };
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Register a Web Push subscription for this device' })
  subscribe(@CurrentUser() user: CurrentUserRef, @Body() sub: WebPushSub) {
    return this.push.subscribe(user.id, sub).then(() => ({ ok: true }));
  }

  @Post('unsubscribe')
  @ApiOperation({ summary: 'Remove a Web Push subscription' })
  unsubscribe(@CurrentUser() user: CurrentUserRef, @Body() body: { endpoint: string }) {
    return this.push.unsubscribe(user.id, body.endpoint).then(() => ({ ok: true }));
  }
}
