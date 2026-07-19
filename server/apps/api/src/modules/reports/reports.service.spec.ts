import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '@server/database';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  const mockPrismaClient = {
    dailyStatistic: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    pharmacy: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    withdrawRequest: {
      count: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: {
            client: mockPrismaClient,
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // getDailyStats
  // ──────────────────────────────────────────────

  describe('getDailyStats', () => {
    const pharmacyId = 'pharmacy-1';
    const mockData = [
      { id: '1', pharmacyId, date: new Date('2025-06-15'), totalTransactions: 10, totalAmount: 1000 },
      { id: '2', pharmacyId, date: new Date('2025-06-14'), totalTransactions: 5, totalAmount: 500 },
    ];

    it('should return paginated daily stats without date range', async () => {
      mockPrismaClient.dailyStatistic.findMany.mockResolvedValue(mockData);
      mockPrismaClient.dailyStatistic.count.mockResolvedValue(2);

      const result = await service.getDailyStats(pharmacyId);

      expect(mockPrismaClient.dailyStatistic.findMany).toHaveBeenCalledWith({
        where: { pharmacyId },
        skip: 0,
        take: 31,
        orderBy: { date: 'desc' },
      });
      expect(mockPrismaClient.dailyStatistic.count).toHaveBeenCalledWith({
        where: { pharmacyId },
      });
      expect(result).toEqual({ data: mockData, total: 2, page: 1, limit: 31 });
    });

    it('should apply date range when from and to are provided', async () => {
      mockPrismaClient.dailyStatistic.findMany.mockResolvedValue(mockData);
      mockPrismaClient.dailyStatistic.count.mockResolvedValue(2);

      const from = '2025-06-01';
      const to = '2025-06-30';
      await service.getDailyStats(pharmacyId, from, to);

      expect(mockPrismaClient.dailyStatistic.findMany).toHaveBeenCalledWith({
        where: {
          pharmacyId,
          date: {
            gte: new Date(from),
            lte: new Date(to),
          },
        },
        skip: 0,
        take: 31,
        orderBy: { date: 'desc' },
      });
    });

    it('should apply only from date', async () => {
      mockPrismaClient.dailyStatistic.findMany.mockResolvedValue([]);
      mockPrismaClient.dailyStatistic.count.mockResolvedValue(0);

      await service.getDailyStats(pharmacyId, '2025-06-01');

      expect(mockPrismaClient.dailyStatistic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            pharmacyId,
            date: { gte: new Date('2025-06-01') },
          },
        }),
      );
    });

    it('should apply only to date', async () => {
      mockPrismaClient.dailyStatistic.findMany.mockResolvedValue([]);
      mockPrismaClient.dailyStatistic.count.mockResolvedValue(0);

      await service.getDailyStats(pharmacyId, undefined, '2025-06-30');

      expect(mockPrismaClient.dailyStatistic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            pharmacyId,
            date: { lte: new Date('2025-06-30') },
          },
        }),
      );
    });

    it('should respect custom page and limit', async () => {
      mockPrismaClient.dailyStatistic.findMany.mockResolvedValue([]);
      mockPrismaClient.dailyStatistic.count.mockResolvedValue(0);

      const result = await service.getDailyStats(pharmacyId, undefined, undefined, 3, 10);

      expect(mockPrismaClient.dailyStatistic.findMany).toHaveBeenCalledWith({
        where: { pharmacyId },
        skip: 20,
        take: 10,
        orderBy: { date: 'desc' },
      });
      expect(result).toEqual({ data: [], total: 0, page: 3, limit: 10 });
    });

    it('should handle empty result set', async () => {
      mockPrismaClient.dailyStatistic.findMany.mockResolvedValue([]);
      mockPrismaClient.dailyStatistic.count.mockResolvedValue(0);

      const result = await service.getDailyStats(pharmacyId);

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 31 });
    });
  });

  // ──────────────────────────────────────────────
  // getPharmacySummary
  // ──────────────────────────────────────────────

  describe('getPharmacySummary', () => {
    const pharmacyId = 'pharmacy-1';

    it('should return summary without date range', async () => {
      const mockAggregation = {
        _sum: {
          totalTransactions: 100,
          totalAmount: 50000,
          totalCashback: 5000,
          totalCustomers: 50,
        },
        _avg: {
          totalAmount: 500,
        },
      };

      mockPrismaClient.dailyStatistic.aggregate.mockResolvedValue(mockAggregation);
      mockPrismaClient.dailyStatistic.count.mockResolvedValue(30);

      const result = await service.getPharmacySummary(pharmacyId);

      expect(mockPrismaClient.dailyStatistic.aggregate).toHaveBeenCalledWith({
        where: { pharmacyId },
        _sum: {
          totalTransactions: true,
          totalAmount: true,
          totalCashback: true,
          totalCustomers: true,
        },
        _avg: {
          totalAmount: true,
        },
      });
      expect(mockPrismaClient.dailyStatistic.count).toHaveBeenCalledWith({
        where: { pharmacyId },
      });
      expect(result).toEqual({
        pharmacyId,
        period: { from: 'all', to: 'all' },
        days: 30,
        totalTransactions: 100,
        totalAmount: 50000,
        totalCashback: 5000,
        totalCustomers: 50,
        avgTransactionAmount: 500,
      });
    });

    it('should apply date range', async () => {
      mockPrismaClient.dailyStatistic.aggregate.mockResolvedValue({
        _sum: { totalTransactions: 50, totalAmount: 25000, totalCashback: 2500, totalCustomers: 25 },
        _avg: { totalAmount: 500 },
      });
      mockPrismaClient.dailyStatistic.count.mockResolvedValue(15);

      const from = '2025-06-01';
      const to = '2025-06-15';
      const result = await service.getPharmacySummary(pharmacyId, from, to);

      expect(mockPrismaClient.dailyStatistic.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            pharmacyId,
            date: {
              gte: new Date(from),
              lte: new Date(to),
            },
          },
        }),
      );
      expect(result.period).toEqual({ from, to });
      expect(result.days).toBe(15);
    });

    it('should handle null aggregation values (return 0)', async () => {
      mockPrismaClient.dailyStatistic.aggregate.mockResolvedValue({
        _sum: { totalTransactions: null, totalAmount: null, totalCashback: null, totalCustomers: null },
        _avg: { totalAmount: null },
      });
      mockPrismaClient.dailyStatistic.count.mockResolvedValue(0);

      const result = await service.getPharmacySummary(pharmacyId);

      expect(result.totalTransactions).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.totalCashback).toBe(0);
      expect(result.totalCustomers).toBe(0);
      expect(result.avgTransactionAmount).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // getAdminOverview
  // ──────────────────────────────────────────────

  describe('getAdminOverview', () => {
    it('should return admin overview without date range', async () => {
      const mockAggregation = {
        _sum: {
          totalTransactions: 1000,
          totalAmount: 500000,
          totalCashback: 50000,
          totalCustomers: 500,
        },
      };

      mockPrismaClient.dailyStatistic.aggregate.mockResolvedValue(mockAggregation);
      mockPrismaClient.pharmacy.count.mockResolvedValue(10);
      mockPrismaClient.user.count.mockResolvedValue(200);
      mockPrismaClient.withdrawRequest.count.mockResolvedValue(5);

      const result = await service.getAdminOverview();

      expect(mockPrismaClient.dailyStatistic.aggregate).toHaveBeenCalledWith({
        where: {},
        _sum: {
          totalTransactions: true,
          totalAmount: true,
          totalCashback: true,
          totalCustomers: true,
        },
      });
      expect(mockPrismaClient.pharmacy.count).toHaveBeenCalledWith({ where: { deletedAt: null } });
      expect(mockPrismaClient.user.count).toHaveBeenCalledWith({
        where: { status: { not: 'BLOCKED' }, deletedAt: null },
      });
      expect(mockPrismaClient.withdrawRequest.count).toHaveBeenCalledWith({ where: { status: 'PENDING' } });
      expect(result).toEqual({
        period: { from: 'all', to: 'all' },
        totalTransactions: 1000,
        totalAmount: 500000,
        totalCashback: 50000,
        totalCustomers: 500,
        activePharmacies: 10,
        activeUsers: 200,
        pendingWithdraws: 5,
      });
    });

    it('should apply date range', async () => {
      mockPrismaClient.dailyStatistic.aggregate.mockResolvedValue({
        _sum: { totalTransactions: 500, totalAmount: 250000, totalCashback: 25000, totalCustomers: 250 },
      });
      mockPrismaClient.pharmacy.count.mockResolvedValue(10);
      mockPrismaClient.user.count.mockResolvedValue(200);
      mockPrismaClient.withdrawRequest.count.mockResolvedValue(5);

      const from = '2025-01-01';
      const to = '2025-06-30';
      const result = await service.getAdminOverview(from, to);

      expect(mockPrismaClient.dailyStatistic.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { date: { gte: new Date(from), lte: new Date(to) } },
        }),
      );
      expect(result.period).toEqual({ from, to });
    });

    it('should handle null aggregation values (return 0)', async () => {
      mockPrismaClient.dailyStatistic.aggregate.mockResolvedValue({
        _sum: { totalTransactions: null, totalAmount: null, totalCashback: null, totalCustomers: null },
      });
      mockPrismaClient.pharmacy.count.mockResolvedValue(0);
      mockPrismaClient.user.count.mockResolvedValue(0);
      mockPrismaClient.withdrawRequest.count.mockResolvedValue(0);

      const result = await service.getAdminOverview();

      expect(result.totalTransactions).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.totalCashback).toBe(0);
      expect(result.totalCustomers).toBe(0);
      expect(result.activePharmacies).toBe(0);
      expect(result.activeUsers).toBe(0);
      expect(result.pendingWithdraws).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // getTopPharmacies
  // ──────────────────────────────────────────────

  describe('getTopPharmacies', () => {
    it('should return top pharmacies without date range', async () => {
      const mockGroupBy = [
        { pharmacyId: 'p1', _sum: { totalTransactions: 100, totalAmount: 50000, totalCashback: 5000 } },
        { pharmacyId: 'p2', _sum: { totalTransactions: 50, totalAmount: 25000, totalCashback: 2500 } },
      ];

      const mockPharmacies = [
        { id: 'p1', name: 'Pharmacy One' },
        { id: 'p2', name: 'Pharmacy Two' },
      ];

      mockPrismaClient.dailyStatistic.groupBy.mockResolvedValue(mockGroupBy);
      mockPrismaClient.pharmacy.findMany.mockResolvedValue(mockPharmacies);

      const result = await service.getTopPharmacies();

      expect(mockPrismaClient.dailyStatistic.groupBy).toHaveBeenCalledWith({
        by: ['pharmacyId'],
        where: {},
        _sum: {
          totalTransactions: true,
          totalAmount: true,
          totalCashback: true,
        },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      });
      expect(mockPrismaClient.pharmacy.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['p1', 'p2'] } },
        select: { id: true, name: true },
      });
      expect(result).toEqual([
        { pharmacyId: 'p1', pharmacyName: 'Pharmacy One', totalTransactions: 100, totalAmount: 50000, totalCashback: 5000 },
        { pharmacyId: 'p2', pharmacyName: 'Pharmacy Two', totalTransactions: 50, totalAmount: 25000, totalCashback: 2500 },
      ]);
    });

    it('should apply date range and custom limit', async () => {
      mockPrismaClient.dailyStatistic.groupBy.mockResolvedValue([]);
      mockPrismaClient.pharmacy.findMany.mockResolvedValue([]);

      await service.getTopPharmacies(5, '2025-01-01', '2025-06-30');

      expect(mockPrismaClient.dailyStatistic.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { date: { gte: new Date('2025-01-01'), lte: new Date('2025-06-30') } },
          take: 5,
        }),
      );
    });

    it('should map unknown pharmacy names to "Unknown"', async () => {
      const mockGroupBy = [
        { pharmacyId: 'p1', _sum: { totalTransactions: 10, totalAmount: 1000, totalCashback: 100 } },
        { pharmacyId: 'p-missing', _sum: { totalTransactions: 5, totalAmount: 500, totalCashback: 50 } },
      ];

      mockPrismaClient.dailyStatistic.groupBy.mockResolvedValue(mockGroupBy);
      mockPrismaClient.pharmacy.findMany.mockResolvedValue([{ id: 'p1', name: 'Pharmacy One' }]);

      const result = await service.getTopPharmacies();

      expect(result).toEqual([
        { pharmacyId: 'p1', pharmacyName: 'Pharmacy One', totalTransactions: 10, totalAmount: 1000, totalCashback: 100 },
        { pharmacyId: 'p-missing', pharmacyName: 'Unknown', totalTransactions: 5, totalAmount: 500, totalCashback: 50 },
      ]);
    });

    it('should handle null sum values', async () => {
      const mockGroupBy = [
        { pharmacyId: 'p1', _sum: { totalTransactions: null, totalAmount: null, totalCashback: null } },
      ];

      mockPrismaClient.dailyStatistic.groupBy.mockResolvedValue(mockGroupBy);
      mockPrismaClient.pharmacy.findMany.mockResolvedValue([{ id: 'p1', name: 'Pharmacy One' }]);

      const result = await service.getTopPharmacies();

      expect(result[0].totalTransactions).toBe(0);
      expect(result[0].totalAmount).toBe(0);
      expect(result[0].totalCashback).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // getTransactionReport
  // ──────────────────────────────────────────────

  describe('getTransactionReport', () => {
    const mockData = [
      {
        id: 'tx-1',
        amount: 1000,
        createdAt: new Date('2025-06-15'),
        user: { id: 'u1', firstName: 'John', lastName: 'Doe', phone: '+998901234567' },
        pharmacy: { id: 'p1', name: 'Pharmacy One' },
        cashbacks: [{ id: 'cb-1', amount: 100, status: 'APPROVED' }],
      },
    ];

    it('should return paginated transactions without filters', async () => {
      mockPrismaClient.transaction.findMany.mockResolvedValue(mockData);
      mockPrismaClient.transaction.count.mockResolvedValue(1);

      const result = await service.getTransactionReport();

      expect(mockPrismaClient.transaction.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, phone: true } },
          pharmacy: { select: { id: true, name: true } },
          cashbacks: { select: { id: true, amount: true, status: true } },
        },
      });
      expect(mockPrismaClient.transaction.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({ data: mockData, total: 1, page: 1, limit: 100 });
    });

    it('should filter by pharmacyId', async () => {
      mockPrismaClient.transaction.findMany.mockResolvedValue([]);
      mockPrismaClient.transaction.count.mockResolvedValue(0);

      await service.getTransactionReport('pharmacy-1');

      expect(mockPrismaClient.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { pharmacyId: 'pharmacy-1' },
        }),
      );
    });

    it('should apply date range with createdAt', async () => {
      mockPrismaClient.transaction.findMany.mockResolvedValue([]);
      mockPrismaClient.transaction.count.mockResolvedValue(0);

      const from = '2025-06-01';
      const to = '2025-06-30';
      await service.getTransactionReport(undefined, from, to);

      expect(mockPrismaClient.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: new Date(from),
              lte: new Date(to),
            },
          },
        }),
      );
    });

    it('should respect custom page and limit', async () => {
      mockPrismaClient.transaction.findMany.mockResolvedValue([]);
      mockPrismaClient.transaction.count.mockResolvedValue(50);

      const result = await service.getTransactionReport(undefined, undefined, undefined, 3, 20);

      expect(mockPrismaClient.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20,
        }),
      );
      expect(result).toEqual({ data: [], total: 50, page: 3, limit: 20 });
    });

    it('should combine pharmacyId and date range filters', async () => {
      mockPrismaClient.transaction.findMany.mockResolvedValue([]);
      mockPrismaClient.transaction.count.mockResolvedValue(0);

      await service.getTransactionReport('pharmacy-1', '2025-01-01', '2025-12-31');

      expect(mockPrismaClient.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            pharmacyId: 'pharmacy-1',
            createdAt: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-12-31'),
            },
          },
        }),
      );
    });

    it('should handle empty result set', async () => {
      mockPrismaClient.transaction.findMany.mockResolvedValue([]);
      mockPrismaClient.transaction.count.mockResolvedValue(0);

      const result = await service.getTransactionReport();

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 100 });
    });
  });
});
