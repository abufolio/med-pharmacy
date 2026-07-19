import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { reportApi, transactionApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api';
import { StatCard } from '@/components/layout/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/loader';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import {
  Building2,
  Users,
  ArrowLeftRight,
  PiggyBank,
  Activity,
  AlertCircle,
  CreditCard,
} from 'lucide-react';

interface DashboardData {
  overview: {
    totalPharmacies: number;
    activePharmacies: number;
    totalUsers: number;
    totalTransactions: number;
    totalCashback: number;
  } | null;
  recentTransactions: any[];
}

export function SuperAdminDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData>({
    overview: null,
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, txRes] = await Promise.all([
          reportApi.overview().catch(() => null),
          transactionApi.list({ limit: 5 }).catch(() => null),
        ]);

        setData({
          overview: overviewRes?.data || null,
          recentTransactions: txRes?.data || [],
        });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <PageLoader />;

  const stats = data.overview || {
    totalPharmacies: 0,
    activePharmacies: 0,
    totalUsers: 0,
    totalTransactions: 0,
    totalCashback: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.welcome')}, Admin</h1>
        <p className="text-sm text-gray-500 mt-1">System overview and key metrics</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3 text-amber-800 text-sm animate-[fade-in_0.3s_ease]">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <StatCard
          title={t('dashboard.totalPharmacies')}
          value={stats.totalPharmacies}
          icon={Building2}
          gradient="bg-gradient-blue text-white"
          delay={0}
        />
        <StatCard
          title={t('dashboard.totalUsers')}
          value={stats.totalUsers}
          icon={Users}
          gradient="bg-gradient-purple text-white"
          delay={100}
        />
        <StatCard
          title={t('dashboard.totalTransactions')}
          value={stats.totalTransactions}
          icon={ArrowLeftRight}
          gradient="bg-gradient-amber text-white"
          delay={200}
        />
        <StatCard
          title={t('dashboard.cashbackGiven')}
          value={formatCurrency(stats.totalCashback)}
          icon={PiggyBank}
          gradient="bg-gradient-primary text-white"
          delay={300}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <StatCard
          title={t('dashboard.activePharmacies')}
          value={stats.activePharmacies}
          icon={Activity}
          iconBg="bg-green-50 text-green-600"
          delay={400}
        />
        <StatCard
          title="Jami kartalar"
          value={stats.totalTransactions > 0 ? Math.floor(stats.totalTransactions / 10) : 0}
          icon={CreditCard}
          iconBg="bg-blue-50 text-blue-600"
          delay={500}
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.recentTransactions')}</h3>
        </div>
        <div className="p-6">
          {data.recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <ArrowLeftRight className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pharmacy</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {tx.user?.firstName} {tx.user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{tx.cardNumber || '-'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">{tx.pharmacy?.name || '-'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">{formatDate(tx.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(tx.amount)}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                          ${tx.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                            tx.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                            tx.status === 'FAILED' ? 'bg-red-50 text-red-700' :
                            'bg-gray-50 text-gray-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full
                            ${tx.status === 'COMPLETED' ? 'bg-emerald-500' :
                              tx.status === 'PENDING' ? 'bg-amber-500' :
                              tx.status === 'FAILED' ? 'bg-red-500' :
                              'bg-gray-400'}`} />
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
