import { Injectable } from '@nestjs/common';

import type { SessionUser } from '@proserv/shared';

import { PrismaService } from './prisma.service';

type OrganizationContext = {
  organizationId: string;
  currency: string;
};

@Injectable()
export class OrganizationContextService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(user: SessionUser): Promise<OrganizationContext> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: user.id }, { email: user.email }],
      },
      select: {
        id: true,
        organizationId: true,
        organization: {
          select: { currency: true },
        },
      },
    });

    if (existingUser) {
      return {
        organizationId: existingUser.organizationId,
        currency: existingUser.organization?.currency ?? 'USD',
      };
    }

    const organization = await this.prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, currency: true },
    });

    if (organization) {
      await this.ensureUserRecord(user, organization.id);
      return {
        organizationId: organization.id,
        currency: organization.currency,
      };
    }

    const createdOrg = await this.prisma.organization.create({
      data: {
        name: 'Primary Services Org',
        timezone: 'UTC',
        currency: 'USD',
      },
      select: { id: true, currency: true },
    });

    await this.ensureUserRecord(user, createdOrg.id);

    return {
      organizationId: createdOrg.id,
      currency: createdOrg.currency,
    };
  }

  private async ensureUserRecord(session: SessionUser, organizationId: string) {
    const givenNameInput = session.givenName?.trim() ?? '';
    const familyNameInput = session.familyName?.trim() ?? '';

    const givenName =
      givenNameInput.length > 0 ? givenNameInput : 'Engagement';
    const familyName =
      familyNameInput.length > 0 ? familyNameInput : 'Lead';

    await this.prisma.user.upsert({
      where: { id: session.id },
      update: {
        email: session.email,
        givenName,
        familyName,
        organizationId,
      },
      create: {
        id: session.id,
        email: session.email,
        givenName,
        familyName,
        organizationId,
      },
    });
  }
}

