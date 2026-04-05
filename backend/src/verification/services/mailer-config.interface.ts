export interface MailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  fromName?: string;
}

export interface EmailTemplateData {
  code: string;
  type: string;
  expiresInMinutes: number;
  email: string;
  timestamp: string;
}