import { baseTemplate } from './base.template';

export function verificationDecisionTemplate(data: {
  name: string;
  kind: string;
  outcome: 'approved' | 'rejected';
  reason?: string;
}): string {
  if (data.outcome === 'approved') {
    return baseTemplate(`
      <p>Hi ${data.name},</p>
      <p>Good news — your <strong>${data.kind}</strong> verification has been <strong>approved</strong>.</p>
      <p>You can now use the verified features of your account.</p>
    `);
  }
  return baseTemplate(`
    <p>Hi ${data.name},</p>
    <p>Your <strong>${data.kind}</strong> verification could not be approved.</p>
    ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
    <p>You can resubmit at any time from your account.</p>
  `);
}
