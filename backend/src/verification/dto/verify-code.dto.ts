import { IsEmail, IsIn, IsString, Length } from 'class-validator';
import { VerificationType } from './send-verification-code.dto';

export class VerifyCodeDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString()
  @Length(6, 6, { message: '验证码必须是6位数字' })
  code: string;

  @IsIn(Object.values(VerificationType), { message: '验证类型无效' })
  type: VerificationType;

  @IsString()
  @Length(1)
  operationId?: string;
}