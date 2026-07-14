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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@server/database");
const audit_helper_1 = require("../audit/audit.helper");
let UsersService = UsersService_1 = class UsersService {
    prisma;
    audit;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(dto) {
        const existing = await this.prisma.client.user.findUnique({
            where: { phone: dto.phone },
        });
        if (existing) {
            throw new common_1.ConflictException('User with this phone already exists');
        }
        const data = {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            language: dto.language || 'uz',
        };
        if (dto.telegramId) {
            data.telegramId = BigInt(dto.telegramId);
        }
        const user = await this.prisma.client.user.create({
            data,
            select: {
                id: true, firstName: true, lastName: true, phone: true,
                telegramId: true, language: true, status: true, createdAt: true,
            },
        });
        this.audit.log('USER_CREATED', 'user', user.id, undefined, { phone: dto.phone });
        return user;
    }
    async findAll(search, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.client.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true, firstName: true, lastName: true, phone: true,
                    telegramId: true, language: true, status: true, createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.client.user.count({ where }),
        ]);
        return { data, total, page, limit };
    }
    async findById(id) {
        const user = await this.prisma.client.user.findUnique({
            where: { id },
            select: {
                id: true, firstName: true, lastName: true, phone: true,
                telegramId: true, language: true, status: true, createdAt: true, updatedAt: true,
                wallet: { select: { balance: true } },
                transactions: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, amount: true, status: true, createdAt: true },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async findByPhone(phone) {
        const user = await this.prisma.client.user.findUnique({
            where: { phone },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async update(id, dto) {
        const user = await this.prisma.client.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const data = { ...dto };
        if (dto.phone) {
            const existing = await this.prisma.client.user.findUnique({
                where: { phone: dto.phone },
            });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException('Phone already in use');
            }
        }
        const updated = await this.prisma.client.user.update({
            where: { id },
            data,
            select: {
                id: true, firstName: true, lastName: true, phone: true,
                telegramId: true, language: true, status: true, updatedAt: true,
            },
        });
        this.audit.log('USER_UPDATED', 'user', id, { ...user }, { ...dto });
        return updated;
    }
    async block(id) {
        const user = await this.prisma.client.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.status === 'BLOCKED')
            throw new common_1.ConflictException('User already blocked');
        const updated = await this.prisma.client.user.update({
            where: { id },
            data: { status: 'BLOCKED' },
            select: {
                id: true, firstName: true, lastName: true, phone: true, status: true,
            },
        });
        this.audit.log('USER_BLOCKED', 'user', id);
        return updated;
    }
    async unblock(id) {
        const user = await this.prisma.client.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.status !== 'BLOCKED')
            throw new common_1.ConflictException('User is not blocked');
        const updated = await this.prisma.client.user.update({
            where: { id },
            data: { status: 'ACTIVE' },
        });
        this.audit.log('USER_UNBLOCKED', 'user', id);
        return updated;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        audit_helper_1.AuditHelper])
], UsersService);
//# sourceMappingURL=users.service.js.map