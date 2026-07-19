import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';

// ── Test Data ──

const mockSetting = {
  id: 'setting-1',
  key: 'app.name',
  value: { uz: 'Dorixona', ru: 'Apteka' },
  scope: 'GLOBAL',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockSetting2 = {
  id: 'setting-2',
  key: 'app.theme',
  value: { mode: 'light' },
  scope: 'GLOBAL',
  createdAt: new Date('2026-01-02'),
  updatedAt: new Date('2026-01-02'),
};

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    const prismaMock = {
      client: {
        setting: {
          create: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
      },
    };

    const auditMock = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditHelper, useValue: auditMock },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    prisma = module.get(PrismaService);
    audit = module.get(AuditHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ══════════════════════════════════════════════
  //  create
  // ══════════════════════════════════════════════

  describe('create', () => {
    it('should create a setting with all fields', async () => {
      const dto = { key: 'app.name', value: { uz: 'Dorixona', ru: 'Apteka' }, scope: 'GLOBAL' as const };

      prisma.client.setting.findUnique.mockResolvedValue(null);
      prisma.client.setting.create.mockResolvedValue(mockSetting);

      const result = await service.create(dto);

      expect(result).toEqual(mockSetting);
      expect(prisma.client.setting.findUnique).toHaveBeenCalledWith({
        where: { key: 'app.name' },
      });
      expect(prisma.client.setting.create).toHaveBeenCalledWith({
        data: { key: 'app.name', value: { uz: 'Dorixona', ru: 'Apteka' }, scope: 'GLOBAL' },
      });
      expect(audit.log).toHaveBeenCalledWith(
        'SETTING_CREATED', 'setting', 'setting-1', undefined,
        { key: 'app.name' },
      );
    });

    it('should create a setting without scope', async () => {
      const dto = { key: 'app.theme', value: { mode: 'light' } };

      prisma.client.setting.findUnique.mockResolvedValue(null);
      prisma.client.setting.create.mockResolvedValue(mockSetting2);

      const result = await service.create(dto as any);

      expect(result).toEqual(mockSetting2);
      expect(prisma.client.setting.create).toHaveBeenCalledWith({
        data: { key: 'app.theme', value: { mode: 'light' }, scope: undefined },
      });
    });

    it('should throw ConflictException if key already exists', async () => {
      const dto = { key: 'app.name', value: { uz: 'Dorixona' } };

      prisma.client.setting.findUnique.mockResolvedValue(mockSetting);

      await expect(service.create(dto as any)).rejects.toThrow(ConflictException);
      expect(prisma.client.setting.create).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════
  //  findAll
  // ══════════════════════════════════════════════

  describe('findAll', () => {
    it('should return paginated settings without scope filter', async () => {
      const data = [mockSetting, mockSetting2];
      prisma.client.setting.findMany.mockResolvedValue(data);
      prisma.client.setting.count.mockResolvedValue(2);

      const result = await service.findAll(undefined, 1, 50);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(prisma.client.setting.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 50,
        orderBy: { key: 'asc' },
      });
    });

    it('should filter by scope', async () => {
      prisma.client.setting.findMany.mockResolvedValue([mockSetting]);
      prisma.client.setting.count.mockResolvedValue(1);

      const result = await service.findAll('GLOBAL', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(prisma.client.setting.findMany).toHaveBeenCalledWith({
        where: { scope: 'GLOBAL' },
        skip: 0,
        take: 20,
        orderBy: { key: 'asc' },
      });
    });

    it('should respect page and limit parameters', async () => {
      prisma.client.setting.findMany.mockResolvedValue([]);
      prisma.client.setting.count.mockResolvedValue(0);

      await service.findAll(undefined, 3, 10);

      expect(prisma.client.setting.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 20,
        take: 10,
        orderBy: { key: 'asc' },
      });
    });

    it('should use default pagination when not provided', async () => {
      prisma.client.setting.findMany.mockResolvedValue([]);
      prisma.client.setting.count.mockResolvedValue(0);

      await service.findAll();

      expect(prisma.client.setting.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 50,
        orderBy: { key: 'asc' },
      });
    });
  });

  // ══════════════════════════════════════════════
  //  findByKey
  // ══════════════════════════════════════════════

  describe('findByKey', () => {
    it('should find a setting by key', async () => {
      prisma.client.setting.findUnique.mockResolvedValue(mockSetting);

      const result = await service.findByKey('app.name');

      expect(result).toEqual(mockSetting);
      expect(prisma.client.setting.findUnique).toHaveBeenCalledWith({
        where: { key: 'app.name' },
      });
    });

    it('should throw NotFoundException if key does not exist', async () => {
      prisma.client.setting.findUnique.mockResolvedValue(null);

      await expect(service.findByKey('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════
  //  update
  // ══════════════════════════════════════════════

  describe('update', () => {
    const updateDto = { value: { uz: 'Dorixona Yangi', ru: 'Novaya Apteka' }, scope: 'GLOBAL' as const };

    it('should update a setting value and scope', async () => {
      prisma.client.setting.findUnique.mockResolvedValue(mockSetting);
      const updated = { ...mockSetting, ...updateDto, updatedAt: new Date() };
      prisma.client.setting.update.mockResolvedValue(updated);

      const result = await service.update('app.name', updateDto);

      expect(result).toEqual(updated);
      expect(prisma.client.setting.update).toHaveBeenCalledWith({
        where: { key: 'app.name' },
        data: { value: updateDto.value, scope: 'GLOBAL' },
      });
      expect(audit.log).toHaveBeenCalledWith(
        'SETTING_UPDATED', 'setting', 'setting-1',
        { ...mockSetting },
        { ...updateDto },
      );
    });

    it('should update only value without scope', async () => {
      const dto = { value: { mode: 'dark' } };
      const updated = { ...mockSetting, value: { mode: 'dark' }, updatedAt: new Date() };

      prisma.client.setting.findUnique.mockResolvedValue(mockSetting);
      prisma.client.setting.update.mockResolvedValue(updated);

      const result = await service.update('app.name', dto);

      expect(result).toEqual(updated);
      expect(prisma.client.setting.update).toHaveBeenCalledWith({
        where: { key: 'app.name' },
        data: { value: dto.value },
      });
    });

    it('should throw NotFoundException if setting not found', async () => {
      prisma.client.setting.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(NotFoundException);
      expect(prisma.client.setting.update).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════
  //  remove
  // ══════════════════════════════════════════════

  describe('remove', () => {
    it('should delete a setting and audit', async () => {
      prisma.client.setting.findUnique.mockResolvedValue(mockSetting);
      prisma.client.setting.delete.mockResolvedValue(mockSetting);

      const result = await service.remove('app.name');

      expect(result).toEqual({ message: 'Setting deleted' });
      expect(prisma.client.setting.findUnique).toHaveBeenCalledWith({
        where: { key: 'app.name' },
      });
      expect(prisma.client.setting.delete).toHaveBeenCalledWith({
        where: { key: 'app.name' },
      });
      expect(audit.log).toHaveBeenCalledWith('SETTING_DELETED', 'setting', 'setting-1');
    });

    it('should throw NotFoundException if setting not found', async () => {
      prisma.client.setting.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
      expect(prisma.client.setting.delete).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });
  });
});
