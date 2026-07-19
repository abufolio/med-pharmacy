import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';
import 'reflect-metadata';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Check @Public() decorator via reflect-metadata directly
    const isPublic =
      Reflect.getMetadata(IS_PUBLIC_KEY, context.getHandler()) ??
      Reflect.getMetadata(IS_PUBLIC_KEY, context.getClass()) ??
      false;

    if (isPublic) return true;

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
