import { baseTemplate } from './base.template';

export function invitationTemplate(data: {
  inviterName: string;
  orgName: string;
  role: string;
  acceptUrl: string;
}): string {
  return baseTemplate(`
    <p>Hi,</p>
    <p><strong>${data.inviterName}</strong> has invited you to join
       <strong>${data.orgName}</strong> as a <strong>${data.role}</strong>.</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${data.acceptUrl}" class="btn">Accept invitation</a>
    </p>
    <p>The link expires in 7 days. If you don't recognize this invitation, you can ignore the email.</p>
  `);
}
