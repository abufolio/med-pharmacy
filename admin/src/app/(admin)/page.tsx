'use client';

import { useState, useEffect, useCallback } from 'react';
import { get } from '@/lib/api/client';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  Users,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Wallet,
  Percent,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ── Types matching server responses ──
interface AdminOverview {
  totalTransactions: number;
  totalAmount: number;
  totalCashback: number;
  totalCustomers: number;
  activePharmacies: number;
  activeUsers: number;
  pendingWithdraws: number;
  period: { from: string; to: string };
}

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

interface RecentTx {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; phone: string };
  pharmacy: { id: string; name: string };
  cashbacks: { id: string; amount: number; status: string }[];
}

interface TxResponse {
  data: RecentTx[];
  total: number;
  page: number;
  limit: number;
}

// ── Format helper ──
const f = (n: number) => n.toLocaleString('uz-UZ');

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [topPharmacies, setTopPharmacies] = useState<TopPharmacy[]>([]);
  const [recentTxs, setRecentTxs] = useState<RecentTx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const from = sevenDaysAgo.toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];

      const [overviewRes, dailyRes, topRes, txRes] = await Promise.all([
        get<AdminOverview>('/reports/overview'),
        get<{ data: DailyStat[] }>(`/reports/daily`, { from, to, limit: '7' }),
        get<TopPharmacy[]>('/reports/top-pharmacies', { limit: '10' }),
        get<TxResponse>('/transactions', { page: '1', limit: '10' }),
      ]);

      setOverview(overviewRes.data);
      setDailyStats(dailyRes.data.data || []);
      setTopPharmacies(topRes.data || []);
      setRecentTxs(txRes.data.data || []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Dashboard maʼlumotlarini yuklashda xatolik';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCard key={i} title="" value="" loading />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-64 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Error (no data) ──
  if (error && !overview) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Asosiy koʻrsatkichlar</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Maʼlumotlarni yuklab boʻlmadi</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">{error}</p>
          <Button onClick={fetchStats} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Qayta urinish
          </Button>
        </div>
      </div>
    );
  }

  const s = overview!;
  // Build chart data from daily stats
  const chartData = dailyStats
    .map((d) => ({
      date: new Date(d.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }),
      transactions: d.totalAmount,
      cashback: d.totalCashback,
    }))
    .reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Assalomu alaykum! Bugungi asosiy koʻrsatkichlar
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} className="gap-2 self-start">
          <RefreshCw className="h-4 w-4" />
          Yangilash
        </Button>
      </div>

      {/* KPI Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Dorixonalar"
          value={String(s.activePharmacies)}
          description="faol dorixonalar"
          icon={Building2}
        />
        <StatCard
          title="Faol foydalanuvchilar"
          value={s.activeUsers}
          description="bloklanmaganlar"
          icon={Users}
        />
        <StatCard
          title="Tranzaksiyalar"
          value={s.totalTransactions}
          description={`${f(s.totalAmount)} soʻm`}
          icon={ArrowRightLeft}
        />
        <StatCard
          title="Kutilayotgan yechib olish"
          value={s.pendingWithdraws}
          description="tasdiqlanishi kerak"
          icon={Wallet}
          trend={
            s.pendingWithdraws > 0
              ? { value: s.pendingWithdraws, positive: false }
              : undefined
          }
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Jami toʻlangan cashback"
          value={`${f(s.totalCashback)} soʻm`}
          icon={Percent}
        />
        <StatCard
          title="Jami daromad"
          value={`${f(s.totalAmount)} soʻm`}
          icon={DollarSign}
        />
        <StatCard
          title="Jami mijozlar"
          value={s.totalCustomers}
          description="barcha xaridorlar"
          icon={Users}
        />
      </div>

      <Separator />

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Tranzaksiya va Cashback" description="Soʻnggi 7 kunlik tendensiya">
          {chartData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="transactions"
                    stroke="#2563eb"
                    strokeWidth={2}
                    name="Tranzaksiyalar (soʻm)"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cashback"
                    stroke="#16a34a"
                    strokeWidth={2}
                    name="Cashback (soʻm)"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-72 text-muted-foreground text-sm">
              Maʼlumot mavjud emas
            </div>
          )}
        </ChartCard>

        <ChartCard title="Top dorixonalar" description="Eng koʻp tranzaksiya boʻyicha">
          {topPharmacies.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPharmacies.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis
                    dataKey="pharmacyName"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={140}
                    className="text-muted-foreground"
                  />
                  <Tooltip />
                  <Bar
                    dataKey="totalTransactions"
                    fill="#2563eb"
                    radius={[0, 4, 4, 0]}
                    name="Tranzaksiyalar soni"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-72 text-muted-foreground text-sm">
              Maʼlumot mavjud emas
            </div>
          )}
        </ChartCard>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Oxirgi tranzaksiyalar</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/transactions'}>
            Hammasini koʻrish →
          </Button>
        </CardHeader>
        <CardContent>
          {recentTxs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Mijoz</th>
                    <th className="text-left py-2 font-medium">Dorixona</th>
                    <th className="text-right py-2 font-medium">Summa</th>
                    <th className="text-right py-2 font-medium">Cashback</th>
                    <th className="text-center py-2 font-medium">Holat</th>
                    <th className="text-right py-2 font-medium">Vaqt</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTxs.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-2.5 font-medium">
                        {tx.user.firstName} {tx.user.lastName}
                      </td>
                      <td className="py-2.5 text-muted-foreground">{tx.pharmacy.name}</td>
                      <td className="py-2.5 text-right">{f(Number(tx.amount))}</td>
                      <td className="py-2.5 text-right text-emerald-600 font-medium">
                        {tx.cashbacks?.[0] ? `+${f(Number(tx.cashbacks[0].amount))}` : '—'}
                      </td>
                      <td className="py-2.5 text-center">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground text-xs">
                        {new Date(tx.createdAt).toLocaleString('uz-UZ', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <ArrowRightLeft className="h-8 w-8 mb-2 opacity-40" />
              <p>Hozircha tranzaksiyalar mavjud emas</p>
              <p className="text-xs mt-1">Mijozlar xarid qilganda bu yerda koʻrinadi</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
