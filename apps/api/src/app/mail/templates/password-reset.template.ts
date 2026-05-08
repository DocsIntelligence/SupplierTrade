import { baseTemplate } from './base.template';

export function passwordResetTemplate(data: {
  name: string;
  resetLink: string;
}): string {
  return baseTemplate(`
    <p>Hi ${data.name},</p>
    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${data.resetLink}" class="btn">Reset Password</a>
    </p>
    <p>If you didn't request this, you can safely ignore this email.</p>
    <p style="font-size: 12px; color: #71717a;">This link expires in 1 hour.</p>
  `);
}
