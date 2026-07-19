"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const database_1 = require("@server/database");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt') {
    prisma;
    constructor(prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'dev-jwt-secret-super-safe-2024',
        });
        this.prisma = prisma;
    }
    async validate(payload) {
        if (payload.scope === 'PHARMACY') {
            if (payload.entityType === 'pharmacy') {
                const pharmacy = await this.prisma.client.pharmacy.findUnique({
                    where: { id: payload.sub },
                    select: { id: true, login: true, status: true },
                });
                if (!pharmacy || pharmacy.status !== 'ACTIVE') {
                    throw new common_1.UnauthorizedException('Pharmacy not found or inactive');
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
                const employee = await this.prisma.client.employee.findUnique({
                    where: { id: payload.sub },
                    select: { id: true, login: true, status: true },
                });
                if (!employee || employee.status !== 'ACTIVE') {
                    throw new common_1.UnauthorizedException('Employee not found or inactive');
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
        throw new common_1.UnauthorizedException('Invalid token payload');
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map