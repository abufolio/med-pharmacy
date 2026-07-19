import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { transactionApi } from '@/lib/services';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import {
  ScanLine,
  ClipboardList,
  Users,
  LogOut,
  ArrowRight,
  ArrowLeftRight,
  TrendingUp,
  Receipt,
  CreditCard,
  Clock,
  Sparkles,
} from 'lucide-react';

interface DashboardStats {
  todayTransactions: number;
  todayAmount: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({ todayTransactions: 0, todayAmount: 0 });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Xayrli tong');
    else if (hour < 18) setGreeting('Xayrli kun');
    else setGreeting('Xayrli kech');
    setCurrentTime(
      new Date().toLocaleDateString('uz-UZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes] = await Promise.all([
          transactionApi.list({ limit: 5 }).catch(() => null),
        ]);
        const txs = txRes?.data?.data || [];
        setRecentTransactions(txs);

        // Calculate today's stats — force Number() because Prisma Decimal comes as string
        const today = new Date().toDateString();
        const todayTxs = txs.filter((tx: any) =>
          new Date(tx.createdAt).toDateString() === today
        );
        setStats({
          todayTransactions: todayTxs.length,
          todayAmount: todayTxs.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const actionCards = [
    {
      title: 'NFC Scan',
      description: 'Kartani skaner qilish',
      icon: ScanLine,
      from: 'from-emerald-500',
      to: 'to-emerald-700',
      badge: 'Tezkor',
      onClick: () => navigate('/scan'),
    },
    {
      title: 'Tranzaksiyalar',
      description: 'Barcha tranzaksiyalar',
      icon: ClipboardList,
      from: 'from-blue-500',
      to: 'to-blue-700',
      badge: 'Tarix',
      onClick: () => navigate('/transactions'),
    },
    {
      title: 'Mijozlar',
      description: 'Mijozlar maʼlumotlari',
      icon: Users,
      from: 'from-violet-500',
      to: 'to-violet-700',
      badge: `${stats.todayTransactions} bugun`,
      onClick: () => navigate('/customers'),
    },
  ];

  if (loading) return <PageLoader text="Maʼlumotlar yuklanmoqda..." />;

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center overflow-hidden shadow-md shadow-emerald-200/50">
              <img src="/med-bonus-logo.png" alt="Med Bonus" className="h-8 w-8 object-cover" />
            </div>
            <div>
              <span className="font-bold text-slate-800">Med Bonus</span>
              <p className="text-[11px] text-slate-400 -mt-0.5 leading-tight">Cashback tizimi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-700 truncate max-w-[160px]">
                {user?.fullName || user?.login}
              </p>
              <p className="text-[11px] text-slate-400">{user?.pharmacyName || user?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Chiqish"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 page-enter">
        {/* Welcome */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {greeting}, {user?.fullName || user?.login}
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {currentTime}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">Ish faoliyati</span>
            </div>
          </div>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 sm:p-6 shadow-lg shadow-emerald-200/50">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-emerald-100/90 text-sm font-medium">Bugungi tranzaksiyalar</span>
                <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {stats.todayTransactions}
              </p>
              <p className="text-emerald-200/80 text-sm mt-1">ta tranzaksiya</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 sm:p-6 shadow-lg shadow-slate-200/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm font-medium">Bugungi summa</span>
                <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {formatCurrency(stats.todayAmount)}
              </p>
              <p className="text-slate-400 text-sm mt-1">jami aylanma</p>
            </div>
          </div>
        </div>

        {/* ── Action cards ── */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-0.5">
            Tezkor amallar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {actionCards.map((card) => (
              <button
                key={card.title}
                onClick={card.onClick}
                className="group relative overflow-hidden rounded-2xl bg-white p-5 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 shadow-md border border-slate-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${card.from} ${card.to} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}
                  >
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    {card.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-0.5">{card.title}</h3>
                <p className="text-sm text-slate-500">{card.description}</p>
                <div className="mt-3 flex items-center gap-1 text-sm font-medium text-emerald-600 group-hover:gap-2 transition-all">
                  <span>Ochish</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Recent transactions ── */}
        <Card className="animate-slide-up border-slate-100 shadow-md" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="border-b border-slate-100 bg-white/50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                  <ArrowLeftRight className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle>Oxirgi tranzaksiyalar</CardTitle>
                  <p className="text-xs text-slate-400 font-normal -mt-0.5">
                    {stats.todayTransactions > 0
                      ? `Bugun ${stats.todayTransactions} ta tranzaksiya`
                      : 'Soʻnggi 5 ta yozuv'}
                  </p>
                </div>
              </div>
              {recentTransactions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/transactions')}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  Hammasi <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">Hali tranzaksiyalar mavjud emas</p>
                <p className="text-sm text-slate-400 mt-1">Birinchi tranzaksiyani amalga oshiring</p>
                <Button className="mt-4" onClick={() => navigate('/scan')}>
                  <ScanLine className="h-4 w-4 mr-1.5" />
                  Yangi tranzaksiya
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTransactions.map((tx: any, idx: number) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          tx.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
                            : tx.status === 'FAILED'
                            ? 'bg-red-50 text-red-500 ring-1 ring-red-100'
                            : 'bg-amber-50 text-amber-500 ring-1 ring-amber-100'
                        }`}
                      >
                        <ArrowLeftRight className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {tx.user?.firstName} {tx.user?.lastName || 'Foydalanuvchi'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{formatDate(tx.createdAt)}</span>
                          {tx.cashback && Number(tx.cashback) > 0 && (
                            <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                              <Sparkles className="h-3 w-3" />
                              +{formatCurrency(tx.cashback)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(tx.amount)}</p>
                      <Badge
                        variant={getStatusColor(tx.status) as any}
                        size="sm"
                        className="mt-0.5"
                      >
                        {getStatusLabel(tx.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
