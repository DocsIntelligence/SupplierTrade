import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailTransport {
  private readonly logger = new Logger(MailTransport.name);
  private transporter: Transporter | null = null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MAIL_HOST');
    const port = this.config.get<number>('MAIL_PORT');
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASSWORD');
    this.from = this.config.get<string>('MAIL_FROM') ?? 'noreply@localhost';

    if (host && port) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
      this.logger.log(`Mail transport configured (${host}:${port})`);
    } else {
      this.logger.warn(
        'Mail transport not configured — emails will be logged only',
      );
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.debug(`[DRY RUN] To: ${to} | Subject: ${subject}`);
      return;
    }

    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }
}
