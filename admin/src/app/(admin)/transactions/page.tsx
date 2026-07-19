'use client';

import { useState, useCallback, useEffect } from 'react';
import { get, post } from '@/lib/api/client';
import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

// ── Types ──
interface Transaction {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; phone: string };
  pharmacy: { id: string; name: string };
  employee?: { id: string; fullName: string } | null;
  card?: { uid: string } | null;
  cashback?: { amount: number; status: string } | null;
}

const f = (n: number) => n.toLocaleString('uz-UZ');

// ── Page ──
export default function TransactionsPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Reverse
  const [reverseTx, setReverseTx] = useState<Transaction | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [reversing, setReversing] = useState(false);

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page: String(page), limit: String(limit) };
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await get<{ data: Transaction[]; total: number; page: number; limit: number }>(
        '/transactions',
        params,
      );
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message || 'Tranzaksiyalarni yuklashda xatolik',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Reverse ──
  const handleReverse = async () => {
    if (!reverseTx || !reverseReason.trim()) {
      toast.error('Bekor qilish sababini kiriting');
      return;
    }
    setReversing(true);
    try {
      await post(`/transactions/${reverseTx.id}/reverse`, { reason: reverseReason });
      toast.success('Tranzaksiya bekor qilindi');
      setReverseTx(null);
      setReverseReason('');
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Bekor qilishda xatolik',
      );
    } finally {
      setReversing(false);
    }
  };

  // ── Columns ──
  const columns: ColumnDef<Transaction>[] = [
    {
      id: 'user',
      header: 'Mijoz',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">
            {row.original.user.firstName} {row.original.user.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{row.original.user.phone}</p>
        </div>
      ),
    },
    {
      id: 'pharmacy',
      header: 'Dorixona',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.pharmacy.name}</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Summa',
      cell: ({ row }) => (
        <span className="font-medium">{f(Number(row.original.amount))} soʻm</span>
      ),
    },
    {
      id: 'cashback',
      header: 'Cashback',
      cell: ({ row }) => {
        const cb = row.original.cashback;
        return cb ? (
          <span className="text-emerald-600 font-medium">+{f(Number(cb.amount))}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Holat',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Vaqt',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.original.createdAt), 'dd MMM HH:mm', { locale: uz })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        if (row.original.status !== 'COMPLETED') return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-destructive"
            onClick={() => {
              setReverseTx(row.original);
              setReverseReason('');
            }}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Bekor qilish
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Tranzaksiyalar" description="Barcha tranzaksiyalar tarixi" />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground shrink-0">Holat:</Label>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Barchasi</option>
            <option value="COMPLETED">Bajarilgan</option>
            <option value="REVERSED">Bekor qilingan</option>
            <option value="PENDING">Kutilmoqda</option>
            <option value="FAILED">Xatolik</option>
            <option value="FLAGGED">Shubhali</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground shrink-0">Dan:</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground shrink-0">Gacha:</Label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => {
            setStatusFilter('');
            setFromDate('');
            setToDate('');
            setPage(1);
          }}
        >
          Filtrlarni tozalash
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        error={error}
        pageCount={Math.ceil(total / limit)}
        pageIndex={page - 1}
        pageSize={limit}
        onPageChange={(p) => setPage(p + 1)}
        onPageSizeChange={(s) => { setLimit(s); setPage(1); }}
        onRetry={fetchData}
        emptyMessage="Tranzaksiya topilmadi"
        emptyDescription="Filtrlarni oʻzgartirib koʻring"
      />

      {/* Reverse Dialog */}
      <Dialog open={!!reverseTx} onOpenChange={() => setReverseTx(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tranzaksiyani bekor qilish</DialogTitle>
            <DialogDescription>
              {reverseTx &&
                `${f(Number(reverseTx.amount))} soʻm — ${reverseTx.user.firstName} ${reverseTx.user.lastName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bekor qilish sababi</Label>
              <Input
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                placeholder="Sababni kiriting..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReverseTx(null)}>
                Bekor qilish
              </Button>
              <Button
                variant="destructive"
                onClick={handleReverse}
                disabled={reversing || !reverseReason.trim()}
              >
                {reversing ? 'Bekor qilinmoqda...' : 'Tranzaksiyani bekor qilish'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
