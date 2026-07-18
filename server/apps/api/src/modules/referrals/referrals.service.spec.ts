import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';

// ── Test data ──
const mockUser = {
  id: 'user-1',
  firstName: 'Ali',
  lastName: 'Valiyev',
  phone: '+998901234567',
  status: 'ACTIVE',
};

const mockReferral = {
  id: 'ref-1',
  referrerId: 'user-1',
  referredId: 'user-2',
  status: 'PENDING',
  bonusAmount: null,
  createdAt: new Date('2026-06-01T12:00:00Z'),
  updatedAt: new Date('2026-06-01T12:00:00Z'),
};

const mockReferrerInfo = { id: 'user-1', firstName: 'Ali', lastName: 'Valiyev', phone: '+998901234567' };
const mockReferredInfo = { id: 'user-2', firstName: 'Bobur', lastName: 'Karimov', phone: '+998901234568', status: 'ACTIVE' };
const mockReferredInfoBasic = { id: 'user-2', firstName: 'Bobur', lastName: 'Karimov', phone: '+998901234568' };

const createDto = { referredId: 'user-2' };

describe('ReferralsService', () => {
  let service: ReferralsService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    const prismaMock = {
      client: {
        user: {
          findUnique: jest.fn(),
        },
        referral: {
          findUnique: jest.fn(),
          findMany: jest.fn(),
          count: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          aggregate: jest.fn(),
        },
      },
    };

    const auditMock = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditHelper, useValue: auditMock },
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
    prisma = module.get(PrismaService);
    audit = module.get(AuditHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ══════════════════════════════════════════════
  //  CREATE
  // ══════════════════════════════════════════════

  describe('create', () => {
    it('should throw ConflictException for self-referral', async () => {
      await expect(service.create('user-1', { referredId: 'user-1' })).rejects.toThrow(ConflictException);

      expect(prisma.client.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.client.referral.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if referred user does not exist', async () => {
      prisma.client.user.findUnique.mockResolvedValue(null);

      await expect(service.create('user-1', createDto)).rejects.toThrow(NotFoundException);

      expect(prisma.client.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-2' } });
      expect(prisma.client.referral.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if referral already exists for the referred user', async () => {
      prisma.client.user.findUnique.mockResolvedValue(mockUser);
      prisma.client.referral.findUnique.mockResolvedValue(mockReferral);

      await expect(service.create('user-1', createDto)).rejects.toThrow(ConflictException);

      expect(prisma.client.referral.findUnique).toHaveBeenCalledWith({ where: { referredId: 'user-2' } });
      expect(prisma.client.referral.create).not.toHaveBeenCalled();
    });

    it('should create a referral successfully', async () => {
      const createdReferral = {
        ...mockReferral,
        referrer: mockReferrerInfo,
        referred: mockReferredInfoBasic,
      };

      prisma.client.user.findUnique.mockResolvedValue(mockUser);
      prisma.client.referral.findUnique.mockResolvedValue(null);
      prisma.client.referral.create.mockResolvedValue(createdReferral);

      const result = await service.create('user-1', createDto);

      expect(result).toEqual(createdReferral);
      expect(prisma.client.referral.create).toHaveBeenCalledWith({
        data: {
          referrerId: 'user-1',
          referredId: 'user-2',
        },
        include: {
          referrer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          referred: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      });
      expect(audit.log).toHaveBeenCalledWith('REFERRAL_CREATED', 'referral', 'ref-1', undefined, {
        referrerId: 'user-1',
        referredId: 'user-2',
      });
    });
  });

  // ══════════════════════════════════════════════
  //  FIND BY REFERRER
  // ══════════════════════════════════════════════

  describe('findByReferrer', () => {
    it('should return paginated referrals by referrer', async () => {
      const mockData = [
        {
          ...mockReferral,
          referred: mockReferredInfo,
        },
      ];

      prisma.client.referral.findMany.mockResolvedValue(mockData);
      prisma.client.referral.count.mockResolvedValue(1);

      const result = await service.findByReferrer('user-1', 1, 20);

      expect(result).toEqual({ data: mockData, total: 1, page: 1, limit: 20 });
      expect(prisma.client.referral.findMany).toHaveBeenCalledWith({
        where: { referrerId: 'user-1' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          referred: { select: { id: true, firstName: true, lastName: true, phone: true, status: true } },
        },
      });
      expect(prisma.client.referral.count).toHaveBeenCalledWith({ where: { referrerId: 'user-1' } });
    });

    it('should use default pagination values', async () => {
      prisma.client.referral.findMany.mockResolvedValue([]);
      prisma.client.referral.count.mockResolvedValue(0);

      const result = await service.findByReferrer('user-1');

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(prisma.client.referral.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 50 }),
      );
    });
  });

  // ══════════════════════════════════════════════
  //  FIND BY REFERRED
  // ══════════════════════════════════════════════

  describe('findByReferred', () => {
    it('should return referral with referrer info', async () => {
      const mockData = {
        ...mockReferral,
        referrer: mockReferrerInfo,
      };

      prisma.client.referral.findUnique.mockResolvedValue(mockData);

      const result = await service.findByReferred('user-2');

      expect(result).toEqual(mockData);
      expect(prisma.client.referral.findUnique).toHaveBeenCalledWith({
        where: { referredId: 'user-2' },
        include: {
          referrer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      });
    });

    it('should throw NotFoundException if referral not found', async () => {
      prisma.client.referral.findUnique.mockResolvedValue(null);

      await expect(service.findByReferred('user-999')).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════
  //  FIND ALL
  // ══════════════════════════════════════════════

  describe('findAll', () => {
    it('should return paginated list of all referrals with user infos', async () => {
      const mockData = [
        {
          ...mockReferral,
          referrer: mockReferrerInfo,
          referred: mockReferredInfoBasic,
        },
      ];

      prisma.client.referral.findMany.mockResolvedValue(mockData);
      prisma.client.referral.count.mockResolvedValue(1);

      const result = await service.findAll(1, 20);

      expect(result).toEqual({ data: mockData, total: 1, page: 1, limit: 20 });
      expect(prisma.client.referral.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          referrer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          referred: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      });
    });

    it('should use default pagination values', async () => {
      prisma.client.referral.findMany.mockResolvedValue([]);
      prisma.client.referral.count.mockResolvedValue(0);

      const result = await service.findAll();

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });
  });

  // ══════════════════════════════════════════════
  //  UPDATE
  // ══════════════════════════════════════════════

  describe('update', () => {
    it('should throw NotFoundException if referral not found', async () => {
      prisma.client.referral.findUnique.mockResolvedValue(null);

      await expect(service.update('ref-999', { status: 'COMPLETED' })).rejects.toThrow(NotFoundException);

      expect(prisma.client.referral.update).not.toHaveBeenCalled();
    });

    it('should update status and bonusAmount, and audit with old/new values', async () => {
      const existingReferral = { ...mockReferral, status: 'PENDING', bonusAmount: null };
      const updatedReferral = {
        ...existingReferral,
        status: 'COMPLETED',
        bonusAmount: 50000,
        referrer: mockReferrerInfo,
        referred: mockReferredInfoBasic,
      };

      prisma.client.referral.findUnique.mockResolvedValue(existingReferral);
      prisma.client.referral.update.mockResolvedValue(updatedReferral);

      const result = await service.update('ref-1', { status: 'COMPLETED', bonusAmount: 50000 });

      expect(result).toEqual(updatedReferral);
      expect(prisma.client.referral.update).toHaveBeenCalledWith({
        where: { id: 'ref-1' },
        data: { status: 'COMPLETED', bonusAmount: 50000 },
        include: {
          referrer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          referred: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      });
      expect(audit.log).toHaveBeenCalledWith(
        'REFERRAL_UPDATED',
        'referral',
        'ref-1',
        { ...existingReferral },
        { status: 'COMPLETED', bonusAmount: 50000 },
      );
    });

    it('should partially update only the provided fields', async () => {
      const existingReferral = { ...mockReferral, status: 'PENDING', bonusAmount: null };
      const updatedReferral = {
        ...existingReferral,
        bonusAmount: 25000,
        referrer: mockReferrerInfo,
        referred: mockReferredInfoBasic,
      };

      prisma.client.referral.findUnique.mockResolvedValue(existingReferral);
      prisma.client.referral.update.mockResolvedValue(updatedReferral);

      await service.update('ref-1', { bonusAmount: 25000 });

      expect(prisma.client.referral.update).toHaveBeenCalledWith({
        where: { id: 'ref-1' },
        data: { bonusAmount: 25000 },
        include: {
          referrer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          referred: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      });
    });
  });

  // ══════════════════════════════════════════════
  //  GET REFERRAL STATS
  // ══════════════════════════════════════════════

  describe('getReferralStats', () => {
    it('should return counts and totalBonus for a referrer', async () => {
      prisma.client.referral.count
        .mockResolvedValueOnce(5)  // total
        .mockResolvedValueOnce(3)  // completed
        .mockResolvedValueOnce(2); // pending

      prisma.client.referral.aggregate.mockResolvedValue({
        _sum: { bonusAmount: 150000 },
      });

      const result = await service.getReferralStats('user-1');

      expect(result).toEqual({
        total: 5,
        completed: 3,
        pending: 2,
        totalBonus: 150000,
      });

      expect(prisma.client.referral.count).toHaveBeenCalledWith({ where: { referrerId: 'user-1' } });
      expect(prisma.client.referral.count).toHaveBeenCalledWith({ where: { referrerId: 'user-1', status: 'COMPLETED' } });
      expect(prisma.client.referral.count).toHaveBeenCalledWith({ where: { referrerId: 'user-1', status: 'PENDING' } });
      expect(prisma.client.referral.aggregate).toHaveBeenCalledWith({
        where: { referrerId: 'user-1', status: 'COMPLETED' },
        _sum: { bonusAmount: true },
      });
    });

    it('should return zero totalBonus when no completed referrals', async () => {
      prisma.client.referral.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prisma.client.referral.aggregate.mockResolvedValue({
        _sum: { bonusAmount: null },
      });

      const result = await service.getReferralStats('user-empty');

      expect(result).toEqual({
        total: 0,
        completed: 0,
        pending: 0,
        totalBonus: 0,
      });
    });
  });
});
