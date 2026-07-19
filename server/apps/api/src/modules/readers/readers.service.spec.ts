import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ReadersService } from './readers.service';
import { PrismaService } from '@server/database';

// ── Test Data ──
const mockReader = {
  id: 'reader-1',
  serialNumber: 'SN-001',
  model: 'NFC-200',
  pharmacyId: 'pharmacy-1',
  status: 'OFFLINE',
  lastPingAt: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  deletedAt: null,
};

const mockSecondReader = {
  id: 'reader-2',
  serialNumber: 'SN-002',
  model: 'NFC-300',
  pharmacyId: 'pharmacy-2',
  status: 'ONLINE',
  lastPingAt: new Date('2025-06-01T00:00:00Z'),
  createdAt: new Date('2025-02-01T00:00:00Z'),
  updatedAt: new Date('2025-06-01T00:00:00Z'),
  deletedAt: null,
};

describe('ReadersService', () => {
  let service: ReadersService;
  let prisma: any;

  beforeEach(async () => {
    const prismaMock = {
      client: {
        reader: {
          create: jest.fn(),
          findUnique: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
          count: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ReadersService>(ReadersService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  // ══════════════════════════════════════════════
  // CREATE
  // ══════════════════════════════════════════════
  describe('create', () => {
    it('should create a new reader', async () => {
      prisma.client.reader.findUnique.mockResolvedValue(null);
      prisma.client.reader.create.mockResolvedValue(mockReader);

      const result = await service.create(
        { serialNumber: 'SN-001', model: 'NFC-200' },
        'pharmacy-1',
      );

      expect(result).toEqual(mockReader);
      expect(prisma.client.reader.findUnique).toHaveBeenCalledWith({
        where: { serialNumber: 'SN-001' },
      });
      expect(prisma.client.reader.create).toHaveBeenCalledWith({
        data: {
          serialNumber: 'SN-001',
          model: 'NFC-200',
          pharmacyId: 'pharmacy-1',
        },
      });
    });

    it('should create a reader without optional model', async () => {
      prisma.client.reader.findUnique.mockResolvedValue(null);
      prisma.client.reader.create.mockResolvedValue({
        ...mockReader,
        model: null,
      });

      const result = await service.create(
        { serialNumber: 'SN-001' },
        'pharmacy-1',
      );

      expect(result.model).toBeNull();
      expect(prisma.client.reader.create).toHaveBeenCalledWith({
        data: {
          serialNumber: 'SN-001',
          model: undefined,
          pharmacyId: 'pharmacy-1',
        },
      });
    });

    it('should throw ConflictException if serialNumber already exists', async () => {
      prisma.client.reader.findUnique.mockResolvedValue(mockReader);

      await expect(
        service.create({ serialNumber: 'SN-001' }, 'pharmacy-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ══════════════════════════════════════════════
  // FIND ALL
  // ══════════════════════════════════════════════
  describe('findAll', () => {
    it('should return paginated readers without pharmacy filter', async () => {
      prisma.client.reader.findMany.mockResolvedValue([mockReader, mockSecondReader]);
      prisma.client.reader.count.mockResolvedValue(2);

      const result = await service.findAll(undefined, 1, 50);

      expect(result).toEqual({
        data: [mockReader, mockSecondReader],
        total: 2,
        page: 1,
        limit: 50,
      });
      expect(prisma.client.reader.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.client.reader.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should filter by pharmacyId when provided', async () => {
      prisma.client.reader.findMany.mockResolvedValue([mockReader]);
      prisma.client.reader.count.mockResolvedValue(1);

      const result = await service.findAll('pharmacy-1', 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(prisma.client.reader.findMany).toHaveBeenCalledWith({
        where: { pharmacyId: 'pharmacy-1' },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply pagination correctly', async () => {
      prisma.client.reader.findMany.mockResolvedValue([]);
      prisma.client.reader.count.mockResolvedValue(0);

      const result = await service.findAll(undefined, 2, 20);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(prisma.client.reader.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 20,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ══════════════════════════════════════════════
  // PING
  // ══════════════════════════════════════════════
  describe('ping', () => {
    const pingDto = { serialNumber: 'SN-001' };

    it('should update lastPingAt and set status to ONLINE', async () => {
      prisma.client.reader.findUnique.mockResolvedValue(mockReader);
      const updatedReader = {
        ...mockReader,
        lastPingAt: new Date('2025-07-18T12:00:00Z'),
        status: 'ONLINE',
      };
      prisma.client.reader.update.mockResolvedValue(updatedReader);

      const result = await service.ping(pingDto);

      expect(result.status).toBe('ONLINE');
      expect(result.lastPingAt).toEqual(updatedReader.lastPingAt);
      expect(prisma.client.reader.findUnique).toHaveBeenCalledWith({
        where: { serialNumber: 'SN-001' },
      });
      expect(prisma.client.reader.update).toHaveBeenCalledWith({
        where: { serialNumber: 'SN-001' },
        data: {
          lastPingAt: expect.any(Date),
          status: 'ONLINE',
        },
      });
    });

    it('should throw NotFoundException if reader not found', async () => {
      prisma.client.reader.findUnique.mockResolvedValue(null);

      await expect(service.ping(pingDto)).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════
  // UPDATE STATUS
  // ══════════════════════════════════════════════
  describe('updateStatus', () => {
    it('should update status as SUPER_ADMIN (any pharmacy)', async () => {
      prisma.client.reader.findUnique.mockResolvedValue(mockReader);
      const updated = { ...mockReader, status: 'OFFLINE' };
      prisma.client.reader.update.mockResolvedValue(updated);

      const result = await service.updateStatus(
        'SN-001',
        'OFFLINE',
        'pharmacy-2',
        'SUPER_ADMIN',
      );

      expect(result.status).toBe('OFFLINE');
      expect(prisma.client.reader.update).toHaveBeenCalledWith({
        where: { serialNumber: 'SN-001' },
        data: { status: 'OFFLINE' },
      });
    });

    it('should update own pharmacy reader as PHARMACY_ADMIN', async () => {
      prisma.client.reader.findUnique.mockResolvedValue(mockReader);
      const updated = { ...mockReader, status: 'FAULTY' };
      prisma.client.reader.update.mockResolvedValue(updated);

      const result = await service.updateStatus(
        'SN-001',
        'FAULTY',
        'pharmacy-1',
        'PHARMACY_ADMIN',
      );

      expect(result.status).toBe('FAULTY');
    });

    it('should throw NotFoundException for PHARMACY_ADMIN updating another pharmacy reader', async () => {
      prisma.client.reader.findUnique.mockResolvedValue(mockReader);

      await expect(
        service.updateStatus(
          'SN-001',
          'ONLINE',
          'pharmacy-2',
          'PHARMACY_ADMIN',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if reader does not exist', async () => {
      prisma.client.reader.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('UNKNOWN-SN', 'ONLINE', 'pharmacy-1', 'SUPER_ADMIN'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
