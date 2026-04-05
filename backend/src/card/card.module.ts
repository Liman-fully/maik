import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardsController } from './card.controller';
import { CardService } from './card.service';
import { BusinessCard, CardView } from './entities/card.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessCard, CardView, User]),
  ],
  controllers: [CardsController],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule {}
