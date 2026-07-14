import { Module } from '@nestjs/common';
import { DatabaseModule } from '@server/database';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
