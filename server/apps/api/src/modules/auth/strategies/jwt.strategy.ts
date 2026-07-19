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
    if (payload.scope === 'PHARMACY') {
      if (payload.entityType === 'pharmacy') {
        // Pharmacy admin login
        const pharmacy = await this.prisma.client.pharmacy.findUnique({
          where: { id: payload.sub },
          select: { id: true, login: true, status: true },
        });
        if (!pharmacy || pharmacy.status !== 'ACTIVE') {
          throw new UnauthorizedException('Pharmacy not found or inactive');
        }
        return {
          id: pharmacy.id,
          login: pharmacy.login,
          role: payload.role,
          scope: payload.scope,
          pharmacyId: payload.pharmacyId,
        };
      }

      if (payload.entityType === 'employee') {
        // Employee login
        const employee = await this.prisma.client.employee.findUnique({
          where: { id: payload.sub },
          select: { id: true, login: true, status: true },
        });
        if (!employee || employee.status !== 'ACTIVE') {
          throw new UnauthorizedException('Employee not found or inactive');
        }
        return {
          id: employee.id,
          login: employee.login,
          role: payload.role,
          scope: payload.scope,
          pharmacyId: payload.pharmacyId,
        };
      }
    }

    throw new UnauthorizedException('Invalid token payload');
  }
}
