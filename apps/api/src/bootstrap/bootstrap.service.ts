import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, type Role } from '@prisma/client';

import { PrismaService } from '../infra/prisma/prisma.service';
import { DEFAULT_ORG_ROLE_DEFINITIONS } from './defaults';

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSeedData();
  }

  private async ensureSeedData(): Promise<void> {
    const organization = await this.ensureOrganization();
    const owner = await this.ensureOwner(organization.id);
    const roles = await this.ensureDefaultRoles(organization.id);
    await this.ensureRateCard(organization.id, organization.currency, roles);

    this.logger.debug(
      `Seeded defaults for organization ${organization.id} (owner: ${owner.id}, roles: ${roles
        .map((role) => role.code)
        .join(', ')})`,
    );
  }

  private async ensureOrganization() {
    const existing = await this.prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.organization.create({
      data: {
        name: 'Primary Services Org',
        timezone: 'UTC',
        currency: 'USD',
      },
    });
  }

  private async ensureOwner(organizationId: string) {
    const ownerEmail = 'engagement.lead@proserv.local';

    const existing = await this.prisma.user.findFirst({
      where: { organizationId, email: ownerEmail },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.user.create({
      data: {
        id: 'engagement-lead',
        organizationId,
        email: ownerEmail,
        givenName: 'Engagement',
        familyName: 'Lead',
      },
    });
  }

  private async ensureDefaultRoles(organizationId: string): Promise<Role[]> {
    const existing = await this.prisma.role.findMany({
      where: { organizationId, archivedAt: null },
    });

    const existingByCode = new Map(existing.map((role) => [role.code, role]));
    const ensured = [...existing];

    for (const roleDefinition of DEFAULT_ORG_ROLE_DEFINITIONS) {
      const alreadyPresent = existingByCode.get(roleDefinition.code);
      if (alreadyPresent) {
        continue;
      }

      const created = await this.prisma.role.create({
        data: {
          organizationId,
          code: roleDefinition.code,
          name: roleDefinition.name,
          description: roleDefinition.description,
        },
      });

      ensured.push(created);
    }

    return ensured;
  }

  private async ensureRateCard(
    organizationId: string,
    currency: string,
    roles: Role[],
  ) {
    if (roles.length === 0) {
      return;
    }

    const defaultRates = new Map(
      DEFAULT_ORG_ROLE_DEFINITIONS.map((role) => [
        role.code,
        {
          billRate: new Prisma.Decimal(role.billRate),
          costRate: new Prisma.Decimal(role.costRate),
        },
      ]),
    );

    const existing = await this.prisma.rateCard.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      include: {
        entries: true,
      },
    });

    if (existing) {
      const entriesByRole = new Set(
        existing.entries.map((entry) => `${entry.roleId}:${entry.currency}`),
      );

      for (const role of roles) {
        const key = `${role.id}:${existing.currency}`;
        if (entriesByRole.has(key)) {
          continue;
        }

        const rateDefaults =
          defaultRates.get(role.code) ??
          {
            billRate: new Prisma.Decimal(225),
            costRate: new Prisma.Decimal(120),
          };

        await this.prisma.rateCardRole.create({
          data: {
            rateCardId: existing.id,
            roleId: role.id,
            currency: existing.currency,
            billRate: rateDefaults.billRate,
            costRate: rateDefaults.costRate,
          },
        });
      }
      return existing;
    }

    return this.prisma.rateCard.create({
      data: {
        organizationId,
        name: 'Global Delivery Standard',
        currency,
        entries: {
          create: roles.map((role) => {
            const defaults =
              defaultRates.get(role.code) ??
              {
                billRate: new Prisma.Decimal(225),
                costRate: new Prisma.Decimal(120),
              };

            return {
              roleId: role.id,
              currency,
              billRate: defaults.billRate,
              costRate: defaults.costRate,
            };
          }),
        },
      },
    });
  }
}
