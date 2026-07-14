import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
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

const mockPharmacy = {
  id: 'ph-1',
  name: 'Test Pharmacy',
  status: 'ACTIVE',
};

const mockRule = {
  id: 'rule-1',
  type: 'PERCENT',
  value: 5,
  minPurchase: 10000,
  maxCashback: 50000,
  pharmacyId: 'ph-1',
  isActive: true,
  validFrom: null,
  validTo: new Date('2030-12-31'),
  createdAt: new Date('2026-01-01'),
  deletedAt: null,
};

const mockTransaction = {
  id: 'tx-1',
  userId: 'user-1',
  pharmacyId: 'ph-1',
  employeeId: 'emp-1',
  amount: 50000,
  status: 'COMPLETED',
};

const mockCashback = {
  id: 'cb-1',
  transactionId: 'tx-1',
  userId: 'user-1',
  amount: 2500,
  status: 'ACTIVE',
};

const mockWallet = {
  id: 'wallet-1',
  userId: 'user-1',
  balance: 5000,
};

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: any;
  let audit: any;

  // ── Inline transaction callback helper ──
  function mockTransactionCallback(txMock: any) {
    prisma.client.$transaction.mockImplementation(
      async (cb: (tx: any) => Promise<any>) => cb(txMock),
    );
  }

  beforeEach(async () => {
    const txMock = {
      transaction: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
      cashback: { create: jest.fn(), update: jest.fn() },
      wallet: { upsert: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      walletTransaction: { create: jest.fn() },
    };

    const prismaMock = {
      client: {
        user: { findUnique: jest.fn() },
        pharmacy: { findUnique: jest.fn() },
        cashbackRule: { findFirst: jest.fn() },
        transaction: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
        $transaction: jest.fn(),
      },
    };

    const auditMock = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditHelper, useValue: auditMock },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get(PrismaService);
    audit = module.get(AuditHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Shared dto for all create/cashback tests
  const dto = {
    userId: 'user-1',
    pharmacyId: 'ph-1',
    employeeId: 'emp-1',
    amount: 50000,
  };

  // ══════════════════════════════════════════════
  //  CREATE TRANSACTION
  // ══════════════════════════════════════════════

  describe('create', () => {

    it('should create transaction with cashback', async () => {
      const txMock = {
        transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
        cashback: { create: jest.fn().mockResolvedValue(mockCashback) },
        wallet: { upsert: jest.fn().mockResolvedValue({ ...mockWallet, balance: 5000 }) },
        walletTransaction: { create: jest.fn().mockResolvedValue({}) },
      };

      prisma.client.user.findUnique.mockResolvedValue(mockUser);
      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);
      prisma.client.cashbackRule.findFirst.mockResolvedValue(mockRule);
      mockTransactionCallback(txMock);

      const result = await service.create(dto);

      // 50000 * 5% = 2500
      expect(result.cashback).not.toBeNull();
      expect(result.cashback!.amount).toBe(2500);
      expect(result.cashback!.ruleType).toBe('PERCENT');
      expect(result.transaction.status).toBe('COMPLETED');
      expect(result.wallet.balance).toBeGreaterThan(result.wallet.previousBalance);
      expect(audit.log).toHaveBeenCalledWith('TRANSACTION_CREATED', 'transaction', 'tx-1', undefined, {
        userId: 'user-1',
        pharmacyId: 'ph-1',
        amount: 50000,
        cashbackAmount: 2500,
        cashbackRule: 'PERCENT',
      });
      expect(audit.log).toHaveBeenCalledWith('CASHBACK_ACCRUED', 'cashback', 'cb-1', undefined, {
        userId: 'user-1',
        pharmacyId: 'ph-1',
        amount: 2500,
        transactionId: 'tx-1',
      });
    });

    it('should create transaction without cashback (no rule)', async () => {
      const txMock = {
        transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
        cashback: { create: jest.fn() },
        wallet: { upsert: jest.fn().mockResolvedValue({ ...mockWallet, balance: 0 }) },
        walletTransaction: { create: jest.fn() },
      };

      prisma.client.user.findUnique.mockResolvedValue(mockUser);
      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);
      prisma.client.cashbackRule.findFirst.mockResolvedValue(null);
      mockTransactionCallback(txMock);

      const result = await service.create(dto);

      expect(result.cashback).toBeNull();
      expect(result.transaction.status).toBe('COMPLETED');
      expect(txMock.cashback.create).not.toHaveBeenCalled();
    });

    it('should create transaction without cashback (below minPurchase)', async () => {
      const txMock = {
        transaction: { create: jest.fn().mockResolvedValue({ ...mockTransaction, amount: 5000 }) },
        cashback: { create: jest.fn() },
        wallet: { upsert: jest.fn().mockResolvedValue({ ...mockWallet, balance: 0 }) },
        walletTransaction: { create: jest.fn() },
      };

      prisma.client.user.findUnique.mockResolvedValue(mockUser);
      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);
      prisma.client.cashbackRule.findFirst.mockResolvedValue(mockRule);
      mockTransactionCallback(txMock);

      const result = await service.create({ ...dto, amount: 5000 });

      expect(result.cashback).toBeNull();
      expect(txMock.cashback.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.client.user.findUnique.mockResolvedValue(null);
      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if pharmacy not found', async () => {
      prisma.client.user.findUnique.mockResolvedValue(mockUser);
      prisma.client.pharmacy.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for inactive pharmacy', async () => {
      prisma.client.user.findUnique.mockResolvedValue(mockUser);
      prisma.client.pharmacy.findUnique.mockResolvedValue({ ...mockPharmacy, status: 'INACTIVE' });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for blocked user', async () => {
      prisma.client.user.findUnique.mockResolvedValue({ ...mockUser, status: 'BLOCKED' });
      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ══════════════════════════════════════════════
  //  CASHBACK CALCULATION (private, tested via create)
  // ══════════════════════════════════════════════

  describe('cashback calculation', () => {
    it('should calculate PERCENT cashback correctly', async () => {
      const txMock = {
        transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
        cashback: { create: jest.fn().mockResolvedValue({ ...mockCashback, amount: 1250 }) },
        wallet: { upsert: jest.fn().mockResolvedValue(mockWallet) },
        walletTransaction: { create: jest.fn() },
      };

      prisma.client.user.findUnique.mockResolvedValue(mockUser);
      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);
      prisma.client.cashbackRule.findFirst.mockResolvedValue({
        ...mockRule,
        type: 'PERCENT',
        value: 2.5,
        maxCashback: null,
      });
      mockTransactionCallback(txMock);

      const result = await service.create({ ...dto, amount: 50000 });

      // 50000 * 2.5% = 1250
      expect(result.cashback!.amount).toBe(1250);
    });

    it('should cap PERCENT cashback by maxCashback', async () => {
      const txMock = {
        transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
        cashback: { create: jest.fn().mockResolvedValue({ ...mockCashback, amount: 50000 }) },
        wallet: { upsert: jest.fn().mockResolvedValue(mockWallet) },
        walletTransaction: { create: jest.fn() },
      };

      prisma.client.user.findUnique.mockResolvedValue(mockUser);
      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);
      prisma.client.cashbackRule.findFirst.mockResolvedValue({
        ...mockRule,
        type: 'PERCENT',
        value: 10,       // 10%
        maxCashback: 3000,  // capped at 3000
      });
      mockTransactionCallback(txMock);

      const result = await service.create({ ...dto, amount: 100000 });

      // 100000 * 10% = 10000, but capped at 3000
      expect(result.cashback!.amount).toBe(3000);
    });

    it('should return FIXED cashback', async () => {
      const txMock = {
        transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
        cashback: { create: jest.fn().mockResolvedValue({ ...mockCashback, amount: 2000 }) },
        wallet: { upsert: jest.fn().mockResolvedValue(mockWallet) },
        walletTransaction: { create: jest.fn() },
      };

      prisma.client.user.findUnique.mockResolvedValue(mockUser);
      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);
      prisma.client.cashbackRule.findFirst.mockResolvedValue({
        ...mockRule,
        type: 'FIXED',
        value: 2000,
        minPurchase: 0,
        maxCashback: null,
      });
      mockTransactionCallback(txMock);

      const result = await service.create({ ...dto, amount: 30000 });

      expect(result.cashback!.amount).toBe(2000);
      expect(result.cashback!.ruleType).toBe('FIXED');
    });

    it('should handle CAMPAIGN type cashback', async () => {
      const txMock = {
        transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
        cashback: { create: jest.fn().mockResolvedValue({ ...mockCashback, amount: 5000 }) },
        wallet: { upsert: jest.fn().mockResolvedValue(mockWallet) },
        walletTransaction: { create: jest.fn() },
      };

      prisma.client.user.findUnique.mockResolvedValue(mockUser);
      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);
      prisma.client.cashbackRule.findFirst.mockResolvedValue({
        ...mockRule,
        type: 'CAMPAIGN',
        value: 5000,
        maxCashback: 10000,
        minPurchase: 0,
      });
      mockTransactionCallback(txMock);

      const result = await service.create({ ...dto, amount: 50000 });

      expect(result.cashback!.amount).toBe(10000);
    });
  });

  // ══════════════════════════════════════════════
  //  QUERY HELPERS
  // ══════════════════════════════════════════════

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const mockData = [{ ...mockTransaction, user: { id: 'user-1', firstName: 'Ali', lastName: 'Valiyev', phone: '+998901234567' }, cashbacks: [] }];
      prisma.client.transaction.findMany.mockResolvedValue(mockData);
      prisma.client.transaction.count.mockResolvedValue(1);

      const result = await service.findAll('ph-1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('findById', () => {
    it('should return transaction if found', async () => {
      const mockTx = {
        ...mockTransaction,
        user: { id: 'user-1', firstName: 'Ali', lastName: 'Valiyev', phone: '+998901234567' },
        pharmacy: { id: 'ph-1', name: 'Test Pharmacy' },
        cashbacks: [mockCashback],
      };
      prisma.client.transaction.findUnique.mockResolvedValue(mockTx);

      const result = await service.findById('tx-1');

      expect(result.id).toBe('tx-1');
      expect(result.pharmacy.name).toBe('Test Pharmacy');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.client.transaction.findUnique.mockResolvedValue(null);

      await expect(service.findById('tx-invalid')).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════
  //  REVERSE TRANSACTION
  // ══════════════════════════════════════════════

  describe('reverseTransaction', () => {
    it('should reverse a completed transaction with cashback', async () => {
      const txMock = {
        transaction: { update: jest.fn().mockResolvedValue({ ...mockTransaction, status: 'REVERSED' }) },
        cashback: { update: jest.fn().mockResolvedValue({}) },
        wallet: {
          findUnique: jest.fn().mockResolvedValue({ ...mockWallet, balance: 7500 }),
          update: jest.fn().mockResolvedValue({}),
        },
        walletTransaction: { create: jest.fn().mockResolvedValue({}) },
      };

      prisma.client.transaction.findUnique.mockResolvedValue({
        ...mockTransaction,
        userId: 'user-1',
        cashbacks: [mockCashback],
      });
      mockTransactionCallback(txMock);

      const result = await service.reverseTransaction('tx-1');

      expect(result.message).toBe('Transaction reversed successfully');
      expect(txMock.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'REVERSED' } }),
      );
      expect(txMock.cashback.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ROLLED_BACK' } }),
      );
      expect(audit.log).toHaveBeenCalledWith('TRANSACTION_REVERSED', 'transaction', 'tx-1', undefined, {
        userId: 'user-1',
        amount: 50000,
      });
    });

    it('should throw NotFoundException if transaction not found', async () => {
      prisma.client.transaction.findUnique.mockResolvedValue(null);

      await expect(service.reverseTransaction('tx-invalid')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already reversed', async () => {
      prisma.client.transaction.findUnique.mockResolvedValue({
        ...mockTransaction,
        status: 'REVERSED',
        cashbacks: [],
      });

      await expect(service.reverseTransaction('tx-1')).rejects.toThrow(BadRequestException);
    });
  });
});
