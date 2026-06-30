import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { OrgModule } from '../org/org.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [OrgModule],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
