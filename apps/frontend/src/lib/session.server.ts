import { sessionUserSchema, type SessionUser } from '@proserv/shared';

function parseRoles(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);
}

const fallbackSession: SessionUser = sessionUserSchema.parse({
  id: 'engagement-lead',
  email: 'engagement.lead@proserv.local',
  givenName: 'Engagement',
  familyName: 'Lead',
  roles: ['engagement-lead'],
});

export function getServerSession(): SessionUser {
  const id = process.env.PROSERV_SESSION_USER_ID ?? fallbackSession.id;
  const email =
    process.env.PROSERV_SESSION_USER_EMAIL ?? fallbackSession.email;
  const givenName =
    process.env.PROSERV_SESSION_USER_GIVEN_NAME ?? fallbackSession.givenName;
  const familyName =
    process.env.PROSERV_SESSION_USER_FAMILY_NAME ??
    fallbackSession.familyName;
  const rolesEnv = process.env.PROSERV_SESSION_USER_ROLES;
  const roles =
    rolesEnv === undefined ? fallbackSession.roles : parseRoles(rolesEnv);

  return sessionUserSchema.parse({
    id,
    email,
    givenName,
    familyName,
    roles,
  });
}
