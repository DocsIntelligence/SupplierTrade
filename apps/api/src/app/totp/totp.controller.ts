import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TotpService } from './totp.service';

interface CurrentUserRef {
  id: string;
}

@ApiTags('totp')
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@Controller('auth/totp')
export class TotpController {
  constructor(private readonly totp: TotpService) {}

  @Get('status')
  @ApiOperation({ summary: 'TOTP enrollment status' })
  status(@CurrentUser() user: CurrentUserRef) {
    return this.totp.status(user.id);
  }

  @Post('setup')
  @ApiOperation({ summary: 'Begin TOTP setup — returns secret + otpauth URL' })
  setup(@CurrentUser() user: CurrentUserRef) {
    return this.totp.setup(user.id);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm TOTP with first code from app — returns recovery codes' })
  confirm(@CurrentUser() user: CurrentUserRef, @Body() body: { code: string }) {
    return this.totp.confirm(user.id, body.code);
  }

  @Post('disable')
  @ApiOperation({ summary: 'Disable TOTP (requires current code)' })
  disable(@CurrentUser() user: CurrentUserRef, @Body() body: { code: string }) {
    return this.totp.disable(user.id, body.code);
  }
}
