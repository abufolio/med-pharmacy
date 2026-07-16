'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, CreditCard, DollarSign, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalPharmacies: number;
  activePharmacies: number;
  totalUsers: number;
  activeCards: number;
  todayTransactions: number;
  todayCashback: number;
  totalRevenue: number;
}

function StatCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => get<DashboardStats>('/reports/overview'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Tizimning umumiy holati</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Dorixonalar"
          value={data?.data ? `${data.data.activePharmacies}/${data.data.totalPharmacies}` : '...'}
          icon={<Building2 className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Foydalanuvchilar"
          value={data?.data?.totalUsers ?? '...'}
          icon={<Users className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Faol kartalar"
          value={data?.data?.activeCards ?? '...'}
          icon={<CreditCard className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Bugungi tranzaksiyalar"
          value={data?.data?.todayTransactions ?? '...'}
          icon={<TrendingUp className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Bugungi cashback"
          value={data?.data?.todayCashback ? `${Number(data.data.todayCashback).toLocaleString()} soʻm` : '...'}
          icon={<DollarSign className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          title="Umumiy daromad"
          value={data?.data?.totalRevenue ? `${Number(data.data.totalRevenue).toLocaleString()} soʻm` : '...'}
          icon={<TrendingUp className="h-4 w-4" />}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
