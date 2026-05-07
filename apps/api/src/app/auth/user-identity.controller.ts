import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
} from '@nestjs/swagger';
import type { User } from '@org/dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserIdentityService } from './user-identity.service';

@ApiTags('identities')
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@Controller('user/identities')
@UseGuards(JwtAuthGuard)
export class UserIdentityController {
  constructor(private readonly identityService: UserIdentityService) {}

  @Get()
  @ApiOperation({ summary: 'List linked OAuth providers' })
  list(@CurrentUser() user: User) {
    return this.identityService.listForUser(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Unlink an OAuth provider' })
  unlink(@CurrentUser() user: User, @Param('id') identityId: string) {
    return this.identityService.unlinkForUser(user.id, identityId);
  }
}
