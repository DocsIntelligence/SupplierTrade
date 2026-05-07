import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    this.logger.log(`Sending verification email to ${to} with token ${token}`);
    // Wire your mailer here (nodemailer, SES, Resend, Postmark, etc.).
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const url = `${this.config.get('CORS_ORIGIN') ?? ''}/reset-password?token=${token}`;
    this.logger.log(`Password reset link for ${to}: ${url}`);
  }
}
