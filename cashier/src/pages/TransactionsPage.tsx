import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/loader';
import { ArrowLeft, ArrowLeftRight, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Transaction } from '@/types';

const PAGE_SIZE = 20;

export function TransactionsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await transactionApi.list({ page, limit: PAGE_SIZE });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="iconSm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base font-semibold text-slate-900">Tranzaksiyalar</h1>
              <p className="text-xs text-slate-500">{total} ta yozuv</p>
            </div>
          </div>
          <Button variant="ghost" size="iconSm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 page-enter">
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <PageLoader />
            ) : data.length === 0 ? (
              <div className="text-center py-16">
                <ArrowLeftRight className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Tranzaksiyalar mavjud emas</p>
                <p className="text-sm text-slate-400 mt-1">Hali hech qanday tranzaksiya amalga oshirilmagan</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/scan')}>
                  Yangi tranzaksiya
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {/* Table header - hidden on mobile */}
                <div className="hidden sm:flex items-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <div className="flex-1">Mijoz</div>
                  <div className="w-28 text-right">Summa</div>
                  <div className="w-24 text-center">Status</div>
                  <div className="w-32 text-right">Sana</div>
                </div>

                {/* Rows */}
                {data.map((tx, idx) => (
                  <div
                    key={tx.id}
                    className="px-5 py-4 hover:bg-slate-50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${idx * 0.03}s` }}
                  >
                    {/* Mobile layout */}
                    <div className="sm:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                            <ArrowLeftRight className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-slate-900 text-sm">
                            {tx.user?.firstName} {tx.user?.lastName}
                          </span>
                        </div>
                        <Badge variant={getStatusColor(tx.status) as any} size="sm">
                          {getStatusLabel(tx.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pl-10">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(tx.amount)}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(tx.createdAt)}</span>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden sm:flex items-center">
                      <div className="flex-1 flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                          <ArrowLeftRight className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {tx.user?.firstName} {tx.user?.lastName}
                          </p>
                          {tx.pharmacy && (
                            <p className="text-xs text-slate-500 truncate">{tx.pharmacy.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="w-28 text-right">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                      <div className="w-24 text-center">
                        <Badge variant={getStatusColor(tx.status) as any} size="sm">
                          {getStatusLabel(tx.status)}
                        </Badge>
                      </div>
                      <div className="w-32 text-right text-sm text-slate-500">
                        {formatDate(tx.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                {total} tadan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} koʻrsatilmoqda
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="iconSm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600 px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="iconSm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
