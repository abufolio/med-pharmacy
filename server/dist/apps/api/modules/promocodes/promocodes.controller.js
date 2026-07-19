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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromocodesController = void 0;
const common_1 = require("@nestjs/common");
const promocodes_service_1 = require("./promocodes.service");
const promocodes_dto_1 = require("./dto/promocodes.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const current_user_decorator_1 = require("../auth/guards/current-user.decorator");
let PromocodesController = class PromocodesController {
    promocodes;
    constructor(promocodes) {
        this.promocodes = promocodes;
    }
    async create(dto) {
        return { success: true, data: await this.promocodes.create(dto) };
    }
    async findAll(page = '1', limit = '50') {
        const result = await this.promocodes.findAll(Number(page), Number(limit));
        return { success: true, ...result };
    }
    async findByCode(code) {
        return { success: true, data: await this.promocodes.findByCode(code) };
    }
    async findById(id) {
        return { success: true, data: await this.promocodes.findById(id) };
    }
    async update(id, dto) {
        return { success: true, data: await this.promocodes.update(id, dto) };
    }
    async remove(id) {
        return { success: true, data: await this.promocodes.remove(id) };
    }
    async redeem(dto, user) {
        return { success: true, data: await this.promocodes.redeem(user.id, dto) };
    }
    async getUserRedemptions(userId, page = '1', limit = '50') {
        const result = await this.promocodes.getUserRedemptions(userId, Number(page), Number(limit));
        return { success: true, ...result };
    }
};
exports.PromocodesController = PromocodesController;
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [promocodes_dto_1.CreatePromoCodeDto]),
    __metadata("design:returntype", Promise)
], PromocodesController.prototype, "create", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PromocodesController.prototype, "findAll", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Get)('code/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromocodesController.prototype, "findByCode", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromocodesController.prototype, "findById", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, promocodes_dto_1.UpdatePromoCodeDto]),
    __metadata("design:returntype", Promise)
], PromocodesController.prototype, "update", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromocodesController.prototype, "remove", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE'),
    (0, common_1.Post)('redeem'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [promocodes_dto_1.RedeemPromoCodeDto, Object]),
    __metadata("design:returntype", Promise)
], PromocodesController.prototype, "redeem", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE'),
    (0, common_1.Get)('redemptions/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PromocodesController.prototype, "getUserRedemptions", null);
exports.PromocodesController = PromocodesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('promocodes'),
    __metadata("design:paramtypes", [promocodes_service_1.PromocodesService])
], PromocodesController);
//# sourceMappingURL=promocodes.controller.js.map