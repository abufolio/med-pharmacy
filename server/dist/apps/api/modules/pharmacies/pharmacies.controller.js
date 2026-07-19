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
exports.PharmaciesController = void 0;
const common_1 = require("@nestjs/common");
const pharmacies_service_1 = require("./pharmacies.service");
const create_pharmacy_dto_1 = require("./dto/create-pharmacy.dto");
const cashback_rule_dto_1 = require("./dto/cashback-rule.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const current_user_decorator_1 = require("../auth/guards/current-user.decorator");
let PharmaciesController = class PharmaciesController {
    pharmacies;
    constructor(pharmacies) {
        this.pharmacies = pharmacies;
    }
    async create(dto) {
        return { success: true, data: await this.pharmacies.create(dto) };
    }
    async findAll(user, status, page = '1', limit = '50') {
        if (user.scope === 'PHARMACY') {
            const result = await this.pharmacies.findById(user.pharmacyId);
            return { success: true, data: result };
        }
        const result = await this.pharmacies.findAll(status, Number(page), Number(limit));
        return { success: true, ...result };
    }
    async findById(id) {
        return { success: true, data: await this.pharmacies.findById(id) };
    }
    async update(id, dto) {
        return { success: true, data: await this.pharmacies.update(id, dto) };
    }
    async updateStatus(id, dto) {
        return { success: true, data: await this.pharmacies.updateStatus(id, dto) };
    }
    async changePassword(id, dto) {
        return { success: true, data: await this.pharmacies.changePassword(id, dto) };
    }
    async createCashbackRule(pharmacyId, dto) {
        return { success: true, data: await this.pharmacies.createCashbackRule(pharmacyId, dto) };
    }
    async getCashbackRules(pharmacyId) {
        return { success: true, data: await this.pharmacies.getCashbackRules(pharmacyId) };
    }
    async updateCashbackRule(ruleId, dto) {
        return { success: true, data: await this.pharmacies.updateCashbackRule(ruleId, dto) };
    }
    async deleteCashbackRule(ruleId) {
        return { success: true, data: await this.pharmacies.deleteCashbackRule(ruleId) };
    }
};
exports.PharmaciesController = PharmaciesController;
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Post)('pharmacies'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pharmacy_dto_1.CreatePharmacyDto]),
    __metadata("design:returntype", Promise)
], PharmaciesController.prototype, "create", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Get)('pharmacies'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], PharmaciesController.prototype, "findAll", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Get)('pharmacies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PharmaciesController.prototype, "findById", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Patch)('pharmacies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_pharmacy_dto_1.UpdatePharmacyDto]),
    __metadata("design:returntype", Promise)
], PharmaciesController.prototype, "update", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Patch)('pharmacies/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_pharmacy_dto_1.UpdatePharmacyStatusDto]),
    __metadata("design:returntype", Promise)
], PharmaciesController.prototype, "updateStatus", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Post)('pharmacies/:id/change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_pharmacy_dto_1.ChangePharmacyPasswordDto]),
    __metadata("design:returntype", Promise)
], PharmaciesController.prototype, "changePassword", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Post)('pharmacies/:id/cashback-rules'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cashback_rule_dto_1.CreateCashbackRuleDto]),
    __metadata("design:returntype", Promise)
], PharmaciesController.prototype, "createCashbackRule", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Get)('pharmacies/:id/cashback-rules'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PharmaciesController.prototype, "getCashbackRules", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Patch)('cashback-rules/:ruleId'),
    __param(0, (0, common_1.Param)('ruleId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cashback_rule_dto_1.UpdateCashbackRuleDto]),
    __metadata("design:returntype", Promise)
], PharmaciesController.prototype, "updateCashbackRule", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Delete)('cashback-rules/:ruleId'),
    __param(0, (0, common_1.Param)('ruleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PharmaciesController.prototype, "deleteCashbackRule", null);
exports.PharmaciesController = PharmaciesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [pharmacies_service_1.PharmaciesService])
], PharmaciesController);
//# sourceMappingURL=pharmacies.controller.js.map