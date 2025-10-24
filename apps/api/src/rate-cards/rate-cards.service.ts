import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Role } from '@prisma/client';

import type { SessionUser } from '@proserv/shared';

import { DEFAULT_ORG_ROLE_DEFINITIONS } from '../bootstrap/defaults';
import { PrismaService } from '../infra/prisma/prisma.service';
import { OrganizationContextService } from '../infra/prisma/organization-context.service';

import type { CreateRateCardDto } from './dto/create-rate-card.dto';
import type { UpdateRateCardDto } from './dto/update-rate-card.dto';

type RateCardRecord = Prisma.RateCardGetPayload<{
  include: {
    entries: {
      include: {
        role: {
          select: {
            id: true;
            code: true;
            name: true;
            description: true;
            archivedAt: true;
          };
        };
      };
    };
  };
}>;

type RateCardEntryResponse = {
  id: string;
  roleId: string;
  currency: string;
  billRate: number;
  costRate: number;
  role: {
    id: string;
    code: string;
    name: string;
    description: string | null;
  };
};

type RateCardResponse = {
  id: string;
  organizationId: string;
  name: string;
  currency: string;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
  updatedAt: string;
  entries: RateCardEntryResponse[];
};

@Injectable()
export class RateCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationContext: OrganizationContextService,
  ) {}

  async listRateCards(user: SessionUser) {
    const context = await this.organizationContext.resolve(user);
    const roles = await this.listActiveRoles(context.organizationId);
    await this.backfillEntriesForRoles(context.organizationId, roles);

    const rateCards = await this.prisma.rateCard.findMany({
      where: { organizationId: context.organizationId },
      orderBy: { createdAt: 'asc' },
      include: {
        entries: {
          include: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
                archivedAt: true,
              },
            },
          },
        },
      },
    });

    const data = rateCards.map((card) => this.mapRateCard(card));

    return {
      data,
      roles: roles.map((role) => ({
          id: role.id,
          code: role.code,
          name: role.name,
          description: role.description ?? null,
        })),
    };
  }

  async getRateCard(user: SessionUser, id: string): Promise<RateCardResponse> {
    const context = await this.organizationContext.resolve(user);
    const roles = await this.listActiveRoles(context.organizationId);
    await this.backfillEntriesForRoles(context.organizationId, roles);

    const rateCard = await this.prisma.rateCard.findFirst({
      where: { id, organizationId: context.organizationId },
      include: {
        entries: {
          include: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
                archivedAt: true,
              },
            },
          },
        },
      },
    });

    if (!rateCard) {
      throw new NotFoundException('Rate card not found');
    }

    return this.mapRateCard(rateCard);
  }

  async createRateCard(
    user: SessionUser,
    dto: CreateRateCardDto,
  ): Promise<RateCardResponse> {
    const context = await this.organizationContext.resolve(user);
    const roles = await this.listActiveRoles(context.organizationId);

    const currency = dto.currency.toUpperCase();
    const validFrom = dto.validFrom ? new Date(dto.validFrom) : undefined;
    const validTo = dto.validTo ? new Date(dto.validTo) : undefined;

    if (validFrom && validTo && validFrom > validTo) {
      throw new BadRequestException(
        'validFrom must be before the validTo date',
      );
    }

    const entryOverrides = new Map(
      (dto.entries ?? []).map((entry) => [entry.roleId, entry]),
    );

    const rateCard = await this.prisma.rateCard.create({
      data: {
        organizationId: context.organizationId,
        name: dto.name,
        currency,
        validFrom: validFrom ?? null,
        validTo: validTo ?? null,
        entries: {
          create: roles.map((role) => {
            const override = entryOverrides.get(role.id);
            const defaults = this.defaultRatesForRole(role.code);

            return {
              roleId: role.id,
              currency,
              billRate: new Prisma.Decimal(
                override?.billRate ?? defaults.billRate,
              ),
              costRate: new Prisma.Decimal(
                override?.costRate ?? defaults.costRate,
              ),
            };
          }),
        },
      },
      include: {
        entries: {
          include: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
                archivedAt: true,
              },
            },
          },
        },
      },
    });

    return this.mapRateCard(rateCard);
  }

  async updateRateCard(
    user: SessionUser,
    id: string,
    dto: UpdateRateCardDto,
  ): Promise<RateCardResponse> {
    const context = await this.organizationContext.resolve(user);
    const roles = await this.listActiveRoles(context.organizationId);

    const existing = await this.prisma.rateCard.findFirst({
      where: { id, organizationId: context.organizationId },
      include: {
        entries: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Rate card not found');
    }

    const nextCurrency = dto.currency
      ? dto.currency.toUpperCase()
      : existing.currency;

    const proposedValidFrom =
      dto.validFrom === undefined
        ? existing.validFrom
        : dto.validFrom
          ? new Date(dto.validFrom)
          : null;
    const proposedValidTo =
      dto.validTo === undefined
        ? existing.validTo
        : dto.validTo
          ? new Date(dto.validTo)
          : null;

    if (
      proposedValidFrom &&
      proposedValidTo &&
      proposedValidFrom > proposedValidTo
    ) {
      throw new BadRequestException(
        'validFrom must be before the validTo date',
      );
    }

    const updateData: Prisma.RateCardUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name.trim();
    }

    if (dto.currency !== undefined) {
      updateData.currency = nextCurrency;
    }

    if (dto.validFrom !== undefined) {
      updateData.validFrom = proposedValidFrom;
    }

    if (dto.validTo !== undefined) {
      updateData.validTo = proposedValidTo;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.rateCard.update({
        where: { id: existing.id },
        data: updateData,
      });
    }

    const providedOverrides = new Map(
      (dto.entries ?? []).map((entry) => [entry.roleId, entry]),
    );
    const existingEntries = new Map(
      existing.entries.map((entry) => [entry.roleId, entry]),
    );

    const payload = roles.map((role) => {
      const override = providedOverrides.get(role.id);
      if (override) {
        return {
          roleId: role.id,
          billRate: new Prisma.Decimal(override.billRate),
          costRate: new Prisma.Decimal(override.costRate),
        };
      }

      const current = existingEntries.get(role.id);
      if (current) {
        return {
          roleId: role.id,
          billRate: new Prisma.Decimal(current.billRate),
          costRate: new Prisma.Decimal(current.costRate),
        };
      }

      const defaults = this.defaultRatesForRole(role.code);
      return {
        roleId: role.id,
        billRate: new Prisma.Decimal(defaults.billRate),
        costRate: new Prisma.Decimal(defaults.costRate),
      };
    });

    if (existing.currency !== nextCurrency) {
      await this.prisma.rateCardRole.deleteMany({
        where: { rateCardId: existing.id },
      });

      for (const entry of payload) {
        await this.prisma.rateCardRole.create({
          data: {
            rateCardId: existing.id,
            roleId: entry.roleId,
            currency: nextCurrency,
            billRate: entry.billRate,
            costRate: entry.costRate,
          },
        });
      }
    } else {
      for (const entry of payload) {
        await this.prisma.rateCardRole.upsert({
          where: {
            rateCardId_roleId_currency: {
              rateCardId: existing.id,
              roleId: entry.roleId,
              currency: nextCurrency,
            },
          },
          update: {
            billRate: entry.billRate,
            costRate: entry.costRate,
          },
          create: {
            rateCardId: existing.id,
            roleId: entry.roleId,
            currency: nextCurrency,
            billRate: entry.billRate,
            costRate: entry.costRate,
          },
        });
      }
    }

    await this.backfillEntriesForRoles(context.organizationId, roles);

    const updated = await this.prisma.rateCard.findFirstOrThrow({
      where: { id: existing.id },
      include: {
        entries: {
          include: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
                archivedAt: true,
              },
            },
          },
        },
      },
    });

    return this.mapRateCard(updated);
  }

  private async listActiveRoles(organizationId: string): Promise<Role[]> {
    return this.prisma.role.findMany({
      where: { organizationId, archivedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async backfillEntriesForRoles(
    organizationId: string,
    roles: Role[],
  ): Promise<void> {
    if (roles.length === 0) {
      return;
    }

    const cards = await this.prisma.rateCard.findMany({
      where: { organizationId },
      select: {
        id: true,
        currency: true,
        entries: {
          select: {
            roleId: true,
            currency: true,
          },
        },
      },
    });

    const defaultRates = new Map(
      DEFAULT_ORG_ROLE_DEFINITIONS.map((role) => [
        role.code,
        {
          billRate: new Prisma.Decimal(role.billRate),
          costRate: new Prisma.Decimal(role.costRate),
        },
      ]),
    );

    for (const card of cards) {
      const existingKeys = new Set(
        card.entries.map(
          (entry) => `${entry.roleId}:${entry.currency}`,
        ),
      );

      for (const role of roles) {
        const key = `${role.id}:${card.currency}`;
        if (existingKeys.has(key)) {
          continue;
        }

        const defaults =
          defaultRates.get(role.code) ??
          {
            billRate: new Prisma.Decimal(0),
            costRate: new Prisma.Decimal(0),
          };

        await this.prisma.rateCardRole.create({
          data: {
            rateCardId: card.id,
            roleId: role.id,
            currency: card.currency,
            billRate: defaults.billRate,
            costRate: defaults.costRate,
          },
        });
      }
    }
  }

  private mapRateCard(record: RateCardRecord): RateCardResponse {
    const activeEntries = record.entries
      .filter((entry) => entry.role.archivedAt === null)
      .slice()
      .sort((a, b) => a.role.name.localeCompare(b.role.name));

    return {
      id: record.id,
      organizationId: record.organizationId,
      name: record.name,
      currency: record.currency,
      validFrom: record.validFrom?.toISOString() ?? null,
      validTo: record.validTo?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      entries: activeEntries.map((entry) => ({
          id: entry.id,
          roleId: entry.roleId,
          currency: entry.currency,
          billRate: this.toNumber(entry.billRate),
          costRate: this.toNumber(entry.costRate),
          role: {
            id: entry.role.id,
            code: entry.role.code,
            name: entry.role.name,
            description: entry.role.description ?? null,
          },
        })),
    };
  }

  private defaultRatesForRole(roleCode: string): {
    billRate: number;
    costRate: number;
  } {
    const match = DEFAULT_ORG_ROLE_DEFINITIONS.find(
      (role) => role.code === roleCode,
    );
    if (match) {
      return { billRate: match.billRate, costRate: match.costRate };
    }
    return { billRate: 0, costRate: 0 };
  }

  private toNumber(value: Prisma.Decimal | null | undefined): number {
    return value ? value.toNumber() : 0;
  }
}
