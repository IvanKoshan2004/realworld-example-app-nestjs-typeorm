import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserJwt } from '../../auth/types/user-jwt.type';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UserJwt;
  },
);
