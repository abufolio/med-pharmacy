import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@server/database';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // Daily Statistics
  // ──────────────────────────────────────────────

  async getDailyStats(
    pharmacyId: string,
    from?: string,
    to?: string,
    page = 1,
    limit = 31,
  ) {
    const where: any = { pharmacyId };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.client.dailyStatistic.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.client.dailyStatistic.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getPharmacySummary(pharmacyId: string, from?: string, to?: string) {
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const where: any = { pharmacyId };
    if (from || to) where.date = dateFilter;

    const aggregation = await this.prisma.client.dailyStatistic.aggregate({
      where,
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

    const days = await this.prisma.client.dailyStatistic.count({ where });

    return {
      pharmacyId,
      period: { from: from || 'all', to: to || 'all' },
      days,
      totalTransactions: aggregation._sum.totalTransactions || 0,
      totalAmount: aggregation._sum.totalAmount || 0,
      totalCashback: aggregation._sum.totalCashback || 0,
      totalCustomers: aggregation._sum.totalCustomers || 0,
      avgTransactionAmount: aggregation._avg.totalAmount || 0,
    };
  }

  // ──────────────────────────────────────────────
  // Admin Overview
  // ──────────────────────────────────────────────

  async getAdminOverview(from?: string, to?: string) {
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const where: any = {};
    if (from || to) where.date = dateFilter;

    const aggregation = await this.prisma.client.dailyStatistic.aggregate({
      where,
      _sum: {
        totalTransactions: true,
        totalAmount: true,
        totalCashback: true,
        totalCustomers: true,
      },
    });

    const [pharmacies, activeUsers, pendingWithdraws] = await Promise.all([
      this.prisma.client.pharmacy.count({ where: { deletedAt: null } }),
      this.prisma.client.user.count({ where: { status: { not: 'BLOCKED' }, deletedAt: null } }),
      this.prisma.client.withdrawRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      period: { from: from || 'all', to: to || 'all' },
      totalTransactions: aggregation._sum.totalTransactions || 0,
      totalAmount: aggregation._sum.totalAmount || 0,
      totalCashback: aggregation._sum.totalCashback || 0,
      totalCustomers: aggregation._sum.totalCustomers || 0,
      activePharmacies: pharmacies,
      activeUsers,
      pendingWithdraws,
    };
  }

  async getTopPharmacies(limit = 10, from?: string, to?: string) {
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const where: any = {};
    if (from || to) where.date = dateFilter;

    // Group by pharmacy and sum
    const stats = await this.prisma.client.dailyStatistic.groupBy({
      by: ['pharmacyId'],
      where,
      _sum: {
        totalTransactions: true,
        totalAmount: true,
        totalCashback: true,
      },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    });

    // Fetch pharmacy names
    const pharmacyIds: string[] = stats.map((s: { pharmacyId: string }) => s.pharmacyId);
    const pharmacies = await this.prisma.client.pharmacy.findMany({
      where: { id: { in: pharmacyIds } },
      select: { id: true, name: true },
    });

    const pharmacyMap = new Map(pharmacies.map((p: { id: string; name: string }) => [p.id, p.name]));

    return stats.map((s: { pharmacyId: string; _sum: { totalTransactions: number | null; totalAmount: number | null; totalCashback: number | null } }) => ({
      pharmacyId: s.pharmacyId,
      pharmacyName: pharmacyMap.get(s.pharmacyId) || 'Unknown',
      totalTransactions: s._sum.totalTransactions || 0,
      totalAmount: s._sum.totalAmount || 0,
      totalCashback: s._sum.totalCashback || 0,
    }));
  }

  // ──────────────────────────────────────────────
  // Raw Transaction Reports (for CSV export etc.)
  // ──────────────────────────────────────────────

  async getTransactionReport(
    pharmacyId?: string,
    from?: string,
    to?: string,
    page = 1,
    limit = 100,
  ) {
    const where: any = {};
    if (pharmacyId) where.pharmacyId = pharmacyId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.client.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, phone: true } },
          pharmacy: { select: { id: true, name: true } },
          cashbacks: { select: { id: true, amount: true, status: true } },
        },
      }),
      this.prisma.client.transaction.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
