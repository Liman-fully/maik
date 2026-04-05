// 发送验证码的请求数据
// 为了避免TypeScript装饰器语法问题，使用简单接口定义

export enum VerificationType {
  REGISTER = 'register',
  LOGIN = 'login',
  RESET_PASSWORD = 'reset_password',
  CHANGE_EMAIL = 'change_email',
  VERIFY_EMAIL = 'verify_email',
}

export interface SendVerificationCodeDto {
  email: string;
  type: VerificationType;
  captchaToken?: string;
}