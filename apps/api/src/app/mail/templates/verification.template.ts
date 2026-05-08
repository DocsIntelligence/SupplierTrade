import { baseTemplate } from './base.template';

export function verificationTemplate(data: {
  name: string;
  verifyLink: string;
}): string {
  return baseTemplate(`
    <p>Hi ${data.name},</p>
    <p>Please verify your email address by clicking the button below:</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${data.verifyLink}" class="btn">Verify Email</a>
    </p>
    <p>If you didn't create an account, you can safely ignore this email.</p>
  `);
}
