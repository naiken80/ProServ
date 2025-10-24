import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { SessionUser } from '@proserv/shared';

export const ActiveUser = createParamDecorator(
  (_: never, ctx: ExecutionContext): SessionUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: SessionUser }>();

    if (!request.user) {
      throw new UnauthorizedException('Session context is required');
    }

    return request.user;
  },
);
