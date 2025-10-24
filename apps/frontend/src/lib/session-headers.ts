import type { SessionUser } from '@proserv/shared';

export function buildSessionHeaders(session: SessionUser): Record<string, string> {
  const displayName = [session.givenName, session.familyName]
    .filter((value) => value && value.trim().length > 0)
    .join(' ');

  const rolesValue = session.roles?.length ? session.roles.join(',') : '';

  return {
    'x-proserv-user-id': session.id,
    'x-proserv-user-email': session.email,
    ...(displayName ? { 'x-proserv-user-name': displayName } : {}),
    ...(rolesValue ? { 'x-proserv-user-roles': rolesValue } : {}),
  };
}
