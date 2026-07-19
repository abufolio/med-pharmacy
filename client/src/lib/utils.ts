import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(num)
    .replace('UZS', '')
    .trim() + ' so\'m';
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return '??';
  return `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}`;
}

export function getStatusColor(
  status: string,
): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'ACTIVE':
    case 'COMPLETED':
    case 'PAID':
    case 'APPROVED':
    case 'ONLINE':
      return 'success';
    case 'PENDING':
    case 'PENDING_CARD':
    case 'SUSPENDED':
    case 'OFFLINE':
      return 'warning';
    case 'BLOCKED':
    case 'REVERSED':
    case 'FAILED':
    case 'REJECTED':
    case 'FAULTY':
      return 'danger';
    default:
      return 'info';
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    SUSPENDED: 'Suspended',
    PENDING: 'Pending',
    PENDING_CARD: 'Karta kutilmoqda',
    BLOCKED: 'Blocked',
    UNASSIGNED: 'Unassigned',
    REPLACED: 'Replaced',
    COMPLETED: 'Completed',
    REVERSED: 'Reversed',
    FAILED: 'Failed',
    FLAGGED: 'Flagged',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PAID: 'Paid',
    ONLINE: 'Online',
    OFFLINE: 'Offline',
    FAULTY: 'Faulty',
    ROLLED_BACK: 'Rolled Back',
    EXPIRED: 'Expired',
    FROZEN: 'Frozen',
    PERCENT: 'Foizli',
    FIXED: 'Fixed',
    CAMPAIGN: 'Kampaniya',
  };
  return labels[status] || status;
}
