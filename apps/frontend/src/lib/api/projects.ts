import 'server-only';

import { projectSummarySchema } from '@proserv/shared';
import { z } from 'zod';

export type ProjectSummary = z.infer<typeof projectSummarySchema>;
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
): Promise<ProjectSummariesResponse> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
  const normalizedBase = baseUrl.replace(/\/$/, '');
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

  const response = await fetch(endpoint.toString(), {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch project summaries');
  }

  const payload = await response.json();
  return projectSummariesResponseSchema.parse(payload);
}

export async function fetchProjectSummary(
  id: string,
): Promise<ProjectSummary | null> {
  if (!id) return null;

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const endpoint = `${normalizedBase}/v1/projects/${encodeURIComponent(id)}`;

  const response = await fetch(endpoint, {
    cache: 'no-store',
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
