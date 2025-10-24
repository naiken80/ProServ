import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { sessionUserSchema, type SessionUser } from '@proserv/shared';

function resolveHeaderValue(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined>; user?: SessionUser }>();

    const headers = request.headers;

    const rawUserId = resolveHeaderValue(headers['x-proserv-user-id']);
    const userId = rawUserId?.trim() || 'engagement-lead';

    const rawEmail = resolveHeaderValue(headers['x-proserv-user-email']);
    const email =
      rawEmail?.trim().toLowerCase() ||
      `${userId.replace(/[^a-z0-9]/gi, '.')}@proserv.local`;

    const rawName = resolveHeaderValue(headers['x-proserv-user-name']);
    let givenName: string | undefined;
    let familyName: string | undefined;
    if (rawName) {
      const [first, ...rest] = rawName.trim().split(/\s+/);
      givenName = first;
      familyName = rest.join(' ') || undefined;
    }

    const rolesHeader = resolveHeaderValue(headers['x-proserv-user-roles']);
    const roles =
      rolesHeader?.split(',').map((role) => role.trim()).filter(Boolean) ?? [];

    const session = sessionUserSchema.parse({
      id: userId,
      email,
      givenName,
      familyName,
      roles,
    });

    request.user = session;
    return true;
  }
}
