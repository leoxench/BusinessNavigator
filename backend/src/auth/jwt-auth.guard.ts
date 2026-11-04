import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/** Перевіряє заголовок `Authorization: Bearer <token>` і кладе id користувача в request.userId. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const [scheme, token] = String(req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Потрібно увійти');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: number }>(token);
      req.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Сесія недійсна або завершилась');
    }
  }
}

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): number => {
  return ctx.switchToHttp().getRequest().userId;
});
