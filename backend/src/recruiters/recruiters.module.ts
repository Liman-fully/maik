import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from './controllers/jobs.controller';
import { JobApplicationsController } from './controllers/job-applications.controller';
import { JobsService } from './services/jobs.service';
import { JobApplicationsService } from './services/job-applications.service';
import { Job, JobApplication } from './entities/job.entity';
import { Assignment } from './entities/assignment.entity';
import { User } from '../users/entities/user.entity';
import { Resume } from '../resumes/entities/resume.entity';
import { RedisModule } from '../common/redis/redis.module';
import { MeilisearchModule } from '../common/meilisearch/meilisearch.module';
import { ResumeRecommendationService } from './services/resume-recommendation.service';
import { JobSearchService } from './services/job-search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, JobApplication, Assignment, User, Resume]),
    RedisModule,
    MeilisearchModule,
  ],
  controllers: [JobsController, JobApplicationsController],
  providers: [
    JobsService,
    JobApplicationsService,
    ResumeRecommendationService,
    JobSearchService,
  ],
  exports: [JobsService, JobApplicationsService, ResumeRecommendationService],
})
export class RecruitersModule {}