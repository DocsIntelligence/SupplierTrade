import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NotificationService } from './notification.service';

interface CurrentUserRef {
  id: string;
}

@ApiTags('notifications')
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'My recent notifications (bell)' })
  list(@CurrentUser() user: CurrentUserRef) {
    return this.notifications.list(user.id);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Unread notification count' })
  unread(@CurrentUser() user: CurrentUserRef) {
    return this.notifications.unreadCount(user.id);
  }

  @Post('read')
  @ApiOperation({ summary: 'Mark one (by id) or all notifications read' })
  markRead(@CurrentUser() user: CurrentUserRef, @Body() body: { id?: string }) {
    return this.notifications.markRead(user.id, body?.id);
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: send a notification to all users' })
  broadcast(@Body() body: { title: string; body: string; link?: string; type?: string }) {
    return this.notifications.broadcast({
      type: body.type ?? 'broadcast',
      title: body.title,
      body: body.body,
      link: body.link,
    });
  }
}
