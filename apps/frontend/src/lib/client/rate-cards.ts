import {
  rateCardCollectionSchema,
  rateCardSchema,
  sessionUserSchema,
  type SessionUser,
} from '@proserv/shared';
import { z } from 'zod';

import { buildSessionHeaders } from '@/frontend/lib/session-headers';

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const normalizedBase = baseUrl.replace(/\/$/, '');

const rateCardEntryInputSchema = z.object({
  roleId: z.string().min(1),
  billRate: z.number().nonnegative(),
  costRate: z.number().nonnegative(),
});

const createRateCardPayloadSchema = z.object({
  name: z.string().min(1).max(140),
  currency: z.string().min(3).max(3),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  entries: z.array(rateCardEntryInputSchema).optional(),
});
export type CreateRateCardPayload = z.infer<
  typeof createRateCardPayloadSchema
>;

export async function listRateCards(session: SessionUser) {
  const parsedSession = sessionUserSchema.parse(session);

  const response = await fetch(`${normalizedBase}/v1/rate-cards`, {
    method: 'GET',
    headers: buildSessionHeaders(parsedSession),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to load rate cards');
  }

  const payloadJson = await response.json();
  return rateCardCollectionSchema.parse(payloadJson);
}

export async function createRateCard(
  session: SessionUser,
  payload: CreateRateCardPayload,
) {
  const parsedSession = sessionUserSchema.parse(session);
  const parsedPayload = createRateCardPayloadSchema.parse(payload);

  const response = await fetch(`${normalizedBase}/v1/rate-cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildSessionHeaders(parsedSession),
    },
    body: JSON.stringify({
      ...parsedPayload,
      currency: parsedPayload.currency.toUpperCase(),
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to create rate card');
  }

  const payloadJson = await response.json();
  return rateCardSchema.parse(payloadJson);
}

const updateRateCardPayloadSchema = createRateCardPayloadSchema
  .partial()
  .extend({
    entries: z.array(rateCardEntryInputSchema).optional(),
  })
  .refine(
    (value) =>
      Object.values(value).some((item) => item !== undefined),
    {
      message: 'At least one field must be provided',
    },
  );
export type UpdateRateCardPayload = z.infer<
  typeof updateRateCardPayloadSchema
>;

export async function updateRateCard(
  session: SessionUser,
  id: string,
  payload: UpdateRateCardPayload,
) {
  const parsedSession = sessionUserSchema.parse(session);
  const parsedPayload = updateRateCardPayloadSchema.parse(payload);

  const response = await fetch(
    `${normalizedBase}/v1/rate-cards/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...buildSessionHeaders(parsedSession),
      },
      body: JSON.stringify(
        parsedPayload.currency
          ? {
              ...parsedPayload,
              currency: parsedPayload.currency.toUpperCase(),
            }
          : parsedPayload,
      ),
    },
  );

  if (response.status === 404) {
    throw new Error('Rate card not found');
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to update rate card');
  }

  const payloadJson = await response.json();
  return rateCardSchema.parse(payloadJson);
}
