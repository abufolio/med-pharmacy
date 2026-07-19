import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { reportApi, transactionApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api';
import { StatCard } from '@/components/layout/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ArrowLeftRight,
  PiggyBank,
  TrendingUp,
  ScanLine,
  UserPlus,
  CreditCard,
} from 'lucide-react';

export function PharmacyDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<any>({
    summary: null,
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, txRes] = await Promise.all([
          reportApi.summary().catch(() => null),
          transactionApi.list({ limit: 5 }).catch(() => null),
        ]);
        setData({
          summary: summaryRes?.data || null,
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

  const stats = data.summary || {
    totalTransactions: 0,
    totalAmount: 0,
    totalCashback: 0,
    totalCustomers: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.welcome')}</h1>
          <p className="text-sm text-gray-500 mt-1">Pharmacy overview and key metrics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/employee/scan')} className="flex items-center gap-2">
            <ScanLine className="h-4 w-4" />
            NFC Scan
          </Button>
          <Button variant="outline" onClick={() => navigate('/employee/customers')}>
            <UserPlus className="h-4 w-4" />
            New Customer
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-sm animate-[fade-in_0.3s_ease]">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <StatCard
          title={t('report.totalTransactions')}
          value={stats.totalTransactions}
          icon={ArrowLeftRight}
          gradient="bg-gradient-amber text-white"
          delay={0}
        />
        <StatCard
          title={t('report.totalAmount')}
          value={formatCurrency(stats.totalAmount)}
          icon={TrendingUp}
          gradient="bg-gradient-blue text-white"
          delay={100}
        />
        <StatCard
          title={t('report.totalCashback')}
          value={formatCurrency(stats.totalCashback)}
          icon={PiggyBank}
          gradient="bg-gradient-primary text-white"
          delay={200}
        />
        <StatCard
          title={t('report.totalCustomers')}
          value={stats.totalCustomers}
          icon={Users}
          gradient="bg-gradient-purple text-white"
          delay={300}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/employee/scan')}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg hover:border-emerald-200 transition-all duration-200 text-left group"
        >
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ScanLine className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-gray-900">NFC Scan</h3>
          <p className="text-sm text-gray-500 mt-1">Scan customer card</p>
        </button>

        <button
          onClick={() => navigate('/pharmacy/transactions')}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg hover:border-amber-200 transition-all duration-200 text-left group"
        >
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-gray-900">Transactions</h3>
          <p className="text-sm text-gray-500 mt-1">View all transactions</p>
        </button>

        <button
          onClick={() => navigate('/pharmacy/customers')}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg hover:border-purple-200 transition-all duration-200 text-left group"
        >
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-gray-900">Customers</h3>
          <p className="text-sm text-gray-500 mt-1">Search customers by phone</p>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.recentTransactions')}</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/pharmacy/transactions')}>
            View all
          </Button>
        </div>
        <div className="p-6">
          {data.recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
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
