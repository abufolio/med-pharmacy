import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CashbacksService } from './cashbacks.service';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';

// ── Test Data ──
const mockPharmacy = {
  id: 'ph-1',
  name: 'Test Pharmacy',
  status: 'ACTIVE',
};

const mockUser = {
  id: 'user-1',
  firstName: 'Ali',
  lastName: 'Valiyev',
  phone: '+998901234567',
  status: 'ACTIVE',
  balance: 5000,
};

const mockRule = {
  id: 'rule-1',
  pharmacyId: 'ph-1',
  type: 'PERCENT',
  value: 5,
  minPurchase: 10000,
  maxCashback: 50000,
  isActive: true,
  validFrom: null,
  validTo: null,
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
};

const mockTransaction = {
  id: 'tx-1',
  userId: 'user-1',
  pharmacyId: 'ph-1',
  employeeId: 'emp-1',
  amount: 50000,
  status: 'COMPLETED',
  user: mockUser,
};

const mockCashback = {
  id: 'cb-1',
  transactionId: 'tx-1',
  userId: 'user-1',
  amount: 2500,
  status: 'ACTIVE',
  createdAt: new Date(),
};

const mockWallet = {
  id: 'wallet-1',
  userId: 'user-1',
  balance: 2500,
};

describe('CashbacksService', () => {
  let service: CashbacksService;
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
        cashbackRule: {
          create: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          count: jest.fn(),
          update: jest.fn(),
        },
        cashback: {
          create: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn(),
        },
        transaction: {
          findUnique: jest.fn(),
        },
        wallet: {
          upsert: jest.fn(),
          findUnique: jest.fn(),
        },
        walletTransaction: {
          create: jest.fn(),
        },
        $transaction: jest.fn(),
      },
    };

    const auditMock = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashbacksService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditHelper, useValue: auditMock },
      ],
    }).compile();

    service = module.get<CashbacksService>(CashbacksService);
    prisma = module.get(PrismaService);
    audit = module.get(AuditHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ══════════════════════════════════════════════
  //  RULES CRUD
  // ══════════════════════════════════════════════

  describe('createRule', () => {
    it('should create a PERCENT cashback rule', async () => {
      const dto = {
        type: 'PERCENT' as const,
        value: 5,
        minPurchase: 10000,
        maxCashback: 50000,
        isActive: true,
      };
      prisma.client.cashbackRule.create.mockResolvedValue(mockRule);

      const result = await service.createRule(dto, 'ph-1');

      expect(result).toEqual(mockRule);
      expect(prisma.client.cashbackRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          pharmacyId: 'ph-1',
          type: 'PERCENT',
          value: 5,
          minPurchase: 10000,
          maxCashback: 50000,
          isActive: true,
        }),
      });
      expect(audit.log).toHaveBeenCalledWith(
        'CASHBACK_RULE_CREATED', 'cashback_rule', 'rule-1', undefined,
        { pharmacyId: 'ph-1', type: 'PERCENT', value: 5 },
      );
    });

    it('should create a FIXED cashback rule with minimal fields', async () => {
      const dto = { type: 'FIXED' as const, value: 3000 };
      const simpleRule = { ...mockRule, type: 'FIXED', value: 3000 };
      prisma.client.cashbackRule.create.mockResolvedValue(simpleRule);

      const result = await service.createRule(dto, 'ph-1');

      expect(result.value).toBe(3000);
      expect(result.type).toBe('FIXED');
    });

    it('should handle optional date fields', async () => {
      const dto = {
        type: 'CAMPAIGN' as const,
        value: 5000,
        validFrom: '2026-07-01T00:00:00Z',
        validTo: '2026-08-01T00:00:00Z',
      };
      prisma.client.cashbackRule.create.mockResolvedValue(mockRule);

      await service.createRule(dto, 'ph-1');

      expect(prisma.client.cashbackRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          validFrom: expect.any(Date),
          validTo: expect.any(Date),
        }),
      });
    });
  });

  describe('findAllRules', () => {
    it('should return paginated rules', async () => {
      const rules = [{ ...mockRule, pharmacy: { id: 'ph-1', name: 'Test Pharmacy' } }];
      prisma.client.cashbackRule.findMany.mockResolvedValue(rules);
      prisma.client.cashbackRule.count.mockResolvedValue(1);

      const result = await service.findAllRules('ph-1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should return all rules without pharmacy filter', async () => {
      prisma.client.cashbackRule.findMany.mockResolvedValue([]);
      prisma.client.cashbackRule.count.mockResolvedValue(0);

      const result = await service.findAllRules();

      expect(result.total).toBe(0);
      expect(prisma.client.cashbackRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe('findRuleById', () => {
    it('should find rule by id', async () => {
      const ruleWithPharmacy = { ...mockRule, pharmacy: { id: 'ph-1', name: 'Test Pharmacy' } };
      prisma.client.cashbackRule.findUnique.mockResolvedValue(ruleWithPharmacy);

      const result = await service.findRuleById('rule-1');

      expect(result.id).toBe('rule-1');
      expect(result.pharmacy.name).toBe('Test Pharmacy');
    });

    it('should throw NotFoundException if rule not found', async () => {
      prisma.client.cashbackRule.findUnique.mockResolvedValue(null);

      await expect(service.findRuleById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRule', () => {
    it('should update rule fields', async () => {
      prisma.client.cashbackRule.findUnique.mockResolvedValue(mockRule);
      const updated = { ...mockRule, value: 10, isActive: false };
      prisma.client.cashbackRule.update.mockResolvedValue(updated);

      const result = await service.updateRule('rule-1', { value: 10, isActive: false });

      expect(result.value).toBe(10);
      expect(result.isActive).toBe(false);
      expect(audit.log).toHaveBeenCalledWith(
        'CASHBACK_RULE_UPDATED', 'cashback_rule', 'rule-1',
        expect.any(Object), expect.objectContaining({ value: 10 }),
      );
    });

    it('should throw NotFoundException if rule not found', async () => {
      prisma.client.cashbackRule.findUnique.mockResolvedValue(null);

      await expect(service.updateRule('invalid-id', { value: 10 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeRule', () => {
    it('should soft-delete a rule', async () => {
      prisma.client.cashbackRule.findUnique.mockResolvedValue(mockRule);
      prisma.client.cashbackRule.update.mockResolvedValue({ ...mockRule, deletedAt: new Date(), isActive: false });

      const result = await service.removeRule('rule-1');

      expect(result.message).toBe('Cashback rule deleted');
      expect(prisma.client.cashbackRule.update).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date), isActive: false }),
      });
      expect(audit.log).toHaveBeenCalledWith('CASHBACK_RULE_DELETED', 'cashback_rule', 'rule-1');
    });

    it('should throw NotFoundException if rule not found', async () => {
      prisma.client.cashbackRule.findUnique.mockResolvedValue(null);

      await expect(service.removeRule('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════
  //  USER CASHBACKS
  // ══════════════════════════════════════════════

  describe('findUserCashbacks', () => {
    it('should return paginated user cashbacks', async () => {
      const cashbacks = [{
        ...mockCashback,
        transaction: { id: 'tx-1', amount: 50000, status: 'COMPLETED', pharmacyId: 'ph-1', createdAt: new Date() },
      }];
      prisma.client.cashback.findMany.mockResolvedValue(cashbacks);
      prisma.client.cashback.count.mockResolvedValue(1);

      const result = await service.findUserCashbacks('user-1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  // ══════════════════════════════════════════════
  //  ACCRUE (CORE CASHBACK ENGINE)
  // ══════════════════════════════════════════════

  describe('accrue', () => {
    it('should accrue PERCENT cashback successfully', async () => {
      const txMock = {
        cashback: { create: jest.fn().mockResolvedValue(mockCashback) },
        wallet: { upsert: jest.fn().mockResolvedValue(mockWallet) },
        walletTransaction: { create: jest.fn().mockResolvedValue({}) },
      };

      prisma.client.transaction.findUnique.mockResolvedValue(mockTransaction);
      prisma.client.cashback.findUnique.mockResolvedValue(null);
      prisma.client.cashbackRule.findFirst.mockResolvedValue(mockRule);
      mockTransactionCallback(txMock);

      const result = await service.accrue({ transactionId: 'tx-1' });

      // 50000 * 5% = 2500
      expect(result.amount).toBe(2500);
      expect(result.rule.type).toBe('PERCENT');
      expect(result.cashback.transactionId).toBe('tx-1');
      expect(audit.log).toHaveBeenCalledWith(
        'CASHBACK_ACCRUED', 'cashback', 'cb-1', undefined,
        expect.objectContaining({ amount: 2500, transactionId: 'tx-1' }),
      );
    });

    it('should accrue with override amount', async () => {
      const txMock = {
        cashback: { create: jest.fn().mockResolvedValue({ ...mockCashback, amount: 10000 }) },
        wallet: { upsert: jest.fn().mockResolvedValue({ ...mockWallet, balance: 10000 }) },
        walletTransaction: { create: jest.fn().mockResolvedValue({}) },
      };

      prisma.client.transaction.findUnique.mockResolvedValue(mockTransaction);
      prisma.client.cashback.findUnique.mockResolvedValue(null);
      prisma.client.cashbackRule.findFirst.mockResolvedValue(mockRule);
      mockTransactionCallback(txMock);

      const result = await service.accrue({ transactionId: 'tx-1', overrideAmount: 10000 });

      expect(result.amount).toBe(10000);
    });

    it('should cap PERCENT cashback by maxCashback', async () => {
      const txMock = {
        cashback: { create: jest.fn().mockResolvedValue({ ...mockCashback, amount: 50000 }) },
        wallet: { upsert: jest.fn().mockResolvedValue(mockWallet) },
        walletTransaction: { create: jest.fn().mockResolvedValue({}) },
      };
      const highRule = { ...mockRule, value: 10, maxCashback: 3000 };

      prisma.client.transaction.findUnique.mockResolvedValue(mockTransaction);
      prisma.client.cashback.findUnique.mockResolvedValue(null);
      prisma.client.cashbackRule.findFirst.mockResolvedValue(highRule);
      mockTransactionCallback(txMock);

      const result = await service.accrue({ transactionId: 'tx-1' });

      // 50000 * 10% = 5000, capped at 3000
      expect(result.amount).toBe(3000);
    });

    it('should process FIXED type cashback', async () => {
      const txMock = {
        cashback: { create: jest.fn().mockResolvedValue({ ...mockCashback, amount: 2000 }) },
        wallet: { upsert: jest.fn().mockResolvedValue(mockWallet) },
        walletTransaction: { create: jest.fn().mockResolvedValue({}) },
      };
      const fixedRule = { ...mockRule, type: 'FIXED', value: 2000, maxCashback: null };

      prisma.client.transaction.findUnique.mockResolvedValue(mockTransaction);
      prisma.client.cashback.findUnique.mockResolvedValue(null);
      prisma.client.cashbackRule.findFirst.mockResolvedValue(fixedRule);
      mockTransactionCallback(txMock);

      const result = await service.accrue({ transactionId: 'tx-1' });

      expect(result.amount).toBe(2000);
      expect(result.rule.type).toBe('FIXED');
    });

    it('should process CAMPAIGN type cashback', async () => {
      const txMock = {
        cashback: { create: jest.fn().mockResolvedValue({ ...mockCashback, amount: 10000 }) },
        wallet: { upsert: jest.fn().mockResolvedValue(mockWallet) },
        walletTransaction: { create: jest.fn().mockResolvedValue({}) },
      };
      const campaignRule = { ...mockRule, type: 'CAMPAIGN', value: 5000, maxCashback: 10000, minPurchase: 0 };

      prisma.client.transaction.findUnique.mockResolvedValue(mockTransaction);
      prisma.client.cashback.findUnique.mockResolvedValue(null);
      prisma.client.cashbackRule.findFirst.mockResolvedValue(campaignRule);
      mockTransactionCallback(txMock);

      const result = await service.accrue({ transactionId: 'tx-1' });

      // CAMPAIGN uses rule.value (5000), not maxCashback
      expect(result.amount).toBe(5000);
      expect(result.rule.type).toBe('CAMPAIGN');
    });

    it('should throw if transaction not found', async () => {
      prisma.client.transaction.findUnique.mockResolvedValue(null);

      await expect(service.accrue({ transactionId: 'tx-invalid' })).rejects.toThrow(NotFoundException);
    });

    it('should throw if cashback already accrued', async () => {
      prisma.client.transaction.findUnique.mockResolvedValue(mockTransaction);
      prisma.client.cashback.findUnique.mockResolvedValue(mockCashback);

      await expect(service.accrue({ transactionId: 'tx-1' })).rejects.toThrow(BadRequestException);
    });

    it('should throw if no active cashback rule found', async () => {
      prisma.client.transaction.findUnique.mockResolvedValue(mockTransaction);
      prisma.client.cashback.findUnique.mockResolvedValue(null);
      prisma.client.cashbackRule.findFirst.mockResolvedValue(null);

      await expect(service.accrue({ transactionId: 'tx-1' })).rejects.toThrow(BadRequestException);
    });
  });
});
