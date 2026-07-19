'use client';

import { useState, useCallback, useEffect } from 'react';
import { get, post, patch } from '@/lib/api/client';
import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Phone } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

// ── Types ──
interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  telegramId: string | number;
  language: string;
  status: string;
  createdAt: string;
  // Detail-only (not in list)
  wallet?: { balance: number };
  transactions?: { id: string; amount: number; status: string; createdAt: string }[];
}

// ── Page ──
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [detail, setDetail] = useState<User | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ── Fetch ──
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      const res = await get<{ data: User[]; total: number; page: number; limit: number }>(
        '/users',
        params,
      );
      setUsers(res.data.data);
      setTotal(res.data.total);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Foydalanuvchilarni yuklashda xatolik',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Columns ──
  const columns: ColumnDef<User>[] = [
    {
      id: 'name',
      header: 'F.I.O',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
            {row.original.firstName[0]}{row.original.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-sm">
              {row.original.firstName} {row.original.lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              @{row.original.telegramId}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Telefon',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.phone}</span>
      ),
    },
    {
      accessorKey: 'language',
      header: 'Til',
      cell: ({ row }) => (
        <Badge variant="outline" className="uppercase text-xs">
          {row.original.language || 'uz'}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Holat',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Roʻyxatdan oʻtgan',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy', { locale: uz })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setDetail(row.original); setDetailOpen(true); }}
        >
          Batafsil
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Foydalanuvchilar"
        description="Barcha mijozlar roʻyxati, ularning kartalari va balanslari"
      />

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        error={error}
        pageCount={Math.ceil(total / limit)}
        pageIndex={page - 1}
        pageSize={limit}
        onPageChange={(p) => setPage(p + 1)}
        onPageSizeChange={(s) => { setLimit(s); setPage(1); }}
        searchable
        searchQuery={search}
        searchPlaceholder="Ism, familiya yoki telefon..."
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onRetry={fetchUsers}
        emptyMessage="Foydalanuvchi topilmadi"
        emptyDescription="Telegram Bot orqali roʻyxatdan oʻtganlar bu yerda koʻrinadi"
      />

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {detail?.firstName} {detail?.lastName}
            </DialogTitle>
            <DialogDescription>Foydalanuvchi haqida batafsil maʼlumot</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={detail.status} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Telefon</p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {detail.phone}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Telegram ID</p>
                  <p className="font-mono text-xs">{detail.telegramId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Til</p>
                  <p>{detail.language === 'uz' ? 'Oʻzbek' : detail.language === 'ru' ? 'Русский' : 'English'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Balans</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {Number(detail.wallet?.balance ?? 0).toLocaleString('uz-UZ')} soʻm
                  </p>
                </div>
              </div>

              {detail.wallet && (
                <Separator />
              )}
              {detail.transactions && detail.transactions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Oxirgi tranzaksiyalar</h4>
                  <div className="space-y-1">
                    {detail.transactions.slice(0, 5).map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-sm">
                        <span>{Number(t.amount).toLocaleString('uz-UZ')} soʻm</span>
                        <StatusBadge status={t.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />
              <p className="text-xs text-muted-foreground">
                Roʻyxatdan oʻtgan:{' '}
                {format(new Date(detail.createdAt), 'dd MMM yyyy, HH:mm', { locale: uz })}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
