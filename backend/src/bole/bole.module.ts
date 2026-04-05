import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoleController } from './bole.controller';
import { BoleService } from './bole.service';
import { BoleProfile, BoleReferral } from './entities/bole.entity';
import { User } from '../users/entities/user.entity';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BoleProfile, BoleReferral, User]),
    CreditsModule,
  ],
  controllers: [BoleController],
  providers: [BoleService],
  exports: [BoleService],
})
export class BoleModule {}
