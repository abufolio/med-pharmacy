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
var ReadersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadersService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@server/database");
let ReadersService = ReadersService_1 = class ReadersService {
    prisma;
    logger = new common_1.Logger(ReadersService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, pharmacyId) {
        const existing = await this.prisma.client.reader.findUnique({
            where: { serialNumber: dto.serialNumber },
        });
        if (existing) {
            throw new common_1.ConflictException('Reader with this serial number already exists');
        }
        return this.prisma.client.reader.create({
            data: {
                serialNumber: dto.serialNumber,
                model: dto.model,
                pharmacyId,
            },
        });
    }
    async findAll(pharmacyId, page = 1, limit = 50) {
        const where = pharmacyId ? { pharmacyId } : {};
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.client.reader.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.client.reader.count({ where }),
        ]);
        return { data, total, page, limit };
    }
    async ping(dto) {
        const reader = await this.prisma.client.reader.findUnique({
            where: { serialNumber: dto.serialNumber },
        });
        if (!reader)
            throw new common_1.NotFoundException('Reader not found');
        const updated = await this.prisma.client.reader.update({
            where: { serialNumber: dto.serialNumber },
            data: {
                lastPingAt: new Date(),
                status: 'ONLINE',
            },
        });
        return updated;
    }
    async updateStatus(serialNumber, status) {
        const reader = await this.prisma.client.reader.findUnique({
            where: { serialNumber },
        });
        if (!reader)
            throw new common_1.NotFoundException('Reader not found');
        return this.prisma.client.reader.update({
            where: { serialNumber },
            data: { status },
        });
    }
};
exports.ReadersService = ReadersService;
exports.ReadersService = ReadersService = ReadersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService])
], ReadersService);
//# sourceMappingURL=readers.service.js.map