import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { transactionApi } from '@/lib/api-services';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { PageLoader } from '@/components/ui/loader';
import { formatDateShort, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils';

export function EmployeeTransactionPage() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['employee-transactions', page],
    queryFn: () => transactionApi.list({ page, limit: 20 }),
  });

  if (isLoading) return <PageLoader />;

  const transactions = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('transaction.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{total} {t('common.items')}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('user.firstName')}</TableHead>
                <TableHead>{t('transaction.amount')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : '—'}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                  <TableCell><Badge variant={getStatusColor(tx.status) as any}>{getStatusLabel(tx.status)}</Badge></TableCell>
                  <TableCell className="text-slate-500">{formatDateShort(tx.createdAt)}</TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">{t('common.noData')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {total > 20 && <Pagination page={page} total={total} limit={20} onPageChange={setPage} />}
      </Card>
    </div>
  );
}
