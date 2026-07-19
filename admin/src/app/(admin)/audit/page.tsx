'use client';

import { useState, useCallback, useEffect } from 'react';
import { get } from '@/lib/api/client';
import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { ChartCard } from '@/components/shared/chart-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Download, Eye, Search } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

// ── Types ──
interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  actorType: string;
  actorId: string;
  actorName?: string;
  metadata: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  LOGIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  REVERSE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  APPROVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECT: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  BLOCK: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  ASSIGN: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  EXPORT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Yaratish',
  UPDATE: 'Tahrirlash',
  DELETE: 'Oʻchirish',
  LOGIN: 'Kirish',
  LOGOUT: 'Chiqish',
  REVERSE: 'Bekor qilish',
  APPROVE: 'Tasdiqlash',
  REJECT: 'Rad etish',
  BLOCK: 'Bloklash',
  ASSIGN: 'Biriktirish',
  EXPORT: 'Eksport',
};

const ENTITY_GROUPS = [
  { value: '', label: 'Barcha tur' },
  { value: 'USER', label: 'Foydalanuvchi' },
  { value: 'PHARMACY', label: 'Dorixona' },
  { value: 'TRANSACTION', label: 'Tranzaksiya' },
  { value: 'CARD', label: 'Karta' },
  { value: 'CASHBACK_RULE', label: 'Cashback qoidasi' },
  { value: 'PROMOCODE', label: 'Promokod' },
  { value: 'WITHDRAW_REQUEST', label: 'Yechib olish' },
  { value: 'ROLE', label: 'Rol' },
  { value: 'SETTINGS', label: 'Sozlamalar' },
];

const ACTION_FILTERS = [
  { value: '', label: 'Barcha harakat' },
  { value: 'CREATE', label: 'Yaratish' },
  { value: 'UPDATE', label: 'Tahrirlash' },
  { value: 'DELETE', label: 'Oʻchirish' },
  { value: 'LOGIN', label: 'Kirish' },
  { value: 'APPROVE', label: 'Tasdiqlash' },
  { value: 'REJECT', label: 'Rad etish' },
  { value: 'REVERSE', label: 'Bekor qilish' },
  { value: 'BLOCK', label: 'Bloklash' },
];

// ── Page ──
export default function AuditPage() {
  const [data, setData] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail
  const [detail, setDetail] = useState<AuditEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page: String(page), limit: String(limit) };
      if (entityFilter) params.entity = entityFilter;
      if (actionFilter) params.action = actionFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (searchQuery) params.actorId = searchQuery;

      const res = await get<{ data: AuditEntry[]; total: number; page: number; limit: number }>(
        '/audit',
        params,
      );
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Audit loglarni yuklashda xatolik',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, entityFilter, actionFilter, fromDate, toDate, searchQuery]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Export CSV ──
  const handleExport = () => {
    toast.success('Audit log eksport qilinmoqda... (funksiya ishlab chiqilmoqda)');
  };

  // ── Columns ──
  const columns: ColumnDef<AuditEntry>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Vaqt',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(row.original.createdAt), 'dd.MM.yyyy HH:mm:ss', { locale: uz })}
        </span>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Harakat',
      cell: ({ row }) => {
        const action = row.original.action;
        return (
          <Badge className={ACTION_COLORS[action] || 'bg-gray-100 text-gray-800'}>
            {ACTION_LABELS[action] || action}
          </Badge>
        );
      },
    },
    {
      id: 'entity',
      header: 'Ob\'ekt',
      cell: ({ row }) => (
        <div>
          <span className="text-sm font-medium">{row.original.entity}</span>
          <p className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">{row.original.entityId}</p>
        </div>
      ),
    },
    {
      id: 'actor',
      header: 'Kim',
      cell: ({ row }) => (
        <div>
          <span className="text-sm">{row.original.actorName || row.original.actorId.slice(0, 8) + '...'}</span>
          <p className="text-xs text-muted-foreground">{row.original.actorType}</p>
        </div>
      ),
    },
    {
      id: 'details',
      header: '',
      cell: ({ row }) => {
        if (!row.original.metadata) return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => { setDetail(row.original); setDetailOpen(true); }}
          >
            <Eye className="h-3 w-3 mr-1" />
            Batafsil
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Tizimdagi barcha muhim harakatlar logi"
        action={{
          label: 'Eksport CSV',
          onClick: handleExport,
          icon: <Download className="h-4 w-4" />,
          variant: 'outline',
        }}
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <ChartCard title="Jami yozuvlar">
          <p className="text-2xl font-bold">{total}</p>
        </ChartCard>
        <ChartCard title="Bugun">
          <p className="text-2xl font-bold">
            {data.filter((r) => format(new Date(r.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length}
          </p>
        </ChartCard>
        <ChartCard title="Soʻnggi 7 kun">
          <p className="text-2xl font-bold">
            {data.filter((r) => {
              const d = new Date(r.createdAt);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return d >= weekAgo;
            }).length}
          </p>
        </ChartCard>
        <ChartCard title="Tahrirlashlar">
          <p className="text-2xl font-bold">{data.filter((r) => r.action === 'UPDATE').length}</p>
        </ChartCard>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground shrink-0">Ob\'ekt:</Label>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          >
            {ENTITY_GROUPS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground shrink-0">Harakat:</Label>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          >
            {ACTION_FILTERS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground shrink-0">Dan:</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground shrink-0">Gacha:</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Actor ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="h-9 w-48"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => {
            setEntityFilter('');
            setActionFilter('');
            setFromDate('');
            setToDate('');
            setSearchQuery('');
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
        emptyMessage="Audit log topilmadi"
        emptyDescription="Filtrlarni oʻzgartirib koʻring"
      />

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Audit yozuvi tafsilotlari</DialogTitle>
            <DialogDescription>
              {detail && format(new Date(detail.createdAt), 'dd.MM.yyyy HH:mm:ss', { locale: uz })}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs">Harakat</p>
                  <Badge className={ACTION_COLORS[detail.action] || ''}>
                    {ACTION_LABELS[detail.action] || detail.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Ob\'ekt</p>
                  <p className="font-medium">{detail.entity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Ob\'ekt ID</p>
                  <p className="font-mono text-xs">{detail.entityId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Actor</p>
                  <p>{detail.actorName || detail.actorId.slice(0, 12) + '...'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Actor turi</p>
                  <p>{detail.actorType}</p>
                </div>
                {detail.ipAddress && (
                  <div>
                    <p className="text-muted-foreground text-xs">IP manzil</p>
                    <p className="font-mono text-xs">{detail.ipAddress}</p>
                  </div>
                )}
              </div>

              {detail.metadata && Object.keys(detail.metadata).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-xs mb-2">Metadata</p>
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-48">
                      {JSON.stringify(detail.metadata, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
