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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const reports_dto_1 = require("./dto/reports.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const current_user_decorator_1 = require("../auth/guards/current-user.decorator");
let ReportsController = class ReportsController {
    reports;
    constructor(reports) {
        this.reports = reports;
    }
    async getDailyStats(user, query) {
        const pharmacyId = user.role === 'SUPER_ADMIN'
            ? query.pharmacyId
            : user.pharmacyId;
        if (!pharmacyId)
            return { success: true, data: [], total: 0, page: 1, limit: 31 };
        const result = await this.reports.getDailyStats(pharmacyId, query.from, query.to, Number(query.page || '1'), Number(query.limit || '31'));
        return { success: true, ...result };
    }
    async getPharmacySummary(user, query) {
        const pharmacyId = user.role === 'SUPER_ADMIN'
            ? query.pharmacyId
            : user.pharmacyId;
        if (!pharmacyId)
            return { success: true, message: 'Pharmacy ID is required' };
        return { success: true, data: await this.reports.getPharmacySummary(pharmacyId, query.from, query.to) };
    }
    async getAdminOverview(query) {
        return { success: true, data: await this.reports.getAdminOverview(query.from, query.to) };
    }
    async getTopPharmacies(limit = '10', from, to) {
        return { success: true, data: await this.reports.getTopPharmacies(Number(limit), from, to) };
    }
    async getTransactionReport(user, query) {
        const pharmacyId = user.role === 'SUPER_ADMIN'
            ? query.pharmacyId
            : user.pharmacyId;
        const result = await this.reports.getTransactionReport(pharmacyId, query.from, query.to, Number(query.page || '1'), Number(query.limit || '100'));
        return { success: true, ...result };
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Get)('daily'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, reports_dto_1.ReportsQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getDailyStats", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Get)('summary'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, reports_dto_1.ReportsQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPharmacySummary", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reports_dto_1.ReportsQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getAdminOverview", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Get)('top-pharmacies'),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getTopPharmacies", null);
__decorate([
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Get)('transactions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, reports_dto_1.ReportsQueryDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getTransactionReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map