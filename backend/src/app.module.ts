import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from './common/bull/bull.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ResumesModule } from './resumes/resumes.module';
import { RecruitersModule } from './recruiters/recruiters.module';
import { ChatModule } from './chat/chat.module';
import { SquareModule } from './square/square.module';
import { CreditsModule } from './credits/credits.module';
import { BoleModule } from './bole/bole.module';
import { JobsModule } from './jobs/jobs.module';
import { CardModule } from './card/card.module';
import { VerificationModule } from './verification/verification.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ApplicationsModule } from './applications/applications.module';
import { RedisModule } from './common/redis/redis.module';
import { MeilisearchModule } from './common/meilisearch/meilisearch.module';
import * as Joi from 'joi';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('7d'),
        MEILISEARCH_HOST: Joi.string().default('http://localhost:7700'),
        MEILISEARCH_API_KEY: Joi.string().default('masterKey'),
        COS_SECRET_ID: Joi.string(),
        COS_SECRET_KEY: Joi.string(),
        COS_REGION: Joi.string().default('ap-guangzhou'),
        COS_BUCKET: Joi.string(),
        EMAIL_HOST: Joi.string(),
        EMAIL_PORT: Joi.number(),
        EMAIL_USER: Joi.string(),
        EMAIL_PASSWORD: Joi.string(),
      }),
    }),
    
    // 数据库模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<string>('NODE_ENV') === 'development',
        extra: {
          ssl: configService.get<string>('NODE_ENV') === 'production' 
            ? { rejectUnauthorized: false }
            : false,
        },
      }),
      inject: [ConfigService],
    }),
    
    // 应用模块
    AuthModule,
    UsersModule,
    ResumesModule,
    RecruitersModule,
    ChatModule,
    SquareModule,
    CreditsModule,
    BoleModule,
    JobsModule,
    CardModule,
    VerificationModule,
    FavoritesModule,
    ApplicationsModule,
    
    // 基础设施模块
    BullModule,
    RedisModule,
    MeilisearchModule,
  ],
})
export class AppModule {}