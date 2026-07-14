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
var SettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@server/database");
const audit_helper_1 = require("../audit/audit.helper");
let SettingsService = SettingsService_1 = class SettingsService {
    prisma;
    audit;
    logger = new common_1.Logger(SettingsService_1.name);
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(dto) {
        const existing = await this.prisma.client.setting.findUnique({
            where: { key: dto.key },
        });
        if (existing) {
            throw new common_1.ConflictException('Setting with this key already exists');
        }
        const setting = await this.prisma.client.setting.create({
            data: {
                key: dto.key,
                value: dto.value,
                scope: dto.scope,
            },
        });
        this.audit.log('SETTING_CREATED', 'setting', setting.id, undefined, { key: dto.key });
        return setting;
    }
    async findAll(scope, page = 1, limit = 50) {
        const where = {};
        if (scope)
            where.scope = scope;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.client.setting.findMany({
                where,
                skip,
                take: limit,
                orderBy: { key: 'asc' },
            }),
            this.prisma.client.setting.count({ where }),
        ]);
        return { data, total, page, limit };
    }
    async findByKey(key) {
        const setting = await this.prisma.client.setting.findUnique({ where: { key } });
        if (!setting)
            throw new common_1.NotFoundException('Setting not found');
        return setting;
    }
    async update(key, dto) {
        const setting = await this.prisma.client.setting.findUnique({ where: { key } });
        if (!setting)
            throw new common_1.NotFoundException('Setting not found');
        const updated = await this.prisma.client.setting.update({
            where: { key },
            data: {
                value: dto.value,
                ...(dto.scope !== undefined && { scope: dto.scope }),
            },
        });
        this.audit.log('SETTING_UPDATED', 'setting', setting.id, { ...setting }, { ...dto });
        return updated;
    }
    async remove(key) {
        const setting = await this.prisma.client.setting.findUnique({ where: { key } });
        if (!setting)
            throw new common_1.NotFoundException('Setting not found');
        await this.prisma.client.setting.delete({ where: { key } });
        this.audit.log('SETTING_DELETED', 'setting', setting.id);
        return { message: 'Setting deleted' };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        audit_helper_1.AuditHelper])
], SettingsService);
//# sourceMappingURL=settings.service.js.map