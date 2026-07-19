import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { transactionApi } from '@/lib/api-services';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/loader';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ScanLine, ClipboardList, Users, Receipt } from 'lucide-react';

export function EmployeeDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await transactionApi.list({ limit: 5 });
        setTransactions(res.data || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.welcome')}, Cashier</h1>
        <p className="text-sm text-gray-500 mt-1">Quick actions and today's overview</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/employee/scan')}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:border-emerald-200 transition-all duration-200 text-left group"
        >
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-200">
            <ScanLine className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h3 className="font-semibold text-gray-900 text-lg">NFC Scan</h3>
          <p className="text-sm text-gray-500 mt-1">Scan customer card and process cashback</p>
        </button>

        <button
          onClick={() => navigate('/employee/transactions')}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:border-amber-200 transition-all duration-200 text-left group"
        >
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-amber-200">
            <ClipboardList className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h3 className="font-semibold text-gray-900 text-lg">Transactions</h3>
          <p className="text-sm text-gray-500 mt-1">View your transaction history</p>
        </button>

        <button
          onClick={() => navigate('/employee/customers')}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-200 text-left group"
        >
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-200">
            <Users className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h3 className="font-semibold text-gray-900 text-lg">Customers</h3>
          <p className="text-sm text-gray-500 mt-1">Search customers and issue cards</p>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.recentTransactions')}</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/employee/transactions')}>
            View all
          </Button>
        </div>
        <div className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No transactions today</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate('/employee/scan')}
              >
                <ScanLine className="h-4 w-4 mr-2" />
                Start scanning
              </Button>
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
                  {transactions.map((tx: any) => (
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
