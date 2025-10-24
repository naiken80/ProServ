import 'server-only';

import { projectSummarySchema, projectWorkspaceSchema, type SessionUser } from '@proserv/shared';
import { z } from 'zod';

import { buildSessionHeaders } from '../session-headers';
import { getServerSession } from '../session.server';

const internalApiUrl =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api';

export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type ProjectWorkspace = z.infer<typeof projectWorkspaceSchema>;
export type PipelineStatus = ProjectSummary['status'];

const projectSummariesResponseSchema = z.object({
  data: z.array(projectSummarySchema),
  meta: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    totalMatchingSearch: z.number().int().min(0),
    totalAll: z.number().int().min(0),
  }),
  counts: z.object({
    planning: z.number().int().min(0),
    estimating: z.number().int().min(0),
    'in-flight': z.number().int().min(0),
  }),
  lastUpdated: z.string().datetime().nullable(),
});

export type ProjectSummariesResponse = z.infer<
  typeof projectSummariesResponseSchema
>;

export type FetchProjectSummariesInput = {
  search?: string;
  status?: PipelineStatus;
  page?: number;
  pageSize?: number;
};

export async function fetchProjectSummaries(
  params: FetchProjectSummariesInput = {},
  session?: SessionUser,
): Promise<ProjectSummariesResponse> {
  const normalizedBase = internalApiUrl.replace(/\/$/, '');
  const endpoint = new URL(`${normalizedBase}/v1/projects`);
  const query = new URLSearchParams();

  const trimmedSearch = params.search?.trim();
  if (trimmedSearch) {
    query.set('search', trimmedSearch);
  }

  if (params.status) {
    query.set('status', params.status);
  }

  if (params.page && params.page > 1) {
    query.set('page', params.page.toString());
  }

  if (params.pageSize && params.pageSize !== 6) {
    query.set('pageSize', params.pageSize.toString());
  }

  if (Array.from(query.keys()).length > 0) {
    endpoint.search = query.toString();
  }

  const activeSession = session ?? getServerSession();

  const response = await fetch(endpoint.toString(), {
    cache: 'no-store',
    headers: buildSessionHeaders(activeSession),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch project summaries');
  }

  const payload = await response.json();
  return projectSummariesResponseSchema.parse(payload);
}

export async function fetchProjectSummary(
  id: string,
  session?: SessionUser,
): Promise<ProjectSummary | null> {
  if (!id) return null;

  const normalizedBase = internalApiUrl.replace(/\/$/, '');
  const endpoint = `${normalizedBase}/v1/projects/${encodeURIComponent(id)}`;

  const activeSession = session ?? getServerSession();

  const response = await fetch(endpoint, {
    cache: 'no-store',
    headers: buildSessionHeaders(activeSession),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch project summary');
  }

  const payload = await response.json();
  return projectSummarySchema.parse(payload);
}

export async function fetchProjectWorkspace(
  id: string,
  session?: SessionUser,
) {
  if (!id) return null;

  const normalizedBase = internalApiUrl.replace(/\/$/, '');
  const endpoint = `${normalizedBase}/v1/projects/${encodeURIComponent(id)}`;

  const activeSession = session ?? getServerSession();

  const response = await fetch(endpoint, {
    cache: 'no-store',
    headers: buildSessionHeaders(activeSession),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch project workspace');
  }

  const payload = await response.json();
  return projectWorkspaceSchema.parse(payload);
}
