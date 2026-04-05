import { Module } from '@nestjs/common';
import { BullModule as BullCoreModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullCoreModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        // 解析 REDIS_URL（格式: redis://[:password@]host:port[/db]）
        let host = 'localhost';
        let port = 6379;
        let password: string | undefined;
        let db = 0;
        
        try {
          const url = new URL(redisUrl);
          host = url.hostname || 'localhost';
          port = parseInt(url.port, 10) || 6379;
          password = url.password || undefined;
          db = parseInt(url.pathname.slice(1), 10) || 0;
        } catch {
          // URL 解析失败，使用默认值
        }
        
        return {
          redis: { host, port, password, db },
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [BullCoreModule],
})
export class BullModule {}