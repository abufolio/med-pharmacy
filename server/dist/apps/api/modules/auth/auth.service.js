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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const database_1 = require("@server/database");
const crypto = __importStar(require("crypto"));
const audit_helper_1 = require("../audit/audit.helper");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwt;
    audit;
    logger = new common_1.Logger(AuthService_1.name);
    ACCESS_EXPIRES = '15m';
    REFRESH_EXPIRES = '30d';
    REFRESH_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000;
    constructor(prisma, jwt, audit) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.audit = audit;
    }
    async login(dto) {
        const { login, password } = dto;
        const pharmacy = await this.prisma.client.pharmacy.findUnique({
            where: { login },
            select: { id: true, login: true, passwordHash: true, status: true, name: true },
        });
        if (pharmacy) {
            return this.handlePharmacyLogin(pharmacy, password);
        }
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
        throw new common_1.UnauthorizedException('Invalid login or password');
    }
    async refresh(dto) {
        const { refreshToken } = dto;
        const hash = this.hashToken(refreshToken);
        const session = await this.prisma.client.session.findUnique({
            where: { refreshTokenHash: hash },
            select: { id: true, userId: true, expiresAt: true },
        });
        if (!session || session.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        let payload;
        try {
            payload = this.jwt.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        await this.prisma.client.session.delete({
            where: { id: session.id },
        });
        const tokens = await this.generateTokens(payload);
        this.audit.log('TOKEN_REFRESH', 'session', session.userId);
        return tokens;
    }
    async logout(refreshToken) {
        const hash = this.hashToken(refreshToken);
        await this.prisma.client.session.deleteMany({
            where: { refreshTokenHash: hash },
        });
        this.audit.log('LOGOUT', 'session');
    }
    async registerEmployee(dto, pharmacyId) {
        const { login, password, fullName, roleId } = dto;
        const existing = await this.prisma.client.employee.findUnique({
            where: { login },
        });
        if (existing) {
            throw new common_1.ConflictException('Login already taken');
        }
        const role = await this.prisma.client.role.findUnique({
            where: { id: roleId },
        });
        if (!role || role.scope !== 'PHARMACY') {
            throw new common_1.UnauthorizedException('Invalid role');
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
            entityType: 'employee',
            pharmacyId: employee.pharmacyId,
            type: 'access',
        });
        this.audit.log('EMPLOYEE_CREATED', 'employee', employee.id, undefined, { login, fullName, pharmacyId });
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
    async handlePharmacyLogin(pharmacy, password) {
        if (pharmacy.status !== 'ACTIVE') {
            this.audit.log('LOGIN_BLOCKED', 'pharmacy', pharmacy.id, undefined, { reason: 'inactive' });
            throw new common_1.UnauthorizedException('Pharmacy account is not active');
        }
        const valid = await bcrypt.compare(password, pharmacy.passwordHash);
        if (!valid) {
            this.audit.log('LOGIN_FAILED', 'pharmacy', pharmacy.id);
            throw new common_1.UnauthorizedException('Invalid login or password');
        }
        const tokens = await this.generateTokens({
            sub: pharmacy.id,
            role: 'PHARMACY_ADMIN',
            scope: 'PHARMACY',
            entityType: 'pharmacy',
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
    async handleEmployeeLogin(employee, password) {
        if (employee.status !== 'ACTIVE') {
            this.audit.log('LOGIN_BLOCKED', 'employee', employee.id, undefined, { reason: 'inactive' });
            throw new common_1.UnauthorizedException('Employee account is not active');
        }
        const valid = await bcrypt.compare(password, employee.passwordHash);
        if (!valid) {
            this.audit.log('LOGIN_FAILED', 'employee', employee.id);
            throw new common_1.UnauthorizedException('Invalid login or password');
        }
        const tokens = await this.generateTokens({
            sub: employee.id,
            role: employee.role.name,
            scope: employee.role.scope,
            entityType: 'employee',
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
    async generateTokens(payload) {
        const accessToken = this.jwt.sign({ sub: payload.sub, role: payload.role, scope: payload.scope, entityType: payload.entityType, pharmacyId: payload.pharmacyId, type: 'access' }, { secret: process.env.JWT_SECRET, expiresIn: this.ACCESS_EXPIRES });
        const refreshToken = this.jwt.sign({ sub: payload.sub, role: payload.role, scope: payload.scope, entityType: payload.entityType, pharmacyId: payload.pharmacyId, type: 'refresh' }, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: this.REFRESH_EXPIRES });
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
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        jwt_1.JwtService,
        audit_helper_1.AuditHelper])
], AuthService);
//# sourceMappingURL=auth.service.js.map