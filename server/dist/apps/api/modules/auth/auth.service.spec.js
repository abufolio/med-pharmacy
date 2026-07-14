"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const auth_service_1 = require("./auth.service");
const database_1 = require("@server/database");
const audit_helper_1 = require("../audit/audit.helper");
const mockDate = new Date('2026-07-12T12:00:00Z');
const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const mockPharmacy = {
    id: 'ph-1',
    login: 'pharmacy01',
    passwordHash: '$2a$12$hashed',
    status: 'ACTIVE',
    name: 'Test Pharmacy',
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
    scope: 'PHARMACY',
    pharmacyId: 'ph-1',
    type: 'access',
};
const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 900,
};
describe('AuthService', () => {
    let service;
    let prisma;
    let jwt;
    let audit;
    beforeAll(async () => {
        jest.useFakeTimers({ now: mockDate });
    });
    afterAll(() => {
        jest.useRealTimers();
    });
    beforeEach(async () => {
        const prismaMock = {
            client: {
                pharmacy: {
                    findUnique: jest.fn(),
                },
                employee: {
                    findUnique: jest.fn(),
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: database_1.PrismaService, useValue: prismaMock },
                { provide: jwt_1.JwtService, useValue: jwtMock },
                { provide: audit_helper_1.AuditHelper, useValue: auditMock },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        prisma = module.get(database_1.PrismaService);
        jwt = module.get(jwt_1.JwtService);
        audit = module.get(audit_helper_1.AuditHelper);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('login', () => {
        it('should login pharmacy successfully', async () => {
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            jest.spyOn(service, 'generateTokens').mockResolvedValue(mockTokens);
            prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);
            const result = await service.login({ login: 'pharmacy01', password: 'pass123' });
            expect(result.user.role).toBe('PHARMACY_ADMIN');
            expect(result.user.pharmacyName).toBe('Test Pharmacy');
            expect(result.tokens.accessToken).toBe('mock-access-token');
            expect(audit.log).toHaveBeenCalledWith('PHARMACY_LOGIN', 'pharmacy', 'ph-1');
        });
        it('should login employee successfully', async () => {
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            jest.spyOn(service, 'generateTokens').mockResolvedValue(mockTokens);
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
            await expect(service.login({ login: 'pharmacy01', password: 'pass123' })).rejects.toThrow(common_1.UnauthorizedException);
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
            await expect(service.login({ login: 'employee01', password: 'pass123' })).rejects.toThrow(common_1.UnauthorizedException);
            expect(audit.log).toHaveBeenCalledWith('LOGIN_BLOCKED', 'employee', 'emp-1', undefined, {
                reason: 'inactive',
            });
        });
        it('should throw on wrong password', async () => {
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
            prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);
            await expect(service.login({ login: 'pharmacy01', password: 'wrongpass' })).rejects.toThrow(common_1.UnauthorizedException);
            expect(audit.log).toHaveBeenCalledWith('LOGIN_FAILED', 'pharmacy', 'ph-1');
        });
        it('should throw UnauthorizedException for non-existent user', async () => {
            prisma.client.pharmacy.findUnique.mockResolvedValue(null);
            prisma.client.employee.findUnique.mockResolvedValue(null);
            await expect(service.login({ login: 'unknown', password: 'pass123' })).rejects.toThrow(common_1.UnauthorizedException);
            expect(audit.log).toHaveBeenCalledWith('LOGIN_FAILED', 'employee', undefined, undefined, {
                login: 'unknown',
            });
        });
    });
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
            jest.spyOn(service, 'generateTokens').mockResolvedValue(mockTokens);
            const result = await service.refresh({ refreshToken });
            expect(result.accessToken).toBe('mock-access-token');
            expect(prisma.client.session.delete).toHaveBeenCalledWith({
                where: { id: 'session-1' },
            });
            expect(audit.log).toHaveBeenCalledWith('TOKEN_REFRESH', 'session', 'user-1');
        });
        it('should throw if session not found', async () => {
            prisma.client.session.findUnique.mockResolvedValue(null);
            await expect(service.refresh({ refreshToken })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should throw if session expired', async () => {
            const expiredDate = new Date(Date.now() - 1000);
            prisma.client.session.findUnique.mockResolvedValue({
                id: 'session-1',
                userId: 'user-1',
                expiresAt: expiredDate,
            });
            await expect(service.refresh({ refreshToken })).rejects.toThrow(common_1.UnauthorizedException);
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
            await expect(service.refresh({ refreshToken })).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
    describe('logout', () => {
        it('should delete session by token hash', async () => {
            prisma.client.session.deleteMany.mockResolvedValue({ count: 1 });
            await service.logout('some-refresh-token');
            expect(prisma.client.session.deleteMany).toHaveBeenCalledTimes(1);
            expect(audit.log).toHaveBeenCalledWith('LOGOUT', 'session');
        });
    });
    describe('registerEmployee', () => {
        const dto = {
            login: 'newemployee',
            password: 'securePass123',
            fullName: 'Jane Doe',
            roleId: 'role-1',
        };
        const pharmacyId = 'ph-1';
        it('should register employee successfully', async () => {
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password');
            jest.spyOn(service, 'generateTokens').mockResolvedValue(mockTokens);
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
            await expect(service.registerEmployee(dto, pharmacyId)).rejects.toThrow(common_1.ConflictException);
        });
        it('should throw if role not found', async () => {
            prisma.client.employee.findUnique.mockResolvedValue(null);
            prisma.client.role.findUnique.mockResolvedValue(null);
            await expect(service.registerEmployee(dto, pharmacyId)).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should throw if role scope is not PHARMACY', async () => {
            prisma.client.employee.findUnique.mockResolvedValue(null);
            prisma.client.role.findUnique.mockResolvedValue({
                id: 'role-admin',
                name: 'SUPER_ADMIN',
                scope: 'SYSTEM',
            });
            await expect(service.registerEmployee(dto, pharmacyId)).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map