import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '0 soʻm';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('uz-UZ').format(num) + ' soʻm';
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

type StatusVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

export function getStatusColor(status: string): StatusVariant {
  const map: Record<string, StatusVariant> = {
    COMPLETED: 'success',
    ACTIVE: 'success',
    APPROVED: 'success',
    PENDING: 'warning',
    FLAGGED: 'danger',
    FAILED: 'danger',
    REVERSED: 'danger',
    BLOCKED: 'danger',
    INACTIVE: 'warning',
    CANCELLED: 'danger',
  };
  return map[status?.toUpperCase()] || 'default';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    COMPLETED: 'Bajarildi',
    ACTIVE: 'Faol',
    APPROVED: 'Tasdiqlangan',
    PENDING: 'Kutilmoqda',
    FLAGGED: 'Shubhali',
    FAILED: 'Xatolik',
    REVERSED: 'Bekor qilingan',
    BLOCKED: 'Bloklangan',
    INACTIVE: 'Faol emas',
    CANCELLED: 'Bekor qilingan',
  };
  return map[status?.toUpperCase()] || status;
}
