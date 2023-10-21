import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ValidatedJwtService } from '../../validated-jwt/validated-jwt.service';

@Injectable()
export class ExtractUserGuard implements CanActivate {
  constructor(private jwtService: ValidatedJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      return true;
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch (e) {}
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Token' ? token : undefined;
  }
}
