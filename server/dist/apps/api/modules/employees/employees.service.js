"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmployeesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const database_1 = require("@server/database");
const audit_helper_1 = require("../audit/audit.helper");
let EmployeesService = EmployeesService_1 = class EmployeesService {
    prisma;
    audit;
    logger = new common_1.Logger(EmployeesService_1.name);
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(dto, pharmacyId) {
        const existing = await this.prisma.client.employee.findUnique({ where: { login: dto.login } });
        if (existing)
            throw new common_1.ConflictException('Login already taken');
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const employee = await this.prisma.client.employee.create({
            data: { pharmacyId, ...dto, passwordHash },
            select: { id: true, login: true, fullName: true, status: true, role: { select: { name: true } }, createdAt: true },
        });
        this.audit.log('EMPLOYEE_CREATED', 'employee', employee.id);
        return employee;
    }
    async findAll(pharmacyId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.client.employee.findMany({
                where: { pharmacyId },
                skip, take: limit,
                select: { id: true, login: true, fullName: true, status: true, role: { select: { name: true } }, createdAt: true },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.client.employee.count({ where: { pharmacyId } }),
        ]);
        return { data, total, page, limit };
    }
    async findById(id) {
        const emp = await this.prisma.client.employee.findUnique({
            where: { id },
            select: { id: true, login: true, fullName: true, status: true, pharmacyId: true, role: { select: { id: true, name: true, scope: true } }, createdAt: true },
        });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        return emp;
    }
    async update(id, dto) {
        const emp = await this.prisma.client.employee.findUnique({ where: { id } });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        const updated = await this.prisma.client.employee.update({ where: { id }, data: dto });
        this.audit.log('EMPLOYEE_UPDATED', 'employee', id);
        return updated;
    }
    async toggleStatus(id, status) {
        const emp = await this.prisma.client.employee.findUnique({ where: { id } });
        if (!emp)
            throw new common_1.NotFoundException('Employee not found');
        const updated = await this.prisma.client.employee.update({ where: { id }, data: { status } });
        this.audit.log(status === 'SUSPENDED' ? 'EMPLOYEE_SUSPENDED' : 'EMPLOYEE_ACTIVATED', 'employee', id);
        return updated;
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = EmployeesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        audit_helper_1.AuditHelper])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map