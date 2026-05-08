import { baseTemplate } from './base.template';

export function welcomeTemplate(data: { name: string }): string {
  return baseTemplate(`
    <p>Hi ${data.name},</p>
    <p>Welcome! Your account has been created successfully.</p>
    <p>You can now sign in and start using the platform.</p>
    <p>If you have any questions, feel free to reach out to our support team.</p>
  `);
}
