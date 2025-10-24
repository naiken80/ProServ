import { Module } from '@nestjs/common';

import { PrismaModule } from '../infra/prisma/prisma.module';
import { SessionGuard } from '../auth/session.guard';
import { RateCardsModule } from '../rate-cards/rate-cards.module';

import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [PrismaModule, RateCardsModule],
  controllers: [RolesController],
  providers: [RolesService, SessionGuard],
  exports: [RolesService],
})
export class RolesModule {}

