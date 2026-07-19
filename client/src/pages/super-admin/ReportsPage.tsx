import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '@/lib/api-services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { PageLoader } from '@/components/ui/loader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDateShort, formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/layout/StatCard';
import { DollarSign, ShoppingCart, Users, Building2 } from 'lucide-react';

export function ReportsPage() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['report-overview', fromDate, toDate],
    queryFn: () => reportApi.overview({ from: fromDate || undefined, to: toDate || undefined }),
  });

  const { data: dailyData } = useQuery({
    queryKey: ['report-daily', page, fromDate, toDate],
    queryFn: () => reportApi.daily({ page, limit: 20, from: fromDate || undefined, to: toDate || undefined }),
  });

  const { data: topPharmacies } = useQuery({
    queryKey: ['report-top', fromDate, toDate],
    queryFn: () => reportApi.topPharmacies({ limit: 10, from: fromDate || undefined, to: toDate || undefined }),
  });

  if (loadingOverview) return <PageLoader />;

  const ov = overview?.data;
  const dailyReports = dailyData?.data || [];
  const dailyTotal = dailyData?.total || 0;
  const topList = topPharmacies?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('report.title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          />
          <span className="text-slate-400">—</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          />
          {(fromDate || toDate) && (
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(''); setToDate(''); }}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {ov && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Building2} title={t('pharmacy.title')} value={`${ov.activePharmacies}/${ov.totalPharmacies}`} />
          <StatCard icon={Users} title={t('user.title')} value={ov.totalUsers} />
          <StatCard icon={ShoppingCart} title={t('transaction.title')} value={ov.totalTransactions} />
          <StatCard icon={DollarSign} title={t('cashback.title')} value={formatCurrency(ov.totalCashback)} />
        </div>
      )}

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">{t('report.daily')}</TabsTrigger>
          <TabsTrigger value="top">Top Pharmacies</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('report.totalTransactions')}</TableHead>
                    <TableHead>{t('report.totalAmount')}</TableHead>
                    <TableHead>{t('report.totalCashback')}</TableHead>
                    <TableHead>{t('report.totalCustomers')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyReports.map((report: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{formatDateShort(report.date)}</TableCell>
                      <TableCell>{report.totalTransactions}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(report.totalAmount)}</TableCell>
                      <TableCell>{formatCurrency(report.totalCashback)}</TableCell>
                      <TableCell>{report.totalCustomers}</TableCell>
                    </TableRow>
                  ))}
                  {dailyReports.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">{t('common.noData')}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {dailyTotal > 20 && <Pagination page={page} total={dailyTotal} limit={20} onPageChange={setPage} />}
          </Card>
        </TabsContent>

        <TabsContent value="top" className="pt-4">
          <Card>
            <CardHeader><CardTitle>Top Pharmacies</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{t('pharmacy.name')}</TableHead>
                    <TableHead>{t('report.totalTransactions')}</TableHead>
                    <TableHead>{t('report.totalAmount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topList.map((ph: any, idx: number) => (
                    <TableRow key={ph.id}>
                      <TableCell className="text-slate-400">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{ph.name}</TableCell>
                      <TableCell>{ph.totalTransactions}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(ph.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                  {topList.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">{t('common.noData')}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
