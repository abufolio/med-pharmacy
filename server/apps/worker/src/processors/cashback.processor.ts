import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@server/database';
import { Queues, CashbackJob } from '@server/queue';

@Processor(Queues.CASHBACK)
export class CashbackProcessor extends WorkerHost {
  private readonly logger = new Logger(CashbackProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<CashbackJob>): Promise<void> {
    const { transactionId, userId, pharmacyId, amount } = job.data;

    try {
      // Find active rule
      const rule = await this.prisma.client.cashbackRule.findFirst({
        where: { pharmacyId, isActive: true, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      if (!rule) {
        this.logger.debug(`No active cashback rule for pharmacy ${pharmacyId}`);
        return;
      }

      // Calculate cashback
      let cashbackAmount = 0;
      const value = Number(rule.value);
      const maxCashback = rule.maxCashback ? Number(rule.maxCashback) : null;

      if (amount >= Number(rule.minPurchase)) {
        switch (rule.type) {
          case 'PERCENT': {
            const calc = amount * (value / 100);
            cashbackAmount = maxCashback ? Math.min(calc, maxCashback) : Math.round(calc * 100) / 100;
            break;
          }
          case 'FIXED':
            cashbackAmount = value;
            break;
          case 'CAMPAIGN':
            cashbackAmount = maxCashback || value;
            break;
        }
      }

      if (cashbackAmount <= 0) return;

      // Atomic transaction
      await this.prisma.client.$transaction(async (tx: any) => {
        const cashback = await tx.cashback.create({
          data: { transactionId, userId, amount: cashbackAmount },
        });

        const wallet = await tx.wallet.upsert({
          where: { userId },
          create: { userId, balance: cashbackAmount },
          update: { balance: { increment: cashbackAmount } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'CREDIT',
            amount: cashbackAmount,
            referenceType: 'cashback',
            referenceId: cashback.id,
          },
        });
      });

      this.logger.debug(`Cashback ${cashbackAmount} credited to user ${userId} (tx: ${transactionId})`);
    } catch (error) {
      this.logger.error(`Cashback processing failed: ${error}`);
      throw error;
    }
  }
}
