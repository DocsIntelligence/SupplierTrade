import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DatabaseService } from '../database/database.service';
import { MailTransport } from './mail.transport';
import type { SendMailDto } from './dto/send-mail.dto';
import { welcomeTemplate } from './templates/welcome.template';
import { passwordResetTemplate } from './templates/password-reset.template';
import { verificationTemplate } from './templates/verification.template';
import { verificationDecisionTemplate } from './templates/verification-decision.template';
import { invitationTemplate } from './templates/invitation.template';

const TEMPLATES: Record<string, (data: any) => string> = {
  welcome: welcomeTemplate,
  'password-reset': passwordResetTemplate,
  verification: verificationTemplate,
  'verification-decision': verificationDecisionTemplate,
  invitation: invitationTemplate,
};

@Processor('mail')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly transport: MailTransport,
    private readonly db: DatabaseService,
  ) {
    super();
  }

  async process(job: Job<SendMailDto & { logId: string }>): Promise<void> {
    const { to, subject, template, templateData, html, logId } = job.data;

    try {
      // Resolve HTML content
      let finalHtml = html ?? '';
      if (template && TEMPLATES[template]) {
        finalHtml = TEMPLATES[template](templateData ?? {});
      }

      // Send
      await this.transport.send(to, subject, finalHtml);

      // Update log
      await this.db.mailLog.update({
        where: { id: logId },
        data: {
          status: 'sent',
          sentAt: new Date(),
          attempts: { increment: 1 },
        },
      });

      this.logger.debug(`✓ Sent to ${to}: ${subject}`);
    } catch (error) {
      const message = (error as Error).message;
      this.logger.error(`✗ Failed to send to ${to}: ${message}`);

      await this.db.mailLog.update({
        where: { id: logId },
        data: { status: 'failed', error: message, attempts: { increment: 1 } },
      });

      throw error; // BullMQ will retry based on job options
    }
  }
}
