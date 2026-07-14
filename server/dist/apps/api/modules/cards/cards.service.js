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
var CardsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@server/database");
const audit_helper_1 = require("../audit/audit.helper");
let CardsService = CardsService_1 = class CardsService {
    prisma;
    audit;
    logger = new common_1.Logger(CardsService_1.name);
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(dto) {
        const existing = await this.prisma.client.card.findUnique({
            where: { uid: dto.uid },
        });
        if (existing) {
            throw new common_1.ConflictException('Card with this UID already exists');
        }
        const card = await this.prisma.client.card.create({
            data: { uid: dto.uid },
        });
        this.audit.log('CARD_CREATED', 'card', card.id, undefined, { uid: dto.uid });
        return card;
    }
    async findAll(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.client.card.findMany({
                skip,
                take: limit,
                include: {
                    assignments: {
                        where: { status: 'ACTIVE' },
                        select: {
                            user: { select: { id: true, firstName: true, lastName: true, phone: true } },
                        },
                    },
                },
                orderBy: { issuedAt: 'desc' },
            }),
            this.prisma.client.card.count(),
        ]);
        return { data, total, page, limit };
    }
    async findByUid(uid) {
        const card = await this.prisma.client.card.findUnique({
            where: { uid },
            include: {
                assignments: {
                    where: { status: 'ACTIVE' },
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, phone: true } },
                    },
                },
            },
        });
        if (!card)
            throw new common_1.NotFoundException('Card not found');
        return card;
    }
    async updateStatus(uid, status) {
        const card = await this.prisma.client.card.findUnique({ where: { uid } });
        if (!card)
            throw new common_1.NotFoundException('Card not found');
        const updated = await this.prisma.client.card.update({
            where: { uid },
            data: { status },
        });
        this.audit.log(`CARD_${status}`, 'card', card.id, { status: card.status }, { status });
        return updated;
    }
    async assignCard(dto) {
        const card = await this.prisma.client.card.findUnique({
            where: { uid: dto.cardUid },
        });
        if (!card)
            throw new common_1.NotFoundException('Card not found');
        if (card.status === 'BLOCKED')
            throw new common_1.BadRequestException('Card is blocked');
        if (card.status === 'REPLACED')
            throw new common_1.BadRequestException('Card is replaced');
        const user = await this.prisma.client.user.findUnique({
            where: { id: dto.userId },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.status === 'BLOCKED')
            throw new common_1.BadRequestException('User is blocked');
        const activeAssignment = await this.prisma.client.cardAssignment.findFirst({
            where: { cardId: card.id, status: 'ACTIVE' },
        });
        if (activeAssignment) {
            throw new common_1.ConflictException('Card already has an active assignment');
        }
        const result = await this.prisma.client.$transaction(async (tx) => {
            const assignment = await tx.cardAssignment.create({
                data: { cardId: card.id, userId: user.id },
            });
            await tx.card.update({
                where: { id: card.id },
                data: { status: 'ACTIVE' },
            });
            if (user.status === 'PENDING_CARD') {
                await tx.user.update({
                    where: { id: user.id },
                    data: { status: 'ACTIVE' },
                });
            }
            return assignment;
        });
        this.audit.log('CARD_ASSIGNED', 'card', card.id, undefined, {
            userId: user.id, cardUid: dto.cardUid,
        });
        return result;
    }
    async unassignCard(dto) {
        const card = await this.prisma.client.card.findUnique({
            where: { uid: dto.cardUid },
        });
        if (!card)
            throw new common_1.NotFoundException('Card not found');
        const activeAssignment = await this.prisma.client.cardAssignment.findFirst({
            where: { cardId: card.id, status: 'ACTIVE' },
        });
        if (!activeAssignment) {
            throw new common_1.BadRequestException('Card has no active assignment');
        }
        await this.prisma.client.$transaction(async (tx) => {
            await tx.cardAssignment.update({
                where: { id: activeAssignment.id },
                data: { status: 'UNASSIGNED', unassignedAt: new Date() },
            });
            await tx.card.update({
                where: { id: card.id },
                data: { status: 'UNASSIGNED' },
            });
        });
        this.audit.log('CARD_UNASSIGNED', 'card', card.id, undefined, {
            userId: activeAssignment.userId,
        });
        return { message: 'Card unassigned successfully' };
    }
    async scan(dto) {
        if (dto.idempotencyKey) {
            const cached = await this.prisma.client.idempotencyKey.findUnique({
                where: { key: dto.idempotencyKey },
            });
            if (cached && cached.expiresAt > new Date()) {
                return cached.response;
            }
        }
        const card = await this.prisma.client.card.findUnique({
            where: { uid: dto.cardUid },
        });
        if (!card)
            throw new common_1.NotFoundException('Card not found');
        if (card.status !== 'ACTIVE')
            throw new common_1.BadRequestException('Card is not active');
        const assignment = await this.prisma.client.cardAssignment.findFirst({
            where: { cardId: card.id, status: 'ACTIVE' },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, phone: true },
                },
            },
        });
        if (!assignment) {
            throw new common_1.BadRequestException('Card is not assigned to any user');
        }
        const response = {
            success: true,
            user: {
                id: assignment.user.id,
                firstName: assignment.user.firstName,
                lastName: assignment.user.lastName,
                phone: assignment.user.phone,
                balance: 0,
            },
            card: {
                uid: card.uid,
                status: card.status,
            },
        };
        if (dto.idempotencyKey) {
            await this.prisma.client.idempotencyKey
                .create({
                data: {
                    key: dto.idempotencyKey,
                    response: response,
                    expiresAt: new Date(Date.now() + 5000),
                },
            })
                .catch(() => this.logger.warn('Idempotency cache write failed'));
        }
        this.audit.log('NFC_SCAN', 'card', card.id, undefined, {
            pharmacyId: dto.pharmacyId,
            userId: assignment.user.id,
        });
        return response;
    }
};
exports.CardsService = CardsService;
exports.CardsService = CardsService = CardsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        audit_helper_1.AuditHelper])
], CardsService);
//# sourceMappingURL=cards.service.js.map