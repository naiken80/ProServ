import {
  roleCollectionSchema,
  roleSchema,
  sessionUserSchema,
  type SessionUser,
} from '@proserv/shared';
import { z } from 'zod';

import { buildSessionHeaders } from '@/frontend/lib/session-headers';

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const normalizedBase = baseUrl.replace(/\/$/, '');

const createRolePayloadSchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(1).max(140),
  description: z.string().nullable().optional(),
});
export type CreateRolePayload = z.infer<typeof createRolePayloadSchema>;

const updateRolePayloadSchema = createRolePayloadSchema
  .partial()
  .refine(
    (value) => Object.values(value).some((item) => item !== undefined),
    { message: 'Provide at least one field to update' },
  );
export type UpdateRolePayload = z.infer<typeof updateRolePayloadSchema>;

type ListRolesOptions = {
  includeArchived?: boolean;
};

export async function listRoles(
  session: SessionUser,
  options: ListRolesOptions = {},
) {
  const parsedSession = sessionUserSchema.parse(session);
  const includeArchived = options.includeArchived ?? true;
  const query = includeArchived ? '?includeArchived=true' : '';

  const response = await fetch(`${normalizedBase}/v1/roles${query}`, {
    method: 'GET',
    headers: buildSessionHeaders(parsedSession),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to load roles');
  }

  const payloadJson = await response.json();
  return roleCollectionSchema.parse(payloadJson);
}

export async function createRole(
  session: SessionUser,
  payload: CreateRolePayload,
) {
  const parsedSession = sessionUserSchema.parse(session);
  const parsedPayload = createRolePayloadSchema.parse({
    ...payload,
    description:
      payload.description === undefined
        ? undefined
        : payload.description?.trim() ?? '',
  });

  const response = await fetch(`${normalizedBase}/v1/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildSessionHeaders(parsedSession),
    },
    body: JSON.stringify(parsedPayload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to create role');
  }

  const payloadJson = await response.json();
  return roleSchema.parse(payloadJson);
}

export async function updateRole(
  session: SessionUser,
  id: string,
  payload: UpdateRolePayload,
) {
  const parsedSession = sessionUserSchema.parse(session);
  const parsedPayload = updateRolePayloadSchema.parse({
    ...payload,
    description:
      payload.description === undefined
        ? undefined
        : payload.description?.trim() ?? '',
  });

  const response = await fetch(
    `${normalizedBase}/v1/roles/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...buildSessionHeaders(parsedSession),
      },
      body: JSON.stringify(parsedPayload),
    },
  );

  if (response.status === 404) {
    throw new Error('Role not found');
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to update role');
  }

  const payloadJson = await response.json();
  return roleSchema.parse(payloadJson);
}

export async function archiveRole(session: SessionUser, id: string) {
  const parsedSession = sessionUserSchema.parse(session);

  const response = await fetch(
    `${normalizedBase}/v1/roles/${encodeURIComponent(id)}/archive`,
    {
      method: 'POST',
      headers: buildSessionHeaders(parsedSession),
    },
  );

  if (response.status === 404) {
    throw new Error('Role not found');
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to archive role');
  }

  const payloadJson = await response.json();
  return roleSchema.parse(payloadJson);
}

