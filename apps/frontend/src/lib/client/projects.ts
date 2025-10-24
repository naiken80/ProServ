import {
  billingModelSchema,
  projectSummarySchema,
  sessionUserSchema,
  type SessionUser,
} from '@proserv/shared';
import { z } from 'zod';

import { buildSessionHeaders } from '@/frontend/lib/session-headers';

const createProjectPayloadSchema = z.object({
  name: z.string().min(1),
  clientName: z.string().min(1),
  startDate: z.string().min(1),
  baseCurrency: z.string().min(3),
  billingModel: billingModelSchema,
  endDate: z.string().min(1).optional(),
});

export type CreateProjectPayload = z.infer<typeof createProjectPayloadSchema>;

export async function createProject(
  session: SessionUser,
  payload: CreateProjectPayload,
) {
  const parsed = createProjectPayloadSchema.parse(payload);
  const validatedSession = sessionUserSchema.parse(session);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const endpoint = `${normalizedBase}/v1/projects`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildSessionHeaders(validatedSession),
    },
    body: JSON.stringify({
      ...parsed,
      baseCurrency: parsed.baseCurrency.toUpperCase(),
      baselineVersionName: 'Baseline',
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to create project');
  }

  const payloadJson = await response.json();
  return projectSummarySchema.parse(payloadJson);
}

const updateProjectPayloadSchema = z
  .object({
    name: z.string().min(1).optional(),
    clientName: z.string().min(1).optional(),
    baseCurrency: z.string().min(3).max(3).optional(),
    billingModel: billingModelSchema.optional(),
    startDate: z.string().min(1).optional(),
    endDate: z
      .union([z.string().min(1), z.null()])
      .optional(),
    baselineVersionName: z.string().min(1).max(120).optional(),
    baselineRateCardId: z.union([z.string().min(1), z.null()]).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: 'At least one field must be provided',
  });

export type UpdateProjectPayload = z.infer<typeof updateProjectPayloadSchema>;

export async function updateProject(
  session: SessionUser,
  id: string,
  payload: UpdateProjectPayload,
) {
  const parsedSession = sessionUserSchema.parse(session);
  const parsedPayload = updateProjectPayloadSchema.parse(payload);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const endpoint = `${normalizedBase}/v1/projects/${encodeURIComponent(id)}`;

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...buildSessionHeaders(parsedSession),
    },
    body: JSON.stringify(parsedPayload),
  });

  if (response.status === 404) {
    throw new Error('Project not found');
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to update project');
  }

  const payloadJson = await response.json();
  return projectSummarySchema.parse(payloadJson);
}
