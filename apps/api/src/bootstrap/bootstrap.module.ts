import { Module } from '@nestjs/common';

import { PrismaModule } from '../infra/prisma/prisma.module';

import { BootstrapService } from './bootstrap.service';

@Module({
  imports: [PrismaModule],
  providers: [BootstrapService],
})
export class BootstrapModule {}
