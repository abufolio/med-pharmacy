import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { RequestWithdrawDto, ReviewWithdrawDto } from './dto/withdraw.dto';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditHelper,
  ) {}

  // ──────────────────────────────────────────────
  // Wallet Balance
  // ──────────────────────────────────────────────

  async getBalance(userId: string) {
    const wallet = await this.prisma.client.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      return { balance: 0, userId };
    }
    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  async getTransactionHistory(userId: string, page = 1, limit = 50) {
    const wallet = await this.prisma.client.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      return { data: [], total: 0, page, limit };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.client.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.walletTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return { data, total, page, limit };
  }

  // ──────────────────────────────────────────────
  // Withdraw Requests
  // ──────────────────────────────────────────────

  async requestWithdraw(userId: string, dto: RequestWithdrawDto) {
    const wallet = await this.prisma.client.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new BadRequestException('Wallet is empty');
    if (Number(wallet.balance) < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const request = await this.prisma.client.withdrawRequest.create({
      data: {
        userId,
        amount: dto.amount,
      },
    });

    this.audit.log('WITHDRAW_REQUESTED', 'withdraw_request', request.id, undefined, {
      userId,
      amount: dto.amount,
    });

    return request;
  }

  async getWithdrawRequests(userId?: string, page = 1, limit = 50) {
    const where = userId ? { userId } : {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.client.withdrawRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      }),
      this.prisma.client.withdrawRequest.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async reviewWithdraw(id: string, reviewerId: string, dto: ReviewWithdrawDto) {
    const request = await this.prisma.client.withdrawRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Withdraw request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Withdraw request already reviewed');
    }

    // If approving, debit wallet
    if (dto.status === 'APPROVED' || dto.status === 'PAID') {
      await this.prisma.client.$transaction(async (tx: any) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId: request.userId },
        });
        if (!wallet || Number(wallet.balance) < Number(request.amount)) {
          throw new BadRequestException('Insufficient balance to process withdraw');
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: request.amount } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'DEBIT',
            amount: request.amount,
            referenceType: 'withdraw',
            referenceId: request.id,
            description: `Withdraw: ${dto.status}`,
          },
        });

        await tx.withdrawRequest.update({
          where: { id },
          data: {
            status: dto.status,
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
          },
        });
      });
    } else {
      // Just mark as rejected
      await this.prisma.client.withdrawRequest.update({
        where: { id },
        data: {
          status: dto.status,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
      });
    }

    this.audit.log(`WITHDRAW_${dto.status}`, 'withdraw_request', id, undefined, {
      reviewerId,
      amount: Number(request.amount),
    });

    return { message: `Withdraw request ${dto.status.toLowerCase()}` };
  }
}
