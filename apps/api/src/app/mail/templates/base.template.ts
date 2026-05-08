import { APP_CONFIG } from '@org/utils';

export function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f4f4f5; }
    .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { padding: 24px 32px; border-bottom: 1px solid #e4e4e7; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 600; color: #18181b; }
    .content { padding: 32px; color: #3f3f46; font-size: 14px; line-height: 1.6; }
    .content p { margin: 0 0 16px; }
    .btn { display: inline-block; padding: 10px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; }
    .footer { padding: 16px 32px; background: #fafafa; border-top: 1px solid #e4e4e7; text-align: center; font-size: 12px; color: #71717a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${APP_CONFIG.name}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${APP_CONFIG.name}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}
