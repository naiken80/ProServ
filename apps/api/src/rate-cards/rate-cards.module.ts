import { Module } from '@nestjs/common';

import { PrismaModule } from '../infra/prisma/prisma.module';
import { SessionGuard } from '../auth/session.guard';

import { RateCardsController } from './rate-cards.controller';
import { RateCardsService } from './rate-cards.service';

@Module({
  imports: [PrismaModule],
  controllers: [RateCardsController],
  providers: [RateCardsService, SessionGuard],
  exports: [RateCardsService],
})
export class RateCardsModule {}
