import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { VerificationController } from './controllers/verification.controller';
import { EmailVerificationService } from './services/email-verification.service';
import { MailerService } from './services/mailer.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { VerificationCode } from './entities/verification-code.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationCode]),
    ConfigModule,
  ],
  controllers: [VerificationController],
  providers: [EmailVerificationService, MailerService, RateLimiterService],
  exports: [EmailVerificationService, MailerService, RateLimiterService],
})
export class VerificationModule {}
