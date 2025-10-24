import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Role } from '@prisma/client';

import type { SessionUser } from '@proserv/shared';

import { PrismaService } from '../infra/prisma/prisma.service';
import { OrganizationContextService } from '../infra/prisma/organization-context.service';
import { RateCardsService } from '../rate-cards/rate-cards.service';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ListRolesQueryDto } from './dto/list-roles.dto';

type RoleResponse = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationContext: OrganizationContextService,
    private readonly rateCardsService: RateCardsService,
  ) {}

  async listRoles(
    user: SessionUser,
    query: ListRolesQueryDto,
  ): Promise<{
    data: RoleResponse[];
    meta: {
      total: number;
      activeCount: number;
      archivedCount: number;
    };
  }> {
    const context = await this.organizationContext.resolve(user);
    const includeArchived = query.includeArchived ?? false;

    const where: Prisma.RoleWhereInput = {
      organizationId: context.organizationId,
      ...(includeArchived ? {} : { archivedAt: null }),
    };

    const orderBy: Prisma.RoleOrderByWithRelationInput[] = includeArchived
      ? [{ archivedAt: 'asc' }, { name: 'asc' }]
      : [{ name: 'asc' }];

    const [roles, activeCount, archivedCount] = await Promise.all([
      this.prisma.role.findMany({
        where,
        orderBy,
      }),
      this.prisma.role.count({
        where: { organizationId: context.organizationId, archivedAt: null },
      }),
      this.prisma.role.count({
        where: {
          organizationId: context.organizationId,
          archivedAt: { not: null },
        },
      }),
    ]);

    return {
      data: roles.map((role) => this.mapRole(role)),
      meta: {
        total: roles.length,
        activeCount,
        archivedCount,
      },
    };
  }

  async createRole(
    user: SessionUser,
    dto: CreateRoleDto,
  ): Promise<RoleResponse> {
    const context = await this.organizationContext.resolve(user);

    const description =
      dto.description && dto.description.length > 0 ? dto.description : null;

    let created: Role;
    try {
      created = await this.prisma.role.create({
        data: {
          organizationId: context.organizationId,
          code: dto.code,
          name: dto.name,
          description,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'A role with this code already exists for the organization.',
        );
      }
      throw error;
    }

    await this.rateCardsService.backfillEntriesForRoles(
      context.organizationId,
      [created],
    );

    return this.mapRole(created);
  }

  async updateRole(
    user: SessionUser,
    id: string,
    dto: UpdateRoleDto,
  ): Promise<RoleResponse> {
    const context = await this.organizationContext.resolve(user);

    const existing = await this.prisma.role.findFirst({
      where: { id, organizationId: context.organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    const updateData: Prisma.RoleUpdateInput = {};

    if (dto.code && dto.code !== existing.code) {
      updateData.code = dto.code;
    }

    if (dto.name && dto.name !== existing.name) {
      updateData.name = dto.name;
    }

    if (dto.description !== undefined) {
      updateData.description =
        dto.description && dto.description.length > 0
          ? dto.description
          : null;
    }

    if (Object.keys(updateData).length === 0) {
      return this.mapRole(existing);
    }

    let updated: Role;
    try {
      updated = await this.prisma.role.update({
        where: { id: existing.id },
        data: updateData,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'A role with this code already exists for the organization.',
        );
      }
      throw error;
    }

    return this.mapRole(updated);
  }

  async archiveRole(user: SessionUser, id: string): Promise<RoleResponse> {
    const context = await this.organizationContext.resolve(user);

    const existing = await this.prisma.role.findFirst({
      where: { id, organizationId: context.organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    if (existing.archivedAt) {
      return this.mapRole(existing);
    }

    const archivedAt = new Date();

    const archived = await this.prisma.role.update({
      where: { id: existing.id },
      data: { archivedAt },
    });

    await this.prisma.rateCardRole.deleteMany({
      where: { roleId: archived.id },
    });

    return this.mapRole(archived);
  }

  private mapRole(role: Role): RoleResponse {
    return {
      id: role.id,
      organizationId: role.organizationId,
      code: role.code,
      name: role.name,
      description: role.description ?? null,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      archivedAt: role.archivedAt ? role.archivedAt.toISOString() : null,
    };
  }
}

