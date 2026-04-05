import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { Resume } from './entities/resume.entity';
import { ResumeExperience } from './entities/resume-experience.entity';
import { ResumeEducation } from './entities/resume-education.entity';
import { ResumeSkill } from './entities/resume-skill.entity';
import { ResumeProject } from './entities/resume-project.entity';
import { ResumeParserService } from './services/resume-parser.service';
import { ResumeParserQueueService } from './services/resume-parser-queue.service';
import { ResumeSearchService } from './services/resume-search.service';
import { RedisModule } from '../common/redis/redis.module';
import { MeilisearchModule } from '../common/meilisearch/meilisearch.module';
import { BullModule } from '@nestjs/bull';
import { ResumeParserConsumer } from './consumers/resume-parser.consumer';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Resume,
      ResumeExperience,
      ResumeEducation,
      ResumeSkill,
      ResumeProject,
    ]),
    RedisModule,
    MeilisearchModule,
    BullModule.registerQueue({
      name: 'resume-parser',
    }),
  ],
  controllers: [ResumesController],
  providers: [
    ResumesService,
    ResumeParserService,
    ResumeParserQueueService,
    ResumeSearchService,
    ResumeParserConsumer,
  ],
  exports: [ResumesService, ResumeParserService, ResumeParserQueueService, ResumeSearchService],
})
export class ResumesModule {}