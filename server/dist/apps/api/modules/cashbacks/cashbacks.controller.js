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
exports.CashbacksController = void 0;
const common_1 = require("@nestjs/common");
const cashbacks_service_1 = require("./cashbacks.service");
const cashback_rule_dto_1 = require("./dto/cashback-rule.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const current_user_decorator_1 = require("../auth/guards/current-user.decorator");
let CashbacksController = class CashbacksController {
    cashbacks;
    constructor(cashbacks) {
        this.cashbacks = cashbacks;
    }
    async createRule(dto, user) {
        const pharmacyId = user.role === 'SUPER_ADMIN'
            ? dto.pharmacyId
            : user.pharmacyId;
        return { success: true, data: await this.cashbacks.createRule(dto, pharmacyId) };
    }
    async findAllRules(user, page = '1', limit = '50') {
        const pharmacyId = user.role === 'SUPER_ADMIN' ? undefined : user.pharmacyId;
        const result = await this.cashbacks.findAllRules(pharmacyId, Number(page), Number(limit));
        return { success: true, ...result };
    }
    async findRuleById(id) {
        return { success: true, data: await this.cashbacks.findRuleById(id) };
    }
    async updateRule(id, dto) {
        return { success: true, data: await this.cashbacks.updateRule(id, dto) };
    }
    async removeRule(id) {
        return { success: true, data: await this.cashbacks.removeRule(id) };
    }
    async findUserCashbacks(userId, page = '1', limit = '50') {
        const result = await this.cashbacks.findUserCashbacks(userId, Number(page), Number(limit));
        return { success: true, ...result };
    }
};
exports.CashbacksController = CashbacksController;
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Post)('rules'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cashback_rule_dto_1.CreateCashbackRuleDto, Object]),
    __metadata("design:returntype", Promise)
], CashbacksController.prototype, "createRule", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE'),
    (0, common_1.Get)('rules'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CashbacksController.prototype, "findAllRules", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE'),
    (0, common_1.Get)('rules/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CashbacksController.prototype, "findRuleById", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Patch)('rules/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cashback_rule_dto_1.UpdateCashbackRuleDto]),
    __metadata("design:returntype", Promise)
], CashbacksController.prototype, "updateRule", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Delete)('rules/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CashbacksController.prototype, "removeRule", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE'),
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CashbacksController.prototype, "findUserCashbacks", null);
exports.CashbacksController = CashbacksController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('cashbacks'),
    __metadata("design:paramtypes", [cashbacks_service_1.CashbacksService])
], CashbacksController);
//# sourceMappingURL=cashbacks.controller.js.map