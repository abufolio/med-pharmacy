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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@server/database");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.client.notification.create({ data: dto });
    }
    async findByUser(userId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = { userId };
        const [data, total] = await Promise.all([
            this.prisma.client.notification.findMany({
                where, skip, take: limit, orderBy: { createdAt: 'desc' },
            }),
            this.prisma.client.notification.count({ where }),
        ]);
        return { data, total, page, limit };
    }
    async markRead(id) {
        await this.prisma.client.notification.update({ where: { id }, data: { isRead: true } });
        return { message: 'Marked as read' };
    }
    async markAllRead(userId) {
        await this.prisma.client.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return { message: 'All notifications marked as read' };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map