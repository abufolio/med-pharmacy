import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { PageLoader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToastStore } from '@/components/ui/toast';
import { formatDateShort, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils';
import { RotateCcw, Eye } from 'lucide-react';
import type { Transaction } from '@/types';

export function TransactionListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page],
    queryFn: () => transactionApi.list({ page, limit: 20 }),
  });

  const reverseMutation = useMutation({
    mutationFn: (id: string) => transactionApi.reverse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      addToast('Transaction reversed', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
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

      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} className="max-w-sm" placeholder="Search by ID..." />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('transaction.id')}</TableHead>
                <TableHead>{t('user.firstName')}</TableHead>
                <TableHead>{t('transaction.amount')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead className="w-[120px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell><code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{tx.id.slice(0, 8)}...</code></TableCell>
                  <TableCell className="font-medium">{tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : '—'}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(tx.status) as any}>{getStatusLabel(tx.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDateShort(tx.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedTx(tx); setDetailOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {tx.status === 'COMPLETED' && (
                        <Button variant="ghost" size="sm" onClick={() => {
                          if (confirm('Reverse this transaction?')) reverseMutation.mutate(tx.id);
                        }}>
                          <RotateCcw className="h-4 w-4 text-warning" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">{t('common.noData')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {total > 20 && <Pagination page={page} total={total} limit={20} onPageChange={setPage} />}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('transaction.detail')}</DialogTitle></DialogHeader>
          {selectedTx && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">{t('transaction.id')}:</span><p className="font-medium font-mono text-xs">{selectedTx.id}</p></div>
                <div><span className="text-slate-500">{t('transaction.amount')}:</span><p className="font-medium text-lg text-primary-600">{formatCurrency(selectedTx.amount)}</p></div>
                <div><span className="text-slate-500">{t('common.status')}:</span><Badge variant={getStatusColor(selectedTx.status) as any}>{getStatusLabel(selectedTx.status)}</Badge></div>
                <div><span className="text-slate-500">{t('common.date')}:</span><p className="font-medium">{formatDateShort(selectedTx.createdAt)}</p></div>
                {selectedTx.user && (
                  <>
                    <div><span className="text-slate-500">{t('user.firstName')}:</span><p className="font-medium">{selectedTx.user.firstName} {selectedTx.user.lastName}</p></div>
                    <div><span className="text-slate-500">{t('user.phone')}:</span><p className="font-medium">{selectedTx.user.phone}</p></div>
                  </>
                )}
                {selectedTx.pharmacy && (
                  <div className="col-span-2"><span className="text-slate-500">{t('pharmacy.name')}:</span><p className="font-medium">{selectedTx.pharmacy.name}</p></div>
                )}
              </div>
              {selectedTx.status === 'COMPLETED' && (
                <Button variant="destructive" className="w-full" onClick={() => {
                  if (confirm('Reverse this transaction?')) {
                    reverseMutation.mutate(selectedTx.id);
                    setDetailOpen(false);
                  }
                }}>
                  <RotateCcw className="h-4 w-4" /> {t('transaction.reverse')}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
