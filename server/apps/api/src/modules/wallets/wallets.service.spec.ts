import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';

// ── Test Data ──
const mockWallet = { id: 'wallet-1', userId: 'user-1', balance: 10000, createdAt: new Date(), updatedAt: new Date() };
const mockWithdrawRequest = { id: 'wr-1', userId: 'user-1', amount: 5000, status: 'PENDING', createdAt: new Date() };

describe('WalletsService', () => {
  let service: WalletsService;
  let prisma: any;
  let audit: any;

  function mockTransactionCallback(txMock: any) {
    prisma.client.$transaction.mockImplementation(
      async (cb: (tx: any) => Promise<any>) => cb(txMock),
    );
  }

  beforeEach(async () => {
    const prismaMock = {
      client: {
        wallet: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        walletTransaction: {
          findMany: jest.fn(),
          count: jest.fn(),
          create: jest.fn(),
        },
        withdrawRequest: {
          create: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          count: jest.fn(),
          update: jest.fn(),
        },
        $transaction: jest.fn(),
      },
    };

    const auditMock = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditHelper, useValue: auditMock },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
    prisma = module.get(PrismaService);
    audit = module.get(AuditHelper);
  });

  afterEach(() => jest.clearAllMocks());

  // ══════════════════════════════════════════════
  // BALANCE
  // ══════════════════════════════════════════════
  describe('getBalance', () => {
    it('should return wallet balance', async () => {
      prisma.client.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getBalance('user-1');
      expect(result.balance).toBe(10000);
    });

    it('should return zero balance if no wallet exists', async () => {
      prisma.client.wallet.findUnique.mockResolvedValue(null);

      const result = await service.getBalance('user-1');
      expect(result.balance).toBe(0);
      expect(result.userId).toBe('user-1');
    });
  });

  // ══════════════════════════════════════════════
  // TRANSACTION HISTORY
  // ══════════════════════════════════════════════
  describe('getTransactionHistory', () => {
    it('should return paginated history', async () => {
      prisma.client.wallet.findUnique.mockResolvedValue(mockWallet);
      prisma.client.walletTransaction.findMany.mockResolvedValue([
        { id: 'wt-1', walletId: 'wallet-1', type: 'CREDIT', amount: 2500 },
      ]);
      prisma.client.walletTransaction.count.mockResolvedValue(1);

      const result = await service.getTransactionHistory('user-1', 1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should return empty if no wallet', async () => {
      prisma.client.wallet.findUnique.mockResolvedValue(null);

      const result = await service.getTransactionHistory('user-1');
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ══════════════════════════════════════════════
  // WITHDRAW REQUEST
  // ══════════════════════════════════════════════
  describe('requestWithdraw', () => {
    it('should create withdraw request', async () => {
      prisma.client.wallet.findUnique.mockResolvedValue(mockWallet);
      prisma.client.withdrawRequest.create.mockResolvedValue(mockWithdrawRequest);

      const result = await service.requestWithdraw('user-1', { amount: 5000 });

      expect(result.amount).toBe(5000);
      expect(result.status).toBe('PENDING');
      expect(audit.log).toHaveBeenCalledWith('WITHDRAW_REQUESTED', 'withdraw_request', 'wr-1', undefined, expect.any(Object));
    });

    it('should throw if wallet is empty', async () => {
      prisma.client.wallet.findUnique.mockResolvedValue(null);

      await expect(service.requestWithdraw('user-1', { amount: 1000 })).rejects.toThrow(BadRequestException);
    });

    it('should throw if insufficient balance', async () => {
      prisma.client.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(service.requestWithdraw('user-1', { amount: 99999 })).rejects.toThrow(BadRequestException);
    });
  });

  // ══════════════════════════════════════════════
  // REVIEW WITHDRAW
  // ══════════════════════════════════════════════
  describe('reviewWithdraw', () => {
    it('should approve withdraw and debit wallet', async () => {
      const txMock = {
        wallet: {
          findUnique: jest.fn().mockResolvedValue(mockWallet),
          update: jest.fn(),
        },
        walletTransaction: { create: jest.fn() },
        withdrawRequest: { update: jest.fn() },
      };

      prisma.client.withdrawRequest.findUnique.mockResolvedValue(mockWithdrawRequest);
      mockTransactionCallback(txMock);

      const result = await service.reviewWithdraw('wr-1', 'sa-1', { status: 'APPROVED' });

      expect(result.message).toBe('Withdraw request approved');
      expect(txMock.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { balance: { decrement: 5000 } } }),
      );
      expect(audit.log).toHaveBeenCalledWith('WITHDRAW_APPROVED', 'withdraw_request', 'wr-1', undefined, expect.any(Object));
    });

    it('should reject withdraw without debiting wallet', async () => {
      prisma.client.withdrawRequest.findUnique.mockResolvedValue(mockWithdrawRequest);
      prisma.client.withdrawRequest.update.mockResolvedValue({ ...mockWithdrawRequest, status: 'REJECTED' });

      const result = await service.reviewWithdraw('wr-1', 'sa-1', { status: 'REJECTED' });

      expect(result.message).toBe('Withdraw request rejected');
      expect(prisma.client.$transaction).not.toHaveBeenCalled();
    });

    it('should throw if request not found', async () => {
      prisma.client.withdrawRequest.findUnique.mockResolvedValue(null);

      await expect(service.reviewWithdraw('invalid', 'sa-1', { status: 'APPROVED' })).rejects.toThrow(NotFoundException);
    });

    it('should throw if already reviewed', async () => {
      prisma.client.withdrawRequest.findUnique.mockResolvedValue({ ...mockWithdrawRequest, status: 'APPROVED' });

      await expect(service.reviewWithdraw('wr-1', 'sa-1', { status: 'APPROVED' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getWithdrawRequests', () => {
    it('should return paginated withdraw requests', async () => {
      prisma.client.withdrawRequest.findMany.mockResolvedValue([{ ...mockWithdrawRequest, user: { id: 'user-1', firstName: 'Ali', lastName: 'Valiyev', phone: '+998901234567' } }]);
      prisma.client.withdrawRequest.count.mockResolvedValue(1);

      const result = await service.getWithdrawRequests(undefined, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
