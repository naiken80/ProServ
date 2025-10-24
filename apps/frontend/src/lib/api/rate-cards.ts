import 'server-only';

import {
  rateCardCollectionSchema,
  rateCardSchema,
  type SessionUser,
} from '@proserv/shared';
import { z } from 'zod';

import { buildSessionHeaders } from '../session-headers';
import { getServerSession } from '../session.server';

const internalApiUrl =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api';

export type RateCardCollection = z.infer<typeof rateCardCollectionSchema>;
export type RateCardDetail = z.infer<typeof rateCardSchema>;

export async function fetchRateCards(session?: SessionUser) {
  const normalizedBase = internalApiUrl.replace(/\/$/, '');
  const endpoint = `${normalizedBase}/v1/rate-cards`;

  const activeSession = session ?? getServerSession();

  const response = await fetch(endpoint, {
    cache: 'no-store',
    headers: buildSessionHeaders(activeSession),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch rate cards');
  }

  const payload = await response.json();
  return rateCardCollectionSchema.parse(payload);
}

export async function fetchRateCard(
  id: string,
  session?: SessionUser,
): Promise<RateCardDetail | null> {
  if (!id) return null;

  const normalizedBase = internalApiUrl.replace(/\/$/, '');
  const endpoint = `${normalizedBase}/v1/rate-cards/${encodeURIComponent(id)}`;

  const activeSession = session ?? getServerSession();

  const response = await fetch(endpoint, {
    cache: 'no-store',
    headers: buildSessionHeaders(activeSession),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch rate card');
  }

  const payload = await response.json();
  return rateCardSchema.parse(payload);
}
