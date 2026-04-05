import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailerConfig, EmailTemplateData } from './mailer-config.interface';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;
  private config: MailerConfig;

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  private initialize() {
    this.config = {
      host: this.configService.get<string>('EMAIL_HOST', 'smtp.qq.com'),
      port: this.configService.get<number>('EMAIL_PORT', 465),
      secure: this.configService.get<boolean>('EMAIL_SECURE', true),
      auth: {
        user: this.configService.get<string>('EMAIL_USER', ''),
        pass: this.configService.get<string>('EMAIL_PASS', ''),
      },
      from: this.configService.get<string>('EMAIL_FROM', 'noreply@maik.com'),
      fromName: this.configService.get<string>('EMAIL_FROM_NAME', '脉刻系统'),
    };

    if (!this.config.auth.user || !this.config.auth.pass) {
      this.logger.warn('邮件配置不完整，邮件发送功能可能无法正常工作');
    }

    this.transporter = nodemailer.createTransport(this.config);
  }

  /**
   * 发送验证码邮件
   */
  async sendVerificationCode(email: string, data: EmailTemplateData): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.from}>`,
        to: email,
        subject: this.getEmailSubject(data.type),
        html: this.generateVerificationEmailHtml(data),
        text: this.generateVerificationEmailText(data),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`验证码邮件已发送到 ${email}，消息ID: ${info.messageId}`);
      
      return true;
    } catch (error) {
      this.logger.error(`发送邮件到 ${email} 失败:`, error);
      throw new Error(`邮件发送失败: ${error.message}`);
    }
  }

  /**
   * 根据验证类型获取邮件主题
   */
  private getEmailSubject(type: string): string {
    const subjects: Record<string, string> = {
      register: '【脉刻】注册验证码',
      login: '【脉刻】登录验证码',
      reset_password: '【脉刻】重置密码验证码',
      update_email: '【脉刻】修改邮箱验证码',
      change_password: '【脉刻】修改密码验证码',
    };

    return subjects[type] || '【脉刻】验证码';
  }

  /**
   * 生成HTML格式的验证码邮件
   */
  private generateVerificationEmailHtml(data: EmailTemplateData): string {
    const typeText = this.getTypeText(data.type);
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>邮箱验证码</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px 24px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; letter-spacing: 1px; }
        .content { padding: 32px 24px; }
        .code-container { text-align: center; margin: 40px 0; }
        .verification-code { display: inline-block; font-size: 40px; font-weight: bold; color: #2563eb; letter-spacing: 8px; background-color: #eff6ff; padding: 20px 40px; border-radius: 12px; border: 2px dashed #3b82f6; }
        .info { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px; }
        .info p { margin: 8px 0; color: #4b5563; }
        .warning { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px; }
        .warning p { margin: 8px 0; color: #92400e; }
        .footer { background-color: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
        @media (max-width: 600px) {
            .container { border-radius: 0; }
            .verification-code { font-size: 32px; letter-spacing: 6px; padding: 16px 24px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">脉刻 · MAIK</div>
            <div style="margin-top: 8px; opacity: 0.9;">跨时代简历流动平台</div>
        </div>
        
        <div class="content">
            <h2 style="color: #111827; margin-top: 0;">${typeText}验证码</h2>
            <p style="color: #4b5563; line-height: 1.6;">您好，您正在进行${typeText}操作，请在下方使用验证码完成验证：</p>
            
            <div class="code-container">
                <div class="verification-code">${data.code}</div>
            </div>
            
            <div class="info">
                <p><strong>重要提示：</strong></p>
                <p>• 此验证码将在 ${data.expiresInMinutes} 分钟后失效</p>
                <p>• 请勿将此验证码透露给任何人</p>
                <p>• 如果不是您本人操作，请忽略此邮件</p>
            </div>
            
            <div class="warning">
                <p><strong>安全提醒：</strong></p>
                <p>• 验证码仅通过邮件发送，客服不会索要验证码</p>
                <p>• 如遇可疑情况，请及时联系客服</p>
                <p>• 请确保您的邮箱账户安全</p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 32px;">
                邮件发送时间：${data.timestamp}<br>
                接收邮箱：${data.email}
            </p>
        </div>
        
        <div class="footer">
            <p>此邮件由脉刻系统自动发送，请勿回复。</p>
            <p>如有疑问，请联系客服：support@maik.com</p>
            <p style="margin-top: 16px; font-size: 12px;">© 2026 脉刻 MAIK 版权所有</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * 生成纯文本格式的验证码邮件
   */
  private generateVerificationEmailText(data: EmailTemplateData): string {
    const typeText = this.getTypeText(data.type);
    
    return `
脉刻验证码

您正在进行${typeText}操作，验证码为：${data.code}

此验证码将在 ${data.expiresInMinutes} 分钟后失效，请尽快使用。

重要提示：
• 请勿将此验证码透露给任何人
• 客服不会索要验证码
• 如非本人操作，请忽略此邮件

邮件发送时间：${data.timestamp}
接收邮箱：${data.email}

如有疑问，请联系客服：support@maik.com

© 2026 脉刻 MAIK 版权所有
    `.trim();
  }

  /**
   * 获取验证类型的中文描述
   */
  private getTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      register: '注册',
      login: '登录',
      reset_password: '重置密码',
      update_email: '修改邮箱',
      change_password: '修改密码',
    };

    return typeMap[type] || '身份';
  }

  /**
   * 测试邮件服务连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('邮件服务连接测试成功');
      return true;
    } catch (error) {
      this.logger.error('邮件服务连接测试失败:', error);
      return false;
    }
  }
}