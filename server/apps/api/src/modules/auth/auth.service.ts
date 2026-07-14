import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@server/database';
import { LoginDto } from './dto/login.dto';
import { RegisterEmployeeDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import {
  AuthTokens,
  JwtPayload,
  LoginResponse,
} from './entities/auth-tokens.entity';
import * as crypto from 'crypto';
import { AuditHelper } from '../audit/audit.helper';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly ACCESS_EXPIRES = '15m';
  private readonly REFRESH_EXPIRES = '30d';
  private readonly REFRESH_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditHelper,
  ) {}

  // ──────────────────────────────────────────────
  // Login
  // ──────────────────────────────────────────────
  async login(dto: LoginDto): Promise<LoginResponse> {
    const { login, password } = dto;

    // Try pharmacy login first
    const pharmacy = await this.prisma.client.pharmacy.findUnique({
      where: { login },
      select: { id: true, login: true, passwordHash: true, status: true, name: true },
    });

    if (pharmacy) {
      return this.handlePharmacyLogin(pharmacy, password);
    }

    // Try employee login
    const employee = await this.prisma.client.employee.findUnique({
      where: { login },
      select: {
        id: true, login: true, passwordHash: true, status: true,
        fullName: true, pharmacyId: true,
        role: { select: { name: true, scope: true } },
        pharmacy: { select: { name: true } },
      },
    });

    if (employee) {
      return this.handleEmployeeLogin(employee, password);
    }

    this.logger.warn(`Failed login attempt for: ${login}`);
    this.audit.log('LOGIN_FAILED', 'employee', undefined, undefined, { login });
    throw new UnauthorizedException('Invalid login or password');
  }

  // ──────────────────────────────────────────────
  // Refresh Token
  // ──────────────────────────────────────────────
  async refresh(dto: RefreshDto): Promise<AuthTokens> {
    const { refreshToken } = dto;
    const hash = this.hashToken(refreshToken);

    const session = await this.prisma.client.session.findUnique({
      where: { refreshTokenHash: hash },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Verify JWT signature
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate: delete old session, create new tokens
    await this.prisma.client.session.delete({
      where: { id: session.id },
    });

    const tokens = await this.generateTokens(payload);

    this.audit.log('TOKEN_REFRESH', 'session', session.userId);

    return tokens;
  }

  // ──────────────────────────────────────────────
  // Logout
  // ──────────────────────────────────────────────
  async logout(refreshToken: string): Promise<void> {
    const hash = this.hashToken(refreshToken);

    await this.prisma.client.session.deleteMany({
      where: { refreshTokenHash: hash },
    });

    this.audit.log('LOGOUT', 'session');
  }

  // ──────────────────────────────────────────────
  // Register Employee
  // ──────────────────────────────────────────────
  async registerEmployee(dto: RegisterEmployeeDto, pharmacyId: string): Promise<LoginResponse> {
    const { login, password, fullName, roleId } = dto;

    // Check uniqueness
    const existing = await this.prisma.client.employee.findUnique({
      where: { login },
    });
    if (existing) {
      throw new ConflictException('Login already taken');
    }

    // Verify role belongs to PHARMACY scope
    const role = await this.prisma.client.role.findUnique({
      where: { id: roleId },
    });
    if (!role || role.scope !== 'PHARMACY') {
      throw new UnauthorizedException('Invalid role');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const employee = await this.prisma.client.employee.create({
      data: {
        pharmacyId,
        roleId,
        fullName,
        login,
        passwordHash,
      },
      select: {
        id: true, login: true, fullName: true,
        pharmacyId: true,
        role: { select: { name: true } },
        pharmacy: { select: { name: true } },
      },
    });

    const tokens = await this.generateTokens({
      sub: employee.id,
      role: employee.role.name,
      scope: 'PHARMACY',
      pharmacyId: employee.pharmacyId,
      type: 'access',
    });

    this.audit.log(
      'EMPLOYEE_CREATED',
      'employee',
      employee.id,
      undefined,
      { login, fullName, pharmacyId },
    );

    return {
      tokens,
      user: {
        id: employee.id,
        login: employee.login,
        role: employee.role.name,
        fullName: employee.fullName,
        pharmacyId: employee.pharmacyId,
        pharmacyName: employee.pharmacy.name,
      },
    };
  }

  // ──────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────

  private async handlePharmacyLogin(
    pharmacy: { id: string; login: string; passwordHash: string; status: string; name: string },
    password: string,
  ): Promise<LoginResponse> {
    if (pharmacy.status !== 'ACTIVE') {
      this.audit.log('LOGIN_BLOCKED', 'pharmacy', pharmacy.id, undefined, { reason: 'inactive' });
      throw new UnauthorizedException('Pharmacy account is not active');
    }

    const valid = await bcrypt.compare(password, pharmacy.passwordHash);
    if (!valid) {
      this.audit.log('LOGIN_FAILED', 'pharmacy', pharmacy.id);
      throw new UnauthorizedException('Invalid login or password');
    }

    const tokens = await this.generateTokens({
      sub: pharmacy.id,
      role: 'PHARMACY_ADMIN',
      scope: 'PHARMACY',
      pharmacyId: pharmacy.id,
      type: 'access',
    });

    this.audit.log('PHARMACY_LOGIN', 'pharmacy', pharmacy.id);

    return {
      tokens,
      user: {
        id: pharmacy.id,
        login: pharmacy.login,
        role: 'PHARMACY_ADMIN',
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
      },
    };
  }

  private async handleEmployeeLogin(
    employee: {
      id: string; login: string; passwordHash: string; status: string;
      fullName: string; pharmacyId: string;
      role: { name: string; scope: string };
      pharmacy: { name: string };
    },
    password: string,
  ): Promise<LoginResponse> {
    if (employee.status !== 'ACTIVE') {
      this.audit.log('LOGIN_BLOCKED', 'employee', employee.id, undefined, { reason: 'inactive' });
      throw new UnauthorizedException('Employee account is not active');
    }

    const valid = await bcrypt.compare(password, employee.passwordHash);
    if (!valid) {
      this.audit.log('LOGIN_FAILED', 'employee', employee.id);
      throw new UnauthorizedException('Invalid login or password');
    }

    const tokens = await this.generateTokens({
      sub: employee.id,
      role: employee.role.name,
      scope: employee.role.scope as 'PHARMACY' | 'SYSTEM',
      pharmacyId: employee.pharmacyId,
      type: 'access',
    });

    this.audit.log('EMPLOYEE_LOGIN', 'employee', employee.id);

    return {
      tokens,
      user: {
        id: employee.id,
        login: employee.login,
        role: employee.role.name,
        fullName: employee.fullName,
        pharmacyId: employee.pharmacyId,
        pharmacyName: employee.pharmacy.name,
      },
    };
  }

  private async generateTokens(payload: JwtPayload): Promise<AuthTokens> {
    const accessToken = this.jwt.sign(
      { sub: payload.sub, role: payload.role, scope: payload.scope, pharmacyId: payload.pharmacyId, type: 'access' },
      { secret: process.env.JWT_SECRET, expiresIn: this.ACCESS_EXPIRES },
    );

    const refreshToken = this.jwt.sign(
      { sub: payload.sub, role: payload.role, scope: payload.scope, pharmacyId: payload.pharmacyId, type: 'refresh' },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: this.REFRESH_EXPIRES },
    );

    // Store refresh token hash
    const hash = this.hashToken(refreshToken);
    await this.prisma.client.session.create({
      data: {
        userId: payload.sub,
        refreshTokenHash: hash,
        expiresAt: new Date(Date.now() + this.REFRESH_EXPIRES_MS),
      },
    });

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
