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
exports.ReadersController = void 0;
const common_1 = require("@nestjs/common");
const readers_service_1 = require("./readers.service");
const create_reader_dto_1 = require("./dto/create-reader.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const public_decorator_1 = require("../auth/guards/public.decorator");
const current_user_decorator_1 = require("../auth/guards/current-user.decorator");
let ReadersController = class ReadersController {
    readers;
    constructor(readers) {
        this.readers = readers;
    }
    async create(dto, user) {
        const pharmacyId = user.role === 'SUPER_ADMIN' ? dto.pharmacyId : user.pharmacyId;
        return this.readers.create(dto, pharmacyId);
    }
    async findAll(user, page = '1', limit = '50') {
        const pharmacyId = user.role === 'SUPER_ADMIN' ? undefined : user.pharmacyId;
        return this.readers.findAll(pharmacyId, Number(page), Number(limit));
    }
    async ping(dto) {
        return this.readers.ping(dto);
    }
    async updateStatus(serialNumber, status) {
        return this.readers.updateStatus(serialNumber, status);
    }
};
exports.ReadersController = ReadersController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_reader_dto_1.CreateReaderDto, Object]),
    __metadata("design:returntype", Promise)
], ReadersController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ReadersController.prototype, "findAll", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('ping'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_reader_dto_1.PingReaderDto]),
    __metadata("design:returntype", Promise)
], ReadersController.prototype, "ping", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'PHARMACY_ADMIN'),
    (0, common_1.Patch)(':serialNumber/status'),
    __param(0, (0, common_1.Param)('serialNumber')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReadersController.prototype, "updateStatus", null);
exports.ReadersController = ReadersController = __decorate([
    (0, common_1.Controller)('readers'),
    __metadata("design:paramtypes", [readers_service_1.ReadersService])
], ReadersController);
//# sourceMappingURL=readers.controller.js.map