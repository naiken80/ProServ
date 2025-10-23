import { billingModelSchema, projectSummarySchema } from '@proserv/shared';
import { z } from 'zod';

const createProjectPayloadSchema = z.object({
  name: z.string().min(1),
  clientName: z.string().min(1),
  startDate: z.string().min(1),
  baseCurrency: z.string().min(3),
  billingModel: billingModelSchema,
  endDate: z.string().min(1).optional(),
});

export type CreateProjectPayload = z.infer<typeof createProjectPayloadSchema>;

export async function createProject(payload: CreateProjectPayload) {
  const parsed = createProjectPayloadSchema.parse(payload);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const endpoint = `${normalizedBase}/v1/projects`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
