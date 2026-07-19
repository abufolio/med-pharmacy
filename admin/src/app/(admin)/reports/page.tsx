'use client';

import { useState, useCallback, useEffect } from 'react';
import { get } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';
import { ChartCard } from '@/components/shared/chart-card';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  BarChart3,
  Download,
  LineChart,
  ShoppingCart,
  Users,
  Calendar,
  Loader2,
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

// ── Types matching server responses ──
interface DailyStat {
  id: string;
  date: string;
  totalTransactions: number;
  totalAmount: number;
  totalCashback: number;
  totalCustomers: number;
  pharmacyId: string;
}

interface TopPharmacy {
  pharmacyId: string;
  pharmacyName: string;
  totalTransactions: number;
  totalAmount: number;
  totalCashback: number;
}

interface OverviewData {
  totalTransactions: number;
  totalAmount: number;
  totalCashback: number;
  totalCustomers: number;
  activePharmacies: number;
  activeUsers: number;
  pendingWithdraws: number;
}

const f = (n: number) => n.toLocaleString('uz-UZ');

// ── Page ──
export default function ReportsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [topPharmacies, setTopPharmacies] = useState<TopPharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  // ── Fetch ──
  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const [overviewRes, dailyRes, topRes] = await Promise.all([
        get<OverviewData>('/reports/overview', params).catch(() => null),
        get<{ data: DailyStat[] }>('/reports/daily', { ...params, limit: '31' }).catch(() => null),
        get<TopPharmacy[]>('/reports/top-pharmacies', { ...params, limit: '10' }).catch(() => null),
      ]);

      if (overviewRes?.data) setOverview(overviewRes.data);
      if (dailyRes?.data?.data) setDailyStats(dailyRes.data.data);
      if (topRes?.data) setTopPharmacies(topRes.data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Hisobotni yuklashda xatolik',
      );
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // ── Export as CSV (client-side) ──
  const handleExport = () => {
    if (!dailyStats.length) {
      toast.error('Eksport uchun maʼlumot yoʻq');
      return;
    }
    const header = 'Sana,Tranzaksiyalar,Daromad,Cashback,Yangi mijozlar\n';
    const rows = dailyStats
      .map((d) => `${d.date},${d.totalTransactions},${d.totalAmount},${d.totalCashback},${d.totalCustomers}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hisobot-${fromDate}-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Hisobot CSV formatida yuklandi');
  };

  // ── Daily stats columns ──
  const dailyColumns: ColumnDef<DailyStat>[] = [
    {
      accessorKey: 'date',
      header: 'Sana',
      cell: ({ row }) => (
        <span className="text-sm">
          {format(new Date(row.original.date), 'dd MMM', { locale: uz })}
        </span>
      ),
    },
    {
      accessorKey: 'totalTransactions',
      header: 'Tranzaksiyalar',
      cell: ({ row }) => <span className="font-medium">{row.original.totalTransactions}</span>,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Daromad',
      cell: ({ row }) => <span className="font-medium">{f(row.original.totalAmount)} soʻm</span>,
    },
    {
      accessorKey: 'totalCashback',
      header: 'Cashback',
      cell: ({ row }) => <span className="text-emerald-600">+{f(row.original.totalCashback)}</span>,
    },
    {
      accessorKey: 'totalCustomers',
      header: 'Yangi foyd.',
      cell: ({ row }) => <span>{row.original.totalCustomers}</span>,
    },
  ];

  // ── Top pharmacies columns ──
  const pharmacyColumns: ColumnDef<TopPharmacy>[] = [
    {
      accessorKey: 'pharmacyName',
      header: 'Dorixona',
      cell: ({ row }) => <span className="font-medium">{row.original.pharmacyName}</span>,
    },
    {
      accessorKey: 'totalTransactions',
      header: 'Tranzaksiyalar',
      cell: ({ row }) => <span>{row.original.totalTransactions}</span>,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Daromad',
      cell: ({ row }) => <span className="font-medium">{f(row.original.totalAmount)} soʻm</span>,
    },
    {
      accessorKey: 'totalCashback',
      header: 'Cashback',
      cell: ({ row }) => <span className="text-emerald-600">{f(row.original.totalCashback)}</span>,
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Hisobotlar" description="Analitika va hisobotlar" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-10 w-10 text-destructive mb-3" />
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchReport}>
              Qayta urinish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hisobotlar"
        description="Analitika va hisobotlar"
        action={{
          label: 'CSV eksport',
          onClick: handleExport,
          icon: <Download className="h-4 w-4" />,
          variant: 'outline',
          disabled: isLoading,
        }}
      />

      {/* Date Range */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
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
        <Button variant="default" size="sm" className="h-9" onClick={fetchReport} disabled={isLoading}>
          {isLoading ? 'Yuklanmoqda...' : 'Yangilash'}
        </Button>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Hisobot yuklanmoqda...</span>
        </div>
      ) : overview ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ChartCard title="Jami tranzaksiyalar">
              <p className="text-2xl font-bold">{f(overview.totalTransactions)}</p>
            </ChartCard>
            <ChartCard title="Jami daromad">
              <p className="text-2xl font-bold text-emerald-600">{f(overview.totalAmount)} soʻm</p>
            </ChartCard>
            <ChartCard title="Jami cashback">
              <p className="text-2xl font-bold text-blue-600">{f(overview.totalCashback)} soʻm</p>
            </ChartCard>
            <ChartCard title="Faol dorixonalar">
              <p className="text-2xl font-bold">{overview.activePharmacies}</p>
            </ChartCard>
            <ChartCard title="Jami mijozlar">
              <p className="text-2xl font-bold">{f(overview.totalCustomers)}</p>
            </ChartCard>
            <ChartCard title="Faol foydalanuvchilar">
              <p className="text-2xl font-bold">{f(overview.activeUsers)}</p>
            </ChartCard>
            <ChartCard title="Kutilayotgan yechib olish">
              <p className="text-2xl font-bold">{overview.pendingWithdraws}</p>
            </ChartCard>
            <ChartCard title="Kunlik oʻrtacha">
              <p className="text-2xl font-bold">
                {dailyStats.length > 0
                  ? Math.round(overview.totalTransactions / dailyStats.length)
                  : 0}
              </p>
            </ChartCard>
          </div>

          {/* Tables */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  Kunlik statistika
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={dailyColumns}
                  data={dailyStats}
                  isLoading={false}
                  pageCount={1}
                  pageIndex={0}
                  pageSize={dailyStats.length}
                  onPageChange={() => {}}
                  onPageSizeChange={() => {}}
                  emptyMessage="Maʼlumot yoʻq"
                  emptyDescription="Tanlangan davrda tranzaksiyalar mavjud emas"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Top dorixonalar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={pharmacyColumns}
                  data={topPharmacies}
                  isLoading={false}
                  pageCount={1}
                  pageIndex={0}
                  pageSize={topPharmacies.length}
                  onPageChange={() => {}}
                  onPageSizeChange={() => {}}
                  emptyMessage="Dorixona topilmadi"
                  emptyDescription="Dorixonalar boʻyicha maʼlumot yoʻq"
                />
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
