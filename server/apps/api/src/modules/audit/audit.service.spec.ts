import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaService } from '@server/database';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;

  beforeEach(async () => {
    const prismaMock = {
      client: {
        auditLog: {
          create: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ══════════════════════════════════════════════
  //  log
  // ══════════════════════════════════════════════

  describe('log', () => {
    it('should create audit log entry with all fields', async () => {
      const entry = {
        actorType: 'employee',
        actorId: 'emp-1',
        action: 'CARD_ASSIGN',
        entity: 'card',
        entityId: 'card-1',
        oldValue: { status: 'INACTIVE' },
        newValue: { status: 'ACTIVE' },
        ipAddress: '192.168.1.1',
      };

      const mockCreated = { id: 'log-1', ...entry };
      prisma.client.auditLog.create.mockResolvedValue(mockCreated);

      await service.log(entry);

      expect(prisma.client.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorType: 'employee',
          actorId: 'emp-1',
          action: 'CARD_ASSIGN',
          entity: 'card',
          entityId: 'card-1',
          oldValue: { status: 'INACTIVE' },
          newValue: { status: 'ACTIVE' },
          ipAddress: '192.168.1.1',
        },
      });
    });

    it('should create audit log entry with minimum required fields', async () => {
      const entry = {
        actorType: 'system',
        action: 'LOGIN',
        entity: 'user',
      };

      prisma.client.auditLog.create.mockResolvedValue({ id: 'log-2', ...entry });

      await service.log(entry);

      expect(prisma.client.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorType: 'system',
          actorId: undefined,
          action: 'LOGIN',
          entity: 'user',
          entityId: undefined,
          oldValue: undefined,
          newValue: undefined,
          ipAddress: undefined,
        },
      });
    });

    it('should serialize oldValue and newValue via JSON.parse(JSON.stringify(...))', async () => {
      const complex = { nested: { arr: [1, 2, 3] }, date: new Date('2026-01-01') };
      const entry = {
        actorType: 'employee',
        action: 'UPDATE',
        entity: 'setting',
        oldValue: complex,
        newValue: { status: 'ok' },
      };

      await service.log(entry);

      const callData = prisma.client.auditLog.create.mock.calls[0][0].data;
      // Should be a plain object, not a Date instance
      expect(callData.oldValue.nested.arr).toEqual([1, 2, 3]);
      expect(typeof callData.oldValue.date).toBe('string');
      expect(callData.newValue).toEqual({ status: 'ok' });
    });

    it('should set oldValue and newValue to undefined when not provided', async () => {
      const entry = {
        actorType: 'user',
        actorId: 'user-1',
        action: 'LOGIN',
        entity: 'user',
        entityId: 'user-1',
      };

      await service.log(entry);

      expect(prisma.client.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorType: 'user',
          actorId: 'user-1',
          action: 'LOGIN',
          entity: 'user',
          entityId: 'user-1',
          oldValue: undefined,
          newValue: undefined,
          ipAddress: undefined,
        },
      });
    });

    it('should not throw when prisma create fails', async () => {
      const entry = {
        actorType: 'employee',
        action: 'CARD_ASSIGN',
        entity: 'card',
      };

      prisma.client.auditLog.create.mockRejectedValue(new Error('DB connection lost'));

      // Must not throw
      await expect(service.log(entry)).resolves.toBeUndefined();
    });

    it('should not throw when prisma create fails with non-Error', async () => {
      const entry = {
        actorType: 'employee',
        action: 'CARD_ASSIGN',
        entity: 'card',
      };

      prisma.client.auditLog.create.mockRejectedValue('String error');

      await expect(service.log(entry)).resolves.toBeUndefined();
    });
  });
});
