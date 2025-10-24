import { Global, Module } from '@nestjs/common';

import { PrismaHealthIndicator } from './prisma.health-indicator';
import { PrismaService } from './prisma.service';
import { OrganizationContextService } from './organization-context.service';

@Global()
@Module({
  providers: [PrismaService, PrismaHealthIndicator, OrganizationContextService],
  exports: [PrismaService, PrismaHealthIndicator, OrganizationContextService],
})
export class PrismaModule {}
