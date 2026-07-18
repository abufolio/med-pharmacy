import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PromocodesService } from './promocodes.service';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';

// ── Test Data ──
const mockPromoCode = {
  id: 'promo-1',
  code: 'WELCOME10',
  type: 'PERCENT',
  value: 10,
  usageLimit: 100,
  usedCount: 5,
  validFrom: new Date('2026-01-01'),
  validTo: new Date('2026-12-31'),
  isActive: true,
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
};

const mockFixedPromoCode = {
  ...mockPromoCode,
  id: 'promo-2',
  code: 'SAVE5000',
  type: 'FIXED',
  value: 5000,
};

const mockRedemption = {
  id: 'redemption-1',
  promoCodeId: 'promo-1',
  userId: 'user-1',
  redeemedAt: new Date(),
};

const mockUser = {
  id: 'user-1',
  firstName: 'Ali',
  lastName: 'Valiyev',
  phone: '+998901234567',
};

describe('PromocodesService', () => {
  let service: PromocodesService;
  let prisma: any;
  let audit: any;

  // ── Inline transaction callback helper ──
  function mockTransactionCallback(txMock: any) {
    prisma.client.$transaction.mockImplementation(
      async (cb: (tx: any) => Promise<any>) => cb(txMock),
    );
  }

  beforeEach(async () => {
    const prismaMock = {
      client: {
        promoCode: {
          create: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn(),
          update: jest.fn(),
        },
        promoRedemption: {
          create: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn(),
        },
        $transaction: jest.fn(),
      },
    };

    const auditMock = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromocodesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditHelper, useValue: auditMock },
      ],
    }).compile();

    service = module.get<PromocodesService>(PromocodesService);
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
    it('should create a promo code with all fields', async () => {
      const dto = {
        code: 'welcome10',
        type: 'PERCENT' as const,
        value: 10,
        usageLimit: 100,
        validFrom: '2026-01-01T00:00:00Z',
        validTo: '2026-12-31T00:00:00Z',
        isActive: true,
      };

      prisma.client.promoCode.findUnique.mockResolvedValue(null);
      prisma.client.promoCode.create.mockResolvedValue(mockPromoCode);

      const result = await service.create(dto);

      expect(result).toEqual(mockPromoCode);
      expect(prisma.client.promoCode.create).toHaveBeenCalledWith({
        data: {
          code: 'WELCOME10',
          type: 'PERCENT',
          value: 10,
          usageLimit: 100,
          validFrom: expect.any(Date),
          validTo: expect.any(Date),
          isActive: true,
        },
      });
      expect(audit.log).toHaveBeenCalledWith(
        'PROMO_CODE_CREATED', 'promo_code', 'promo-1', undefined,
        { code: 'welcome10', type: 'PERCENT', value: 10 },
      );
    });

    it('should create a promo code with minimal fields', async () => {
      const dto = {
        code: 'FLASH',
        type: 'FIXED' as const,
        value: 2000,
      };

      const simplePromo = {
        ...mockFixedPromoCode,
        code: 'FLASH',
        usageLimit: 0,
        validFrom: null,
        validTo: null,
        isActive: undefined,
      };

      prisma.client.promoCode.findUnique.mockResolvedValue(null);
      prisma.client.promoCode.create.mockResolvedValue(simplePromo);

      const result = await service.create(dto);

      expect(result.code).toBe('FLASH');
      expect(result.type).toBe('FIXED');
      expect(prisma.client.promoCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 'FLASH',
          usageLimit: 0,
        }),
      });
    });

    it('should throw ConflictException if code already exists', async () => {
      const dto = {
        code: 'WELCOME10',
        type: 'PERCENT' as const,
        value: 10,
      };

      prisma.client.promoCode.findUnique.mockResolvedValue(mockPromoCode);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.client.promoCode.create).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════
  //  FIND ALL
  // ══════════════════════════════════════════════

  describe('findAll', () => {
    it('should return paginated promo codes ordered by createdAt desc', async () => {
      const promoList = [mockPromoCode, mockFixedPromoCode];
      prisma.client.promoCode.findMany.mockResolvedValue(promoList);
      prisma.client.promoCode.count.mockResolvedValue(2);

      const result = await service.findAll(1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(prisma.client.promoCode.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should use default pagination values', async () => {
      prisma.client.promoCode.findMany.mockResolvedValue([]);
      prisma.client.promoCode.count.mockResolvedValue(0);

      const result = await service.findAll();

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(prisma.client.promoCode.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle second page', async () => {
      prisma.client.promoCode.findMany.mockResolvedValue([]);
      prisma.client.promoCode.count.mockResolvedValue(60);

      const result = await service.findAll(2, 20);

      expect(result.page).toBe(2);
      expect(prisma.client.promoCode.findMany).toHaveBeenCalledWith({
        skip: 20,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ══════════════════════════════════════════════
  //  FIND BY ID
  // ══════════════════════════════════════════════

  describe('findById', () => {
    it('should find a promo code with redemptions including user info', async () => {
      const promoWithRedemptions = {
        ...mockPromoCode,
        redemptions: [
          {
            ...mockRedemption,
            user: mockUser,
          },
        ],
      };

      prisma.client.promoCode.findUnique.mockResolvedValue(promoWithRedemptions);

      const result = await service.findById('promo-1');

      expect(result.id).toBe('promo-1');
      expect(result.redemptions).toHaveLength(1);
      expect(result.redemptions[0].user.firstName).toBe('Ali');
      expect(prisma.client.promoCode.findUnique).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        include: {
          redemptions: {
            take: 20,
            orderBy: { redeemedAt: 'desc' },
            include: {
              user: { select: { id: true, firstName: true, lastName: true, phone: true } },
            },
          },
        },
      });
    });

    it('should throw NotFoundException if promo code not found', async () => {
      prisma.client.promoCode.findUnique.mockResolvedValue(null);

      await expect(service.findById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════
  //  FIND BY CODE
  // ══════════════════════════════════════════════

  describe('findByCode', () => {
    it('should find a promo code by uppercase code', async () => {
      prisma.client.promoCode.findUnique.mockResolvedValue(mockPromoCode);

      const result = await service.findByCode('welcome10');

      expect(result.code).toBe('WELCOME10');
      expect(prisma.client.promoCode.findUnique).toHaveBeenCalledWith({
        where: { code: 'WELCOME10' },
      });
    });

    it('should throw NotFoundException if code not found', async () => {
      prisma.client.promoCode.findUnique.mockResolvedValue(null);

      await expect(service.findByCode('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════
  //  UPDATE
  // ══════════════════════════════════════════════

  describe('update', () => {
    it('should update promo code fields', async () => {
      prisma.client.promoCode.findUnique.mockResolvedValue(mockPromoCode);
      const updated = { ...mockPromoCode, value: 20, isActive: false };
      prisma.client.promoCode.update.mockResolvedValue(updated);

      const result = await service.update('promo-1', { value: 20, isActive: false });

      expect(result.value).toBe(20);
      expect(result.isActive).toBe(false);
      expect(prisma.client.promoCode.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { value: 20, isActive: false },
      });
      expect(audit.log).toHaveBeenCalledWith(
        'PROMO_CODE_UPDATED', 'promo_code', 'promo-1',
        expect.objectContaining({ code: 'WELCOME10' }),
        expect.objectContaining({ value: 20, isActive: false }),
      );
    });

    it('should update type and usageLimit', async () => {
      prisma.client.promoCode.findUnique.mockResolvedValue(mockPromoCode);
      const updated = { ...mockPromoCode, type: 'FIXED', usageLimit: 50 };
      prisma.client.promoCode.update.mockResolvedValue(updated);

      const result = await service.update('promo-1', { type: 'FIXED', usageLimit: 50 });

      expect(result.type).toBe('FIXED');
      expect(result.usageLimit).toBe(50);
      expect(prisma.client.promoCode.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { type: 'FIXED', usageLimit: 50 },
      });
    });

    it('should handle optional date fields', async () => {
      prisma.client.promoCode.findUnique.mockResolvedValue(mockPromoCode);
      const updated = { ...mockPromoCode, validFrom: new Date('2026-07-01'), validTo: new Date('2026-08-01') };
      prisma.client.promoCode.update.mockResolvedValue(updated);

      await service.update('promo-1', {
        validFrom: '2026-07-01T00:00:00Z',
        validTo: '2026-08-01T00:00:00Z',
      });

      expect(prisma.client.promoCode.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: expect.objectContaining({
          validFrom: expect.any(Date),
          validTo: expect.any(Date),
        }),
      });
    });

    it('should throw NotFoundException if promo code not found', async () => {
      prisma.client.promoCode.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', { value: 10 })).rejects.toThrow(NotFoundException);
      expect(prisma.client.promoCode.update).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════
  //  REMOVE (soft delete)
  // ══════════════════════════════════════════════

  describe('remove', () => {
    it('should soft-delete a promo code', async () => {
      prisma.client.promoCode.findUnique.mockResolvedValue(mockPromoCode);
      const deletedPromo = { ...mockPromoCode, deletedAt: new Date(), isActive: false };
      prisma.client.promoCode.update.mockResolvedValue(deletedPromo);

      const result = await service.remove('promo-1');

      expect(result.message).toBe('Promo code deleted');
      expect(prisma.client.promoCode.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date), isActive: false }),
      });
      expect(audit.log).toHaveBeenCalledWith('PROMO_CODE_DELETED', 'promo_code', 'promo-1');
    });

    it('should throw NotFoundException if promo code not found', async () => {
      prisma.client.promoCode.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
      expect(prisma.client.promoCode.update).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════
  //  REDEEM
  // ══════════════════════════════════════════════

  describe('redeem', () => {
    it('should redeem a PERCENT promo code successfully', async () => {
      const dto = { code: 'welcome10', purchaseAmount: 100000 };
      const txMock = {
        promoCode: {
          findUnique: jest.fn().mockResolvedValue(mockPromoCode),
          update: jest.fn().mockResolvedValue({ ...mockPromoCode, usedCount: 6 }),
        },
        promoRedemption: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockRedemption),
        },
      };

      prisma.client.promoCode.findUnique.mockResolvedValue(mockPromoCode);
      mockTransactionCallback(txMock);

      const result = await service.redeem('user-1', dto);

      // 100000 * 10% = 10000
      expect(result.discount).toBe(10000);
      expect(result.code).toBe('WELCOME10');
      expect(result.type).toBe('PERCENT');
      expect(result.redemption.id).toBe('redemption-1');
      expect(txMock.promoRedemption.create).toHaveBeenCalledWith({
        data: { promoCodeId: 'promo-1', userId: 'user-1' },
      });
      expect(txMock.promoCode.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { usedCount: { increment: 1 } },
      });
      expect(audit.log).toHaveBeenCalledWith(
        'PROMO_CODE_REDEEMED', 'promo_redemption', 'redemption-1', undefined,
        expect.objectContaining({ userId: 'user-1', promoCode: 'WELCOME10', discount: 10000 }),
      );
    });

    it('should redeem a FIXED promo code successfully', async () => {
      const dto = { code: 'save5000', purchaseAmount: 50000 };
      const txMock = {
        promoCode: {
          findUnique: jest.fn().mockResolvedValue(mockFixedPromoCode),
          update: jest.fn().mockResolvedValue({ ...mockFixedPromoCode, usedCount: 1 }),
        },
        promoRedemption: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ ...mockRedemption, promoCodeId: 'promo-2' }),
        },
      };

      prisma.client.promoCode.findUnique.mockResolvedValue(mockFixedPromoCode);
      mockTransactionCallback(txMock);

      const result = await service.redeem('user-2', dto);

      // FIXED type simply returns value
      expect(result.discount).toBe(5000);
      expect(result.code).toBe('SAVE5000');
      expect(result.type).toBe('FIXED');
    });

    it('should throw NotFoundException if code not found', async () => {
      const dto = { code: 'INVALID', purchaseAmount: 10000 };

      prisma.client.promoCode.findUnique.mockResolvedValue(null);

      await expect(service.redeem('user-1', dto)).rejects.toThrow(NotFoundException);
      expect(prisma.client.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if promo code is inactive', async () => {
      const dto = { code: 'inactive', purchaseAmount: 10000 };
      const inactiveCode = { ...mockPromoCode, isActive: false };

      prisma.client.promoCode.findUnique.mockResolvedValue(inactiveCode);

      await expect(service.redeem('user-1', dto)).rejects.toThrow(BadRequestException);
      expect(prisma.client.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if promo code is not yet valid', async () => {
      const dto = { code: 'future', purchaseAmount: 10000 };
      const futureCode = { ...mockPromoCode, validFrom: new Date('2099-01-01') };

      prisma.client.promoCode.findUnique.mockResolvedValue(futureCode);

      await expect(service.redeem('user-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if promo code has expired', async () => {
      const dto = { code: 'expired', purchaseAmount: 10000 };
      const expiredCode = { ...mockPromoCode, validTo: new Date('2024-01-01') };

      prisma.client.promoCode.findUnique.mockResolvedValue(expiredCode);

      await expect(service.redeem('user-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should allow redeem if no validFrom/validTo boundaries are set', async () => {
      const dto = { code: 'always', purchaseAmount: 10000 };
      const noDatesPromo = { ...mockPromoCode, validFrom: null, validTo: null };
      const txMock = {
        promoCode: {
          findUnique: jest.fn().mockResolvedValue(noDatesPromo),
          update: jest.fn().mockResolvedValue({ ...noDatesPromo, usedCount: 1 }),
        },
        promoRedemption: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockRedemption),
        },
      };

      prisma.client.promoCode.findUnique.mockResolvedValue(noDatesPromo);
      mockTransactionCallback(txMock);

      const result = await service.redeem('user-1', dto);

      expect(result.discount).toBe(1000);
    });

    it('should throw BadRequestException if usage limit reached inside transaction', async () => {
      const dto = { code: 'limited', purchaseAmount: 10000 };
      const usedUp = { ...mockPromoCode, usageLimit: 5, usedCount: 5 };
      const txMock = {
        promoCode: {
          findUnique: jest.fn().mockResolvedValue(usedUp),
        },
        promoRedemption: {
          findUnique: jest.fn(),
          create: jest.fn(),
        },
      };

      prisma.client.promoCode.findUnique.mockResolvedValue(usedUp);
      mockTransactionCallback(txMock);

      await expect(service.redeem('user-1', dto)).rejects.toThrow(BadRequestException);
      expect(txMock.promoRedemption.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if usage limit is 0 (unlimited) regardless of usedCount', async () => {
      const dto = { code: 'unlimited', purchaseAmount: 10000 };
      const unlimited = { ...mockPromoCode, usageLimit: 0, usedCount: 999 };
      const txMock = {
        promoCode: {
          findUnique: jest.fn().mockResolvedValue(unlimited),
          update: jest.fn().mockResolvedValue({ ...unlimited, usedCount: 1000 }),
        },
        promoRedemption: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockRedemption),
        },
      };

      prisma.client.promoCode.findUnique.mockResolvedValue(unlimited);
      mockTransactionCallback(txMock);

      const result = await service.redeem('user-1', dto);

      expect(result.discount).toBeDefined();
      expect(txMock.promoRedemption.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if duplicate redemption inside transaction', async () => {
      const dto = { code: 'welcome10', purchaseAmount: 10000 };
      const txMock = {
        promoCode: {
          findUnique: jest.fn().mockResolvedValue(mockPromoCode),
        },
        promoRedemption: {
          findUnique: jest.fn().mockResolvedValue(mockRedemption),
          create: jest.fn(),
        },
      };

      prisma.client.promoCode.findUnique.mockResolvedValue(mockPromoCode);
      mockTransactionCallback(txMock);

      await expect(service.redeem('user-1', dto)).rejects.toThrow(ConflictException);
      expect(txMock.promoRedemption.create).not.toHaveBeenCalled();
    });

    it('should use uppercase code for lookup', async () => {
      const dto = { code: 'Welcome10', purchaseAmount: 10000 };
      const txMock = {
        promoCode: {
          findUnique: jest.fn().mockResolvedValue(mockPromoCode),
          update: jest.fn().mockResolvedValue({ ...mockPromoCode, usedCount: 6 }),
        },
        promoRedemption: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockRedemption),
        },
      };

      prisma.client.promoCode.findUnique.mockResolvedValue(mockPromoCode);
      mockTransactionCallback(txMock);

      await service.redeem('user-1', dto);

      // First lookup should be upper-cased
      expect(prisma.client.promoCode.findUnique).toHaveBeenCalledWith({
        where: { code: 'WELCOME10' },
      });
    });
  });

  // ══════════════════════════════════════════════
  //  GET USER REDEMPTIONS
  // ══════════════════════════════════════════════

  describe('getUserRedemptions', () => {
    it('should return paginated user redemptions with promo code info', async () => {
      const redemptions = [
        {
          ...mockRedemption,
          promoCode: { code: 'WELCOME10', type: 'PERCENT', value: 10 },
        },
      ];

      prisma.client.promoRedemption.findMany.mockResolvedValue(redemptions);
      prisma.client.promoRedemption.count.mockResolvedValue(1);

      const result = await service.getUserRedemptions('user-1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].promoCode.code).toBe('WELCOME10');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(prisma.client.promoRedemption.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        skip: 0,
        take: 20,
        orderBy: { redeemedAt: 'desc' },
        include: {
          promoCode: { select: { code: true, type: true, value: true } },
        },
      });
    });

    it('should use default pagination values', async () => {
      prisma.client.promoRedemption.findMany.mockResolvedValue([]);
      prisma.client.promoRedemption.count.mockResolvedValue(0);

      const result = await service.getUserRedemptions('user-1');

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    it('should return empty list for user with no redemptions', async () => {
      prisma.client.promoRedemption.findMany.mockResolvedValue([]);
      prisma.client.promoRedemption.count.mockResolvedValue(0);

      const result = await service.getUserRedemptions('user-without-redemptions');

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
