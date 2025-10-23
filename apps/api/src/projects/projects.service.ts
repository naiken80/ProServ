import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';

import type { ProjectSummary } from '@proserv/shared';

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

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectSummaries(query: GetProjectSummariesDto) {
    const pageSize = query.pageSize ?? 6;
    const requestedPage = query.page ?? 1;
    const searchTerm = query.search ?? '';
    const statusFilter = query.status;

    const baseWhere: Prisma.ProjectWhereInput = {
      status: {
        not: ProjectStatus.ARCHIVED,
      },
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

  async getProjectSummary(projectId: string): Promise<ProjectSummary> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        status: {
          not: ProjectStatus.ARCHIVED,
        },
      },
      include: this.projectInclude,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const [summary] = await this.buildSummaries([project]);
    return summary;
  }

  async createProject(dto: CreateProjectDto): Promise<ProjectSummary> {
    const organizationId = await this.ensurePrimaryOrganizationId(
      dto.baseCurrency,
    );
    const ownerId = await this.ensureDefaultOwnerId(organizationId);

    const startDate = new Date(dto.startDate);
    const endDate =
      dto.endDate === undefined ? undefined : new Date(dto.endDate);

    const baselineVersionName = dto.baselineVersionName ?? 'Baseline';

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
        versions: {
          create: {
            name: baselineVersionName,
            versionNumber: 1,
            fxSnapshot: [],
          },
        },
      },
      select: { id: true },
    });

    return this.getProjectSummary(created.id);
  }

  async updateProject(
    id: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectSummary> {
    const projectUpdates: Prisma.ProjectUpdateInput = {};

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

    if (!hasProjectChanges && !dto.baselineVersionName) {
      throw new BadRequestException('No fields provided to update');
    }

    if (hasProjectChanges) {
      try {
        await this.prisma.project.update({
          where: { id },
          data: projectUpdates,
          select: { id: true },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException('Project not found');
        }
        throw error;
      }
    } else {
      const existing = await this.prisma.project.findFirst({
        where: {
          id,
          status: {
            not: ProjectStatus.ARCHIVED,
          },
        },
        select: { id: true },
      });

      if (!existing) {
        throw new NotFoundException('Project not found');
      }
    }

    if (dto.baselineVersionName) {
      await this.prisma.estimateVersion.updateMany({
        where: { projectId: id, versionNumber: 1 },
        data: { name: dto.baselineVersionName },
      });
    }

    return this.getProjectSummary(id);
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

  private async ensureDefaultOwnerId(organizationId: string): Promise<string> {
    const existing = await this.prisma.user.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (existing) {
      return existing.id;
    }

    const created = await this.prisma.user.create({
      data: {
        organizationId,
        email: 'engagement.lead@proserv.local',
        givenName: 'Engagement',
        familyName: 'Lead',
      },
      select: { id: true },
    });

    return created.id;
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

    const assignmentPlans = versionIds.length
      ? await this.prisma.assignment.findMany({
          where: {
            workItem: {
              versionId: { in: versionIds },
            },
          },
          select: {
            workItem: {
              select: { versionId: true },
            },
            plans: {
              select: { bill: true, cost: true },
            },
          },
        })
      : [];

    const financialsByVersion = new Map<
      string,
      { bill: number; cost: number }
    >();

    for (const entry of assignmentPlans) {
      const versionId = entry.workItem.versionId;
      if (!versionId) continue;

      const existing = financialsByVersion.get(versionId) ?? {
        bill: 0,
        cost: 0,
      };

      for (const plan of entry.plans) {
        existing.bill += this.toNumber(plan.bill);
        existing.cost += this.toNumber(plan.cost);
      }

      financialsByVersion.set(versionId, existing);
    }

    return projects.map((project) => {
      const latestVersion = project.versions[0];
      const financials = latestVersion
        ? financialsByVersion.get(latestVersion.id) ?? {
            bill: 0,
            cost: 0,
          }
        : { bill: 0, cost: 0 };

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
        totalValue,
        currency: project.baseCurrency,
        margin,
        updatedAt: maxUpdatedAt.toISOString(),
      };
    });
  }
}
