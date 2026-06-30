import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReferralsService } from './referrals.service';

interface CurrentUserRef {
  id: string;
}

@ApiTags('referrals')
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@Controller()
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Get('referrals/me')
  @ApiOperation({ summary: 'My referral code + share URL + stats' })
  async me(@CurrentUser() user: CurrentUserRef) {
    const [code, stats] = await Promise.all([
      this.referrals.getMyCode(user.id),
      this.referrals.stats(user.id),
    ]);
    return { ...code, stats };
  }

  @Get('referrals/me/list')
  @ApiOperation({ summary: 'My referrals — who I invited + reward status' })
  list(@CurrentUser() user: CurrentUserRef) {
    return this.referrals.listMine(user.id);
  }

  @Post('referrals/attach')
  @ApiOperation({ summary: 'Post-hoc attach a code (for users that signed up without ?ref=)' })
  attach(
    @CurrentUser() user: CurrentUserRef,
    @Body() body: { code: string; source?: string },
  ) {
    return this.referrals.attachReferred(body.code, user.id, body.source);
  }

  @Get('admin/referrals')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: list all referrals' })
  adminList(@Query('offset') offset = '0', @Query('limit') limit = '100') {
    return this.referrals.list(Number(offset) || 0, Number(limit) || 100);
  }

  @Post('admin/referrals/:id/reward')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: mark a referral as rewarded' })
  reward(
    @Body() body: { id: string; metadata?: Record<string, unknown> },
  ) {
    return this.referrals.markRewarded(body.id, body.metadata);
  }
}
