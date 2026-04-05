import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SquareContent } from './entities/square-content.entity';
import { SquareInteraction } from './entities/square-interaction.entity';
import { SquareService } from './square.service';
import { SquareController } from './square.controller';
import { UsersModule } from '../users/users.module';
import { RecruitersModule } from '../recruiters/recruiters.module';
import { ResumesModule } from '../resumes/resumes.module';
import { RedisModule } from '../common/redis/redis.module';
import { Resume } from '../resumes/entities/resume.entity';
import { Job } from '../recruiters/entities/job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SquareContent, SquareInteraction, Resume, Job]),
    UsersModule,
    RecruitersModule,
    ResumesModule,
    RedisModule,
  ],
  controllers: [SquareController],
  providers: [SquareService],
  exports: [SquareService],
})
export class SquareModule {}