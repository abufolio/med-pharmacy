import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

const mockRole = {
  id: 'role-1',
  name: 'CASHIER',
  scope: 'PHARMACY',
};

const mockEmployee = {
  id: 'emp-1',
  login: 'employee01',
  fullName: 'John Doe',
  status: 'ACTIVE' as const,
  pharmacyId: 'ph-1',
  passwordHash: 'hashed-password',
  roleId: 'role-1',
  role: { id: 'role-1', name: 'CASHIER', scope: 'PHARMACY' },
  createdAt: new Date('2026-07-12T12:00:00Z'),
};

const mockReturnedEmployee = {
  id: 'emp-1',
  login: 'employee01',
  fullName: 'John Doe',
  status: 'ACTIVE' as const,
  pharmacyId: 'ph-1',
  role: { id: 'role-1', name: 'CASHIER', scope: 'PHARMACY' },
  createdAt: new Date('2026-07-12T12:00:00Z'),
};

describe('EmployeesService', () => {
  let service: EmployeesService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    const prismaMock = {
      client: {
        employee: {
          create: jest.fn(),
          findUnique: jest.fn(),
          findMany: jest.fn(),
          count: jest.fn(),
          update: jest.fn(),
        },
        auditLog: {
          create: jest.fn(),
        },
      },
    };

    const auditMock = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditHelper, useValue: auditMock },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    prisma = module.get(PrismaService);
    audit = module.get(AuditHelper);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto = {
      login: 'newemployee',
      password: 'securePass123',
      fullName: 'Jane Doe',
      roleId: 'role-1',
    };
    const pharmacyId = 'ph-1';

    it('should create an employee with hashed password and pharmacyId', async () => {
      prisma.client.employee.findUnique.mockResolvedValue(null);
      prisma.client.employee.create.mockResolvedValue(mockReturnedEmployee);

      const result = await service.create(dto, pharmacyId);

      expect(prisma.client.employee.findUnique).toHaveBeenCalledWith({
        where: { login: dto.login },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('securePass123', 12);
      expect(prisma.client.employee.create).toHaveBeenCalledWith({
        data: {
          login: 'newemployee',
          password: 'securePass123',
          fullName: 'Jane Doe',
          roleId: 'role-1',
          pharmacyId: 'ph-1',
          passwordHash: 'hashed-password',
        },
        select: {
          id: true,
          login: true,
          fullName: true,
          status: true,
          role: { select: { name: true } },
          createdAt: true,
        },
      });
      expect(result.login).toBe('employee01');
      expect(audit.log).toHaveBeenCalledWith('EMPLOYEE_CREATED', 'employee', 'emp-1');
    });

    it('should throw ConflictException if login already taken', async () => {
      prisma.client.employee.findUnique.mockResolvedValue(mockEmployee);

      await expect(service.create(dto, pharmacyId)).rejects.toThrow(ConflictException);
      expect(prisma.client.employee.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated employees without pharmacy filter', async () => {
      prisma.client.employee.findMany.mockResolvedValue([mockReturnedEmployee]);
      prisma.client.employee.count.mockResolvedValue(1);

      const result = await service.findAll(undefined, 1, 20);

      expect(prisma.client.employee.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        select: {
          id: true,
          login: true,
          fullName: true,
          status: true,
          role: { select: { name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.client.employee.count).toHaveBeenCalledWith({ where: {} });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should filter by pharmacyId when provided', async () => {
      prisma.client.employee.findMany.mockResolvedValue([mockReturnedEmployee]);
      prisma.client.employee.count.mockResolvedValue(1);

      const result = await service.findAll('ph-1', 1, 50);

      expect(prisma.client.employee.findMany).toHaveBeenCalledWith({
        where: { pharmacyId: 'ph-1' },
        skip: 0,
        take: 50,
        select: {
          id: true,
          login: true,
          fullName: true,
          status: true,
          role: { select: { name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.client.employee.count).toHaveBeenCalledWith({
        where: { pharmacyId: 'ph-1' },
      });
      expect(result.data).toHaveLength(1);
    });

    it('should apply pagination skip correctly', async () => {
      prisma.client.employee.findMany.mockResolvedValue([]);
      prisma.client.employee.count.mockResolvedValue(0);

      const result = await service.findAll(undefined, 3, 10);

      expect(prisma.client.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
    });
  });

  describe('findById', () => {
    it('should return employee with role info', async () => {
      prisma.client.employee.findUnique.mockResolvedValue(mockReturnedEmployee);

      const result = await service.findById('emp-1');

      expect(prisma.client.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        select: {
          id: true,
          login: true,
          fullName: true,
          status: true,
          pharmacyId: true,
          role: { select: { id: true, name: true, scope: true } },
          createdAt: true,
        },
      });
      expect(result.id).toBe('emp-1');
      expect(result.role.name).toBe('CASHIER');
    });

    it('should throw NotFoundException if employee not found', async () => {
      prisma.client.employee.findUnique.mockResolvedValue(null);

      await expect(service.findById('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const dto = { fullName: 'Updated Name' };

    it('should update an existing employee', async () => {
      prisma.client.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.client.employee.update.mockResolvedValue({
        ...mockEmployee,
        fullName: 'Updated Name',
      });

      const result = await service.update('emp-1', dto);

      expect(prisma.client.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
      });
      expect(prisma.client.employee.update).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        data: dto,
      });
      expect(result.fullName).toBe('Updated Name');
      expect(audit.log).toHaveBeenCalledWith('EMPLOYEE_UPDATED', 'employee', 'emp-1');
    });

    it('should throw NotFoundException if employee does not exist', async () => {
      prisma.client.employee.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid', dto)).rejects.toThrow(NotFoundException);
      expect(prisma.client.employee.update).not.toHaveBeenCalled();
    });
  });

  describe('toggleStatus', () => {
    it('should activate a suspended employee', async () => {
      prisma.client.employee.findUnique.mockResolvedValue({
        ...mockEmployee,
        status: 'SUSPENDED',
      });
      prisma.client.employee.update.mockResolvedValue({
        ...mockEmployee,
        status: 'ACTIVE',
      });

      const result = await service.toggleStatus('emp-1', 'ACTIVE');

      expect(prisma.client.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
      });
      expect(prisma.client.employee.update).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        data: { status: 'ACTIVE' },
      });
      expect(result.status).toBe('ACTIVE');
      expect(audit.log).toHaveBeenCalledWith('EMPLOYEE_ACTIVATED', 'employee', 'emp-1');
    });

    it('should suspend an active employee', async () => {
      prisma.client.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.client.employee.update.mockResolvedValue({
        ...mockEmployee,
        status: 'SUSPENDED',
      });

      const result = await service.toggleStatus('emp-1', 'SUSPENDED');

      expect(prisma.client.employee.update).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        data: { status: 'SUSPENDED' },
      });
      expect(result.status).toBe('SUSPENDED');
      expect(audit.log).toHaveBeenCalledWith('EMPLOYEE_SUSPENDED', 'employee', 'emp-1');
    });

    it('should throw NotFoundException if employee does not exist', async () => {
      prisma.client.employee.findUnique.mockResolvedValue(null);

      await expect(service.toggleStatus('invalid', 'ACTIVE')).rejects.toThrow(NotFoundException);
      expect(prisma.client.employee.update).not.toHaveBeenCalled();
    });
  });
});
