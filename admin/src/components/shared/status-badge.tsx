'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusConfig = Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }>;

const DEFAULT_STATUSES: StatusConfig = {
  ACTIVE: { label: 'Faol', variant: 'success' },
  INACTIVE: { label: 'Faol emas', variant: 'secondary' },
  PENDING: { label: 'Kutilmoqda', variant: 'warning' },
  SUSPENDED: { label: 'Bloklangan', variant: 'destructive' },
  BLOCKED: { label: 'Bloklangan', variant: 'destructive' },
  PENDING_CARD: { label: 'Karta kutilmoqda', variant: 'warning' },
  COMPLETED: { label: 'Bajarildi', variant: 'success' },
  REVERSED: { label: 'Bekor qilingan', variant: 'destructive' },
  FAILED: { label: 'Xatolik', variant: 'destructive' },
  APPROVED: { label: 'Tasdiqlangan', variant: 'success' },
  REJECTED: { label: 'Rad etilgan', variant: 'destructive' },
  UNASSIGNED: { label: 'Biriktirilmagan', variant: 'outline' },
  REPLACED: { label: 'Almashtirilgan', variant: 'secondary' },
  ONLINE: { label: 'Online', variant: 'success' },
  OFFLINE: { label: 'Offline', variant: 'secondary' },
  FAULTY: { label: 'Nosoz', variant: 'destructive' },
  PAID: { label: 'Toʻlangan', variant: 'success' },
  EXPIRED: { label: 'Muddati oʻtgan', variant: 'warning' },
  ROLLED_BACK: { label: 'Qaytarilgan', variant: 'destructive' },
  FROZEN: { label: 'Muzlatilgan', variant: 'warning' },
  PERCENT: { label: 'Foizli', variant: 'info' },
  FIXED: { label: 'Qatʼiy', variant: 'info' },
  CAMPAIGN: { label: 'Aksiya', variant: 'info' },
  YES: { label: 'Ha', variant: 'success' },
  NO: { label: 'Yoʻq', variant: 'secondary' },
};

interface StatusBadgeProps {
  status: string;
  customStatuses?: StatusConfig;
  className?: string;
}

const variantStyles: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  destructive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  outline: '',
  default: '',
};

export function StatusBadge({ status, customStatuses, className }: StatusBadgeProps) {
  const config = { ...DEFAULT_STATUSES, ...customStatuses }[status];
  if (!config) {
    return <Badge variant="outline" className={className}>{status}</Badge>;
  }

  const variantClass = variantStyles[config.variant] || '';

  return (
    <Badge
      variant={config.variant === 'outline' ? 'outline' : 'default'}
      className={cn(variantClass, className)}
    >
      {config.label}
    </Badge>
  );
}
