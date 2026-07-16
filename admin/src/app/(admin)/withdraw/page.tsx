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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Wallet } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

// ── Types ──
interface WithdrawRequest {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  reviewedAt?: string | null;
  user: { id: string; firstName: string; lastName: string; phone: string; balance: number };
  reviewedBy?: { id: string; fullName: string } | null;
}

const f = (n: number) => n.toLocaleString('uz-UZ');

// ── Page ──
export default function WithdrawPage() {
  const [data, setData] = useState<WithdrawRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  // Action
  const [actionItem, setActionItem] = useState<WithdrawRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page: String(page), limit: String(limit) };
      if (statusFilter) params.status = statusFilter;

      const res = await get<{ data: WithdrawRequest[]; total: number; page: number; limit: number }>(
        '/wallets/withdraw-requests',
        params,
      );
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Soʻrovlarni yuklashda xatolik',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Approve / Reject ──
  const handleAction = async () => {
    if (!actionItem) return;
    setProcessing(true);
    try {
      await post(`/wallets/withdraw-requests/${actionItem.id}/review`, {
        status: actionType,
        reason: comment.trim() || undefined,
      });
      toast.success(
        actionType === 'APPROVED' ? 'Soʻrov tasdiqlandi' : 'Soʻrov rad etildi',
      );
      setActionItem(null);
      setComment('');
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Xatolik yuz berdi',
      );
    } finally {
      setProcessing(false);
    }
  };

  // ── Columns ──
  const columns: ColumnDef<WithdrawRequest>[] = [
    {
      id: 'user',
      header: 'Foydalanuvchi',
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
      accessorKey: 'amount',
      header: 'Soʻm',
      cell: ({ row }) => (
        <span className="font-medium">{f(Number(row.original.amount))} soʻm</span>
      ),
    },
    {
      id: 'balance',
      header: 'Balans',
      cell: ({ row }) => (
        <span className="text-sm">{f(Number(row.original.user.balance))} soʻm</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Holat',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Soʻrov vaqti',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy HH:mm', { locale: uz })}
        </span>
      ),
    },
    {
      id: 'reviewed',
      header: 'Koʻrib chiqilgan',
      cell: ({ row }) => {
        if (!row.original.reviewedAt) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <span className="text-xs text-muted-foreground">
            {format(new Date(row.original.reviewedAt), 'dd MMM yyyy HH:mm', { locale: uz })}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        if (row.original.status !== 'PENDING') return null;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-emerald-600"
              onClick={() => {
                setActionItem(row.original);
                setActionType('APPROVED');
                setComment('');
              }}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Tasdiqlash
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive"
              onClick={() => {
                setActionItem(row.original);
                setActionType('REJECTED');
                setComment('');
              }}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Rad etish
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yechib olish soʻrovlari"
        description="Foydalanuvchilarning cashback yechib olish soʻrovlarini boshqarish"
      />

      {/* Status tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        {['PENDING', 'APPROVED', 'REJECTED', 'PAID', ''].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className="rounded-full"
          >
            {s === '' ? 'Barchasi' : s === 'PENDING' ? 'Kutilmoqda' : s === 'APPROVED' ? 'Tasdiqlangan' : s === 'REJECTED' ? 'Rad etilgan' : 'Toʻlangan'}
          </Button>
        ))}
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
        emptyMessage="Soʻrov topilmadi"
        emptyDescription={
          statusFilter === 'PENDING'
            ? 'Barcha soʻrovlar koʻrib chiqilgan'
            : 'Bu holatdagi soʻrovlar mavjud emas'
        }
      />

      {/* Action Dialog */}
      <Dialog open={!!actionItem} onOpenChange={() => setActionItem(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'APPROVED' ? 'Soʻrovni tasdiqlash' : 'Soʻrovni rad etish'}
            </DialogTitle>
            <DialogDescription>
              {actionItem &&
                `${actionItem.user.firstName} ${actionItem.user.lastName} — ${f(Number(actionItem.amount))} soʻm`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Foydalanuvchi balansi</p>
              <p className="text-lg font-bold">
                {actionItem ? f(Number(actionItem.user.balance)) : ''} soʻm
              </p>
            </div>
            <div>
              <Label>Izoh (ixtiyoriy)</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tasdiqlash/rad etish sababi..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionItem(null)}>
                Bekor qilish
              </Button>
              <Button
                variant={actionType === 'APPROVED' ? 'default' : 'destructive'}
                onClick={handleAction}
                disabled={processing}
              >
                {processing
                  ? 'Bajarilmoqda...'
                  : actionType === 'APPROVED'
                    ? 'Tasdiqlash'
                    : 'Rad etish'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
