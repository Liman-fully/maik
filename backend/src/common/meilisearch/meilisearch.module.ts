import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';
import { MeilisearchService } from './meilisearch.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'MEILISEARCH_CLIENT',
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('MEILISEARCH_HOST') || 'http://localhost:7700';
        const apiKey = configService.get<string>('MEILISEARCH_API_KEY') || 'masterKey';
        
        return new MeiliSearch({
          host,
          apiKey,
        });
      },
      inject: [ConfigService],
    },
    MeilisearchService,
  ],
  exports: ['MEILISEARCH_CLIENT', MeilisearchService],
})
export class MeilisearchModule {}