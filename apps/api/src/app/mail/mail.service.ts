import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { DatabaseService } from '../database/database.service';
import type { SendMailDto } from './dto/send-mail.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectQueue('mail') private readonly mailQueue: Queue,
    private readonly db: DatabaseService,
  ) {}

  /** Enqueue a mail for async delivery */
  async enqueue(dto: SendMailDto): Promise<string> {
    // Persist to DB first
    const log = await this.db.mailLog.create({
      data: {
        to: dto.to,
        subject: dto.subject,
        template: dto.template,
        body: dto.html ?? dto.text,
        status: 'queued',
        metadata: dto.templateData as any,
      },
    });

    // Add to queue
    await this.mailQueue.add(
      'send',
      { ...dto, logId: log.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.debug(
      `Queued mail to ${dto.to}: ${dto.subject} (id: ${log.id})`,
    );
    return log.id;
  }

  /** Convenience: send verification email */
  async sendVerificationEmail(email: string, token: string): Promise<string> {
    const publicUrl = process.env['PUBLIC_URL'] ?? 'http://localhost:3000';
    return this.enqueue({
      to: email,
      subject: 'Verify your email',
      template: 'verification',
      templateData: {
        name: email.split('@')[0],
        verifyLink: `${publicUrl}/verify-email?token=${token}`,
      },
    });
  }

  /** Convenience: send password reset email */
  async sendPasswordResetEmail(email: string, token: string): Promise<string> {
    const publicUrl = process.env['PUBLIC_URL'] ?? 'http://localhost:3000';
    return this.enqueue({
      to: email,
      subject: 'Reset your password',
      template: 'password-reset',
      templateData: {
        name: email.split('@')[0],
        resetLink: `${publicUrl}/reset-password?token=${token}`,
      },
    });
  }

  /** Convenience: send welcome email */
  async sendWelcomeEmail(email: string, name: string): Promise<string> {
    return this.enqueue({
      to: email,
      subject: 'Welcome!',
      template: 'welcome',
      templateData: { name },
    });
  }
}
