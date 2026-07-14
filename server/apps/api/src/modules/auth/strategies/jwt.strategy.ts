import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@server/database';
import { JwtPayload } from '../entities/auth-tokens.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-jwt-secret-super-safe-2024',
    });
  }

  async validate(payload: JwtPayload) {
    // Determine entity type from payload
    let entity: { id: string; login: string; status: string } | null = null;

    if (payload.scope === 'PHARMACY') {
      const employee = await this.prisma.client.employee.findUnique({
        where: { id: payload.sub },
        select: { id: true, login: true, status: true, pharmacyId: true },
      });
      if (!employee || employee.status !== 'ACTIVE') {
        throw new UnauthorizedException('Employee not found or inactive');
      }
      entity = employee;
    }

    if (!entity) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: entity.id,
      login: entity.login,
      role: payload.role,
      scope: payload.scope,
      pharmacyId: payload.pharmacyId,
    };
  }
}
