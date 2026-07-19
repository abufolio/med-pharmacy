import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditHelper,
  ) {}

  async create(dto: CreateEmployeeDto, pharmacyId: string) {
    const existing = await this.prisma.client.employee.findUnique({ where: { login: dto.login } });
    if (existing) throw new ConflictException('Login already taken');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const employee = await this.prisma.client.employee.create({
      data: { ...dto, pharmacyId, passwordHash },
      select: { id: true, login: true, fullName: true, status: true, role: { select: { name: true } }, createdAt: true },
    });
    this.audit.log('EMPLOYEE_CREATED', 'employee', employee.id);
    return employee;
  }

  async findAll(pharmacyId?: string, page = 1, limit = 50) {
    const where = pharmacyId ? { pharmacyId } : {};
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.client.employee.findMany({
        where,
        skip, take: limit,
        select: { id: true, login: true, fullName: true, status: true, role: { select: { name: true } }, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.employee.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const emp = await this.prisma.client.employee.findUnique({
      where: { id },
      select: { id: true, login: true, fullName: true, status: true, pharmacyId: true, role: { select: { id: true, name: true, scope: true } }, createdAt: true },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const emp = await this.prisma.client.employee.findUnique({ where: { id } });
    if (!emp) throw new NotFoundException('Employee not found');
    const updated = await this.prisma.client.employee.update({ where: { id }, data: dto });
    this.audit.log('EMPLOYEE_UPDATED', 'employee', id);
    return updated;
  }

  async toggleStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    const emp = await this.prisma.client.employee.findUnique({ where: { id } });
    if (!emp) throw new NotFoundException('Employee not found');
    const updated = await this.prisma.client.employee.update({ where: { id }, data: { status } });
    this.audit.log(status === 'SUSPENDED' ? 'EMPLOYEE_SUSPENDED' : 'EMPLOYEE_ACTIVATED', 'employee', id);
    return updated;
  }
}
