import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import * as bcrypt from 'bcryptjs';

// Mock bcryptjs at module level
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// ── Mock helpers ──
const mockDate = new Date('2026-07-12T12:00:00Z');
const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

const mockPharmacy = {
  id: 'ph-1',
  login: 'pharmacy01',
  passwordHash: '$2a$12$hashed',
  status: 'ACTIVE',
  name: 'Test Pharmacy',
};

const mockSuperAdmin = {
  id: 'sa-1',
  login: 'admin',
  passwordHash: '$2a$12$hashed',
  status: 'ACTIVE',
  fullName: 'Super Admin',
};

const mockEmployee = {
  id: 'emp-1',
  login: 'employee01',
  passwordHash: '$2a$12$hashed',
  status: 'ACTIVE',
  fullName: 'John Doe',
  pharmacyId: 'ph-1',
  role: { name: 'CASHIER', scope: 'PHARMACY' },
  pharmacy: { name: 'Test Pharmacy' },
};

const mockPayload = {
  sub: 'user-1',
  role: 'CASHIER',
  scope: 'PHARMACY' as const,
  pharmacyId: 'ph-1',
  type: 'access' as const,
};

const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 900,
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: jest.Mocked<JwtService>;
  let audit: any;

  // ── Test module setup ──
  beforeAll(async () => {
    // Force UTC for date tests
    jest.useFakeTimers({ now: mockDate });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    // Reset mocks
    const prismaMock = {
      client: {
        pharmacy: {
          findUnique: jest.fn(),
        },
        superAdmin: {
          findUnique: jest.fn(),
        },
        employee: {
          findUnique: jest.fn(),
          create: jest.fn(),
        },
        session: {
          findUnique: jest.fn(),
          delete: jest.fn(),
          deleteMany: jest.fn(),
          create: jest.fn(),
        },
        role: {
          findUnique: jest.fn(),
        },
      },
    };

    const jwtMock = {
      sign: jest.fn().mockReturnValue('mock-access-token'),
      verify: jest.fn(),
    };

    const auditMock = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: AuditHelper, useValue: auditMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);
    audit = module.get(AuditHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ══════════════════════════════════════════════
  //  LOGIN
  // ══════════════════════════════════════════════

  describe('login', () => {
    it('should login pharmacy successfully', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(mockTokens);

      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);

      const result = await service.login({ login: 'pharmacy01', password: 'pass123' });

      expect(result.user.role).toBe('PHARMACY_ADMIN');
      expect(result.user.pharmacyName).toBe('Test Pharmacy');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(audit.log).toHaveBeenCalledWith('PHARMACY_LOGIN', 'pharmacy', 'ph-1');
    });

    it('should login employee successfully', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(mockTokens);

      prisma.client.pharmacy.findUnique.mockResolvedValue(null);
      prisma.client.employee.findUnique.mockResolvedValue(mockEmployee);

      const result = await service.login({ login: 'employee01', password: 'pass123' });

      expect(result.user.role).toBe('CASHIER');
      expect(result.user.fullName).toBe('John Doe');
      expect(audit.log).toHaveBeenCalledWith('EMPLOYEE_LOGIN', 'employee', 'emp-1');
    });

    it('should throw UnauthorizedException for inactive pharmacy', async () => {
      prisma.client.pharmacy.findUnique.mockResolvedValue({
        ...mockPharmacy,
        status: 'INACTIVE',
      });

      await expect(
        service.login({ login: 'pharmacy01', password: 'pass123' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(audit.log).toHaveBeenCalledWith('LOGIN_BLOCKED', 'pharmacy', 'ph-1', undefined, {
        reason: 'inactive',
      });
    });

    it('should throw UnauthorizedException for inactive employee', async () => {
      prisma.client.pharmacy.findUnique.mockResolvedValue(null);
      prisma.client.employee.findUnique.mockResolvedValue({
        ...mockEmployee,
        status: 'SUSPENDED',
      });

      await expect(
        service.login({ login: 'employee01', password: 'pass123' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(audit.log).toHaveBeenCalledWith('LOGIN_BLOCKED', 'employee', 'emp-1', undefined, {
        reason: 'inactive',
      });
    });

    it('should throw on wrong password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);

      await expect(
        service.login({ login: 'pharmacy01', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(audit.log).toHaveBeenCalledWith('LOGIN_FAILED', 'pharmacy', 'ph-1');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.client.pharmacy.findUnique.mockResolvedValue(null);
      prisma.client.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ login: 'unknown', password: 'pass123' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(audit.log).toHaveBeenCalledWith('LOGIN_FAILED', 'employee', undefined, undefined, {
        login: 'unknown',
      });
    });
  });

  // ══════════════════════════════════════════════
  //  REFRESH
  // ══════════════════════════════════════════════

  describe('refresh', () => {
    const refreshToken = 'valid-refresh-token';
    const tokenHash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

    it('should refresh tokens successfully', async () => {
      prisma.client.session.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        expiresAt: futureDate,
      });
      jwt.verify.mockReturnValue(mockPayload);
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(mockTokens);

      const result = await service.refresh({ refreshToken });

      expect(result.accessToken).toBe('mock-access-token');
      expect(prisma.client.session.delete).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
      expect(audit.log).toHaveBeenCalledWith('TOKEN_REFRESH', 'session', 'user-1');
    });

    it('should throw if session not found', async () => {
      prisma.client.session.findUnique.mockResolvedValue(null);

      await expect(service.refresh({ refreshToken })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if session expired', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      prisma.client.session.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        expiresAt: expiredDate,
      });

      await expect(service.refresh({ refreshToken })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if JWT verification fails', async () => {
      prisma.client.session.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        expiresAt: futureDate,
      });
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refresh({ refreshToken })).rejects.toThrow(UnauthorizedException);
    });
  });

  // ══════════════════════════════════════════════
  //  LOGOUT
  // ══════════════════════════════════════════════

  describe('logout', () => {
    it('should delete session by token hash', async () => {
      prisma.client.session.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('some-refresh-token');

      expect(prisma.client.session.deleteMany).toHaveBeenCalledTimes(1);
      expect(audit.log).toHaveBeenCalledWith('LOGOUT', 'session');
    });
  });

  // ══════════════════════════════════════════════
  //  REGISTER EMPLOYEE
  // ══════════════════════════════════════════════

  describe('registerEmployee', () => {
    const dto = {
      login: 'newemployee',
      password: 'securePass123',
      fullName: 'Jane Doe',
      roleId: 'role-1',
    };
    const pharmacyId = 'ph-1';

    it('should register employee successfully', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue(mockTokens);

      prisma.client.employee.findUnique.mockResolvedValue(null);
      prisma.client.role.findUnique.mockResolvedValue({
        id: 'role-1',
        name: 'CASHIER',
        scope: 'PHARMACY',
      });
      prisma.client.employee.create.mockResolvedValue({
        id: 'emp-new',
        login: 'newemployee',
        fullName: 'Jane Doe',
        pharmacyId: 'ph-1',
        role: { name: 'CASHIER' },
        pharmacy: { name: 'Test Pharmacy' },
      });

      const result = await service.registerEmployee(dto, pharmacyId);

      expect(result.user.login).toBe('newemployee');
      expect(result.user.role).toBe('CASHIER');
      expect(bcrypt.hash).toHaveBeenCalledWith('securePass123', 12);
      expect(audit.log).toHaveBeenCalledWith('EMPLOYEE_CREATED', 'employee', 'emp-new', undefined, {
        login: 'newemployee',
        fullName: 'Jane Doe',
        pharmacyId: 'ph-1',
      });
    });

    it('should throw ConflictException if login exists', async () => {
      prisma.client.employee.findUnique.mockResolvedValue({
        id: 'existing',
        login: 'newemployee',
      });

      await expect(service.registerEmployee(dto, pharmacyId)).rejects.toThrow(ConflictException);
    });

    it('should throw if role not found', async () => {
      prisma.client.employee.findUnique.mockResolvedValue(null);
      prisma.client.role.findUnique.mockResolvedValue(null);

      await expect(service.registerEmployee(dto, pharmacyId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if role scope is not PHARMACY', async () => {
      prisma.client.employee.findUnique.mockResolvedValue(null);
      prisma.client.role.findUnique.mockResolvedValue({
        id: 'role-admin',
        name: 'SUPER_ADMIN',
        scope: 'SYSTEM',
      });

      await expect(service.registerEmployee(dto, pharmacyId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
