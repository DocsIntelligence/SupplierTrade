export interface SendMailDto {
  to: string;
  subject: string;
  template?: string;
  templateData?: Record<string, string>;
  html?: string;
  text?: string;
}
