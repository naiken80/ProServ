import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';

import type {
  ProjectSummary,
  ProjectWorkspace,
  SessionUser,
} from '@proserv/shared';

import { PrismaService } from '../infra/prisma/prisma.service';

import {
  GetProjectSummariesDto,
  PipelineStatus,
  pipelineStatuses,
} from './dto/get-project-summaries.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    createdBy: true;
    versions: {
      select: {
        id: true;
        versionNumber: true;
        status: true;
        updatedAt: true;
      };
      orderBy: { versionNumber: 'desc' };
      take: 5;
    };
  };
}>;

type FinancialAggregate = {
  bill: number;
  cost: number;
  assignmentCount: number;
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectSummaries(
    user: SessionUser,
    query: GetProjectSummariesDto,
  ) {
    const pageSize = query.pageSize ?? 6;
    const requestedPage = query.page ?? 1;
    const searchTerm = query.search ?? '';
    const statusFilter = query.status;

    const baseWhere: Prisma.ProjectWhereInput = {
      status: {
        not: ProjectStatus.ARCHIVED,
      },
      createdById: user.id,
    };

    const searchWhere: Prisma.ProjectWhereInput = {
      ...baseWhere,
      ...(searchTerm
        ? {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { clientName: { contains: searchTerm, mode: 'insensitive' } },
              {
                createdBy: {
                  is: {
                    OR: [
                      {
                        givenName: {
                          contains: searchTerm,
                          mode: 'insensitive',
                        },
                      },
                      {
                        familyName: {
                          contains: searchTerm,
                          mode: 'insensitive',
                        },
                      },
                      {
                        email: {
                          contains: searchTerm,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const listWhere: Prisma.ProjectWhereInput = {
      ...searchWhere,
      ...(statusFilter ? this.pipelineStatusWhere(statusFilter) : {}),
    };

    const [statusCountsEntries, totalMatchingSearch, totalAll, totalItems] =
      await Promise.all([
        Promise.all(
          pipelineStatuses.map(async (status) => {
            const count = await this.prisma.project.count({
              where: {
                ...searchWhere,
                ...this.pipelineStatusWhere(status),
              },
            });
            return [status, count] as const;
          }),
        ),
        this.prisma.project.count({ where: searchWhere }),
        this.prisma.project.count({ where: baseWhere }),
        this.prisma.project.count({ where: listWhere }),
      ]);

    const statusCounts = Object.fromEntries(statusCountsEntries) as Record<
      PipelineStatus,
      number
    >;

    const totalPages =
      totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
    const currentPage =
      totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);
    const skip =
      totalPages === 0 ? 0 : Math.max((currentPage - 1) * pageSize, 0);

    const projects = await this.prisma.project.findMany({
      where: listWhere,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
      include: this.projectInclude,
    });

    const summaries = await this.buildSummaries(projects);

    const lastUpdatedProject = await this.prisma.project.findFirst({
      where: listWhere,
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    return {
      data: summaries,
      meta: {
        page: currentPage,
        pageSize,
        totalItems,
        totalPages,
        totalMatchingSearch,
        totalAll,
      },
      counts: statusCounts,
      lastUpdated: lastUpdatedProject?.updatedAt.toISOString() ?? null,
    };
  }

  async getProjectSummary(
    user: SessionUser,
    projectId: string,
  ): Promise<ProjectSummary> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        status: {
          not: ProjectStatus.ARCHIVED,
        },
        createdById: user.id,
      },
      include: this.projectInclude,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const [summary] = await this.buildSummaries([project]);
    return summary;
  }

  async getProjectWorkspace(
    user: SessionUser,
    projectId: string,
  ): Promise<ProjectWorkspace> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        status: {
          not: ProjectStatus.ARCHIVED,
        },
        createdById: user.id,
      },
      include: this.projectInclude,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const [summary] = await this.buildSummaries([project]);

    const baselineVersion = await this.prisma.estimateVersion.findFirst({
      where: { projectId, versionNumber: 1 },
      select: {
        id: true,
        name: true,
        versionNumber: true,
        status: true,
        updatedAt: true,
        rateCardId: true,
        rateCard: {
          select: {
            id: true,
            name: true,
            currency: true,
            organizationId: true,
            validFrom: true,
            validTo: true,
            createdAt: true,
            updatedAt: true,
            entries: {
              include: {
                role: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!baselineVersion) {
      return { summary, baseline: null };
    }

    const financials = await this.collectFinancials([
      baselineVersion.id,
    ]);
    const aggregates =
      financials.get(baselineVersion.id) ?? {
        bill: 0,
        cost: 0,
        assignmentCount: 0,
      };

    const totalValue = aggregates.bill;
    const totalCost = aggregates.cost;
    const margin =
      totalValue > 0 ? (totalValue - totalCost) / totalValue : 0;

    const rateCard =
      baselineVersion.rateCardId && baselineVersion.rateCard
        ? {
            id: baselineVersion.rateCard.id,
            name: baselineVersion.rateCard.name,
            currency: baselineVersion.rateCard.currency,
            organizationId: baselineVersion.rateCard.organizationId,
            validFrom:
              baselineVersion.rateCard.validFrom?.toISOString() ?? null,
            validTo:
              baselineVersion.rateCard.validTo?.toISOString() ?? null,
            createdAt: baselineVersion.rateCard.createdAt.toISOString(),
            updatedAt: baselineVersion.rateCard.updatedAt.toISOString(),
            entries: baselineVersion.rateCard.entries
              .slice()
              .sort((a, b) => a.role.name.localeCompare(b.role.name))
              .map((entry) => ({
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
          }
        : null;

    return {
      summary,
      baseline: {
        id: baselineVersion.id,
        name: baselineVersion.name,
        versionNumber: baselineVersion.versionNumber,
        status: baselineVersion.status,
        updatedAt: baselineVersion.updatedAt.toISOString(),
        rateCardId: baselineVersion.rateCardId ?? null,
        rateCardName: rateCard?.name,
        rateCard,
        totalValue,
        totalCost,
        margin,
        currency: summary.currency,
        assignmentCount: aggregates.assignmentCount,
      },
    };
  }

  async createProject(
    user: SessionUser,
    dto: CreateProjectDto,
  ): Promise<ProjectSummary> {
    const organizationId = await this.ensurePrimaryOrganizationId(
      dto.baseCurrency,
    );
    const ownerId = await this.ensureSessionUserRecord(user, organizationId);

    const startDate = new Date(dto.startDate);
    const endDate =
      dto.endDate === undefined ? undefined : new Date(dto.endDate);

    const baselineVersionName = dto.baselineVersionName ?? 'Baseline';
    const defaultRateCardId =
      await this.findDefaultRateCardId(organizationId);

    const created = await this.prisma.project.create({
      data: {
        name: dto.name,
        clientName: dto.clientName,
        organizationId,
        createdById: ownerId,
        baseCurrency: dto.baseCurrency,
        billingModel: dto.billingModel,
        startDate,
        endDate,
        baselineRateCardId: defaultRateCardId ?? undefined,
        versions: {
          create: {
            name: baselineVersionName,
            versionNumber: 1,
            ...(defaultRateCardId
              ? { rateCardId: defaultRateCardId }
              : {}),
            fxSnapshot: [],
          },
        },
      },
      select: { id: true },
    });

    return this.getProjectSummary(user, created.id);
  }

  async updateProject(
    user: SessionUser,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectSummary> {
    const projectUpdates: Prisma.ProjectUncheckedUpdateInput = {};

    if (dto.name !== undefined) {
      projectUpdates.name = dto.name;
    }

    if (dto.clientName !== undefined) {
      projectUpdates.clientName = dto.clientName;
    }

    if (dto.baseCurrency !== undefined) {
      projectUpdates.baseCurrency = dto.baseCurrency;
    }

    if (dto.billingModel !== undefined) {
      projectUpdates.billingModel = dto.billingModel;
    }

    if (dto.startDate !== undefined) {
      projectUpdates.startDate = new Date(dto.startDate);
    }

    if (dto.endDate !== undefined) {
      projectUpdates.endDate =
        dto.endDate === null ? null : new Date(dto.endDate);
    }

    const hasProjectChanges = Object.keys(projectUpdates).length > 0;
    const wantsRateCardUpdate = dto.baselineRateCardId !== undefined;

    if (!hasProjectChanges && !dto.baselineVersionName && !wantsRateCardUpdate) {
      throw new BadRequestException('No fields provided to update');
    }

    const existing = await this.prisma.project.findFirst({
      where: {
        id,
        createdById: user.id,
        status: {
          not: ProjectStatus.ARCHIVED,
        },
      },
      select: { id: true, organizationId: true },
    });

    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    let normalizedRateCardId: string | null = null;

    if (wantsRateCardUpdate) {
      const rateCardValue = dto.baselineRateCardId ?? null;
      const trimmed =
        rateCardValue === null ? null : rateCardValue.trim();
      const candidate =
        trimmed && trimmed.length > 0 ? trimmed : null;

      if (candidate) {
        const rateCard = await this.prisma.rateCard.findFirst({
          where: {
            id: candidate,
            organizationId: existing.organizationId,
          },
          select: { id: true },
        });

        if (!rateCard) {
          throw new BadRequestException('Rate card not found');
        }

        normalizedRateCardId = rateCard.id;
      } else {
        normalizedRateCardId = null;
      }
    }

    const updateData: Prisma.ProjectUncheckedUpdateInput = {
      ...projectUpdates,
    };

    if (wantsRateCardUpdate) {
      updateData.baselineRateCardId = normalizedRateCardId;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.project.update({
        where: { id },
        data: updateData,
        select: { id: true },
      });
    }

    if (dto.baselineVersionName) {
      await this.prisma.estimateVersion.updateMany({
        where: { projectId: id, versionNumber: 1 },
        data: { name: dto.baselineVersionName },
      });
    }

    if (wantsRateCardUpdate) {
      await this.prisma.estimateVersion.updateMany({
        where: { projectId: id, versionNumber: 1 },
        data: { rateCardId: normalizedRateCardId ?? null },
      });
    }

    return this.getProjectSummary(user, id);
  }

  private pipelineStatusWhere(status: PipelineStatus): Prisma.ProjectWhereInput {
    switch (status) {
      case 'planning':
        return {
          status: ProjectStatus.DRAFT,
          versions: {
            none: {
              status: { in: ['IN_REVIEW', 'APPROVED'] },
            },
          },
        };
      case 'estimating':
        return {
          status: ProjectStatus.DRAFT,
          versions: {
            some: {
              status: { in: ['IN_REVIEW', 'APPROVED'] },
            },
          },
        };
      case 'in-flight':
        return {
          status: ProjectStatus.ACTIVE,
        };
      default:
        return {};
    }
  }

  private async ensurePrimaryOrganizationId(
    baseCurrency: string,
  ): Promise<string> {
    const existing = await this.prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (existing) {
      return existing.id;
    }

    const created = await this.prisma.organization.create({
      data: {
        name: 'Primary Services Org',
        timezone: 'UTC',
        currency: baseCurrency,
      },
      select: { id: true },
    });

    return created.id;
  }

  private async ensureSessionUserRecord(
    session: SessionUser,
    organizationId: string,
  ): Promise<string> {
    const existing = await this.prisma.user.findFirst({
      where: {
        organizationId,
        OR: [{ id: session.id }, { email: session.email }],
      },
      select: { id: true },
    });

    if (existing) {
      return existing.id;
    }

    const givenNameInput = session.givenName?.trim();
    const familyNameInput = session.familyName?.trim();
    const givenName =
      givenNameInput && givenNameInput.length > 0
        ? givenNameInput
        : 'Engagement';
    const familyName =
      familyNameInput && familyNameInput.length > 0
        ? familyNameInput
        : 'Lead';

    const created = await this.prisma.user.create({
      data: {
        organizationId,
        id: session.id,
        email: session.email,
        givenName,
        familyName,
      },
      select: { id: true },
    });

    return created.id;
  }

  private async findDefaultRateCardId(
    organizationId: string,
  ): Promise<string | null> {
    const rateCard = await this.prisma.rateCard.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    return rateCard?.id ?? null;
  }

  private async collectFinancials(
    versionIds: string[],
  ): Promise<Map<string, FinancialAggregate>> {
    if (versionIds.length === 0) {
      return new Map();
    }

    const assignments = await this.prisma.assignment.findMany({
      where: {
        workItem: {
          versionId: { in: versionIds },
        },
      },
      select: {
        id: true,
        workItem: {
          select: { versionId: true },
        },
        plans: {
          select: { bill: true, cost: true },
        },
      },
    });

    const aggregates = new Map<string, FinancialAggregate>();

    for (const assignment of assignments) {
      const versionId = assignment.workItem.versionId;
      if (!versionId) continue;

      const current =
        aggregates.get(versionId) ?? {
          bill: 0,
          cost: 0,
          assignmentCount: 0,
        };

      current.assignmentCount += 1;

      for (const plan of assignment.plans) {
        current.bill += this.toNumber(plan.bill);
        current.cost += this.toNumber(plan.cost);
      }

      aggregates.set(versionId, current);
    }

    return aggregates;
  }

  private derivePipelineStatus(
    project: ProjectWithRelations,
  ): PipelineStatus {
    if (project.status === ProjectStatus.ACTIVE) {
      return 'in-flight';
    }

    const hasReviewVersion = project.versions.some((version) =>
      ['IN_REVIEW', 'APPROVED'].includes(version.status),
    );

    return hasReviewVersion ? 'estimating' : 'planning';
  }

  private toNumber(value: Prisma.Decimal | null | undefined): number {
    if (!value) return 0;
    return value.toNumber();
  }

  private readonly projectInclude = {
    createdBy: true,
    versions: {
      select: {
        id: true,
        versionNumber: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { versionNumber: 'desc' },
      take: 5,
    },
  } as const;

  private formatDate(value: Date | null | undefined): string | undefined {
    return value ? value.toISOString().split('T')[0] : undefined;
  }

  private async buildSummaries(
    projects: ProjectWithRelations[],
  ): Promise<ProjectSummary[]> {
    if (projects.length === 0) {
      return [];
    }

    const versionIds = projects
      .map((project) => project.versions[0]?.id)
      .filter((value): value is string => Boolean(value));

    const financialsByVersion = await this.collectFinancials(versionIds);

    return projects.map((project) => {
      const latestVersion = project.versions[0];
      const financials = latestVersion
        ? financialsByVersion.get(latestVersion.id) ?? {
            bill: 0,
            cost: 0,
            assignmentCount: 0,
          }
        : { bill: 0, cost: 0, assignmentCount: 0 };

      const status = this.derivePipelineStatus(project);
      const totalValue = financials.bill;
      const totalCost = financials.cost;
      const margin =
        totalValue > 0 ? (totalValue - totalCost) / totalValue : 0;

      const owner =
        project.createdBy?.givenName || project.createdBy?.familyName
          ? `${project.createdBy?.givenName ?? ''} ${
              project.createdBy?.familyName ?? ''
            }`.trim()
          : project.createdBy?.email ?? 'Unassigned';

      const updatedAtCandidates = [
        project.updatedAt,
        latestVersion?.updatedAt,
      ]
        .filter((value): value is Date => Boolean(value))
        .map((value) => value.getTime());

      const maxUpdatedAt =
        updatedAtCandidates.length > 0
          ? new Date(Math.max(...updatedAtCandidates))
          : project.updatedAt;

      const startDate =
        this.formatDate(project.startDate) ??
        project.startDate.toISOString().split('T')[0];
      const endDate = this.formatDate(project.endDate);

      return {
        id: project.id,
        name: project.name,
        client: project.clientName,
        owner,
        status,
        startDate,
        endDate,
        billingModel: project.billingModel,
        totalValue,
        currency: project.baseCurrency,
        margin,
        updatedAt: maxUpdatedAt.toISOString(),
      };
    });
  }
}
