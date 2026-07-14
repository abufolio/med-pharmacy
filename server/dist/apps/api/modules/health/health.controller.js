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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const public_decorator_1 = require("../auth/guards/public.decorator");
const database_1 = require("@server/database");
const cache_1 = require("@server/cache");
let HealthController = class HealthController {
    health;
    memory;
    disk;
    prisma;
    cache;
    constructor(health, memory, disk, prisma, cache) {
        this.health = health;
        this.memory = memory;
        this.disk = disk;
        this.prisma = prisma;
        this.cache = cache;
    }
    live() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
    ready() {
        return this.health.check([
            async () => {
                await this.prisma.client.$queryRaw `SELECT 1`;
                return { database: { status: 'up' } };
            },
            async () => {
                const ping = await this.cache.ping();
                return { redis: { status: ping === 'PONG' ? 'up' : 'down' } };
            },
            () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
            () => this.disk.checkStorage('disk', {
                thresholdPercent: 0.8,
                path: '/',
            }),
        ]);
    }
    check() {
        return this.health.check([
            async () => {
                await this.prisma.client.$queryRaw `SELECT 1`;
                return { database: { status: 'up' } };
            },
            async () => {
                const ping = await this.cache.ping();
                return { redis: { status: ping === 'PONG' ? 'up' : 'down' } };
            },
            () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
            () => this.disk.checkStorage('disk', {
                thresholdPercent: 0.8,
                path: '/',
            }),
        ]);
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)('live'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "live", null);
__decorate([
    (0, common_1.Get)('ready'),
    (0, public_decorator_1.Public)(),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "ready", null);
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.MemoryHealthIndicator,
        terminus_1.DiskHealthIndicator,
        database_1.PrismaService,
        cache_1.CacheService])
], HealthController);
//# sourceMappingURL=health.controller.js.map