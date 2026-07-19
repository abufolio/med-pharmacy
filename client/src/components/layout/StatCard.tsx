import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient?: string;
  trend?: { value: number; positive: boolean };
  className?: string;
  iconBg?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  trend,
  className,
  iconBg,
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-6 hover:shadow-lg transition-all duration-200',
        className,
      )}
      style={{
        animation: `fade-in 0.4s ease forwards`,
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        {/* Icon */}
        <div
          className={cn(
            'h-12 w-12 rounded-xl flex items-center justify-center',
            gradient || iconBg || 'bg-emerald-50 text-emerald-600',
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </div>

        {/* Trend */}
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
              trend.positive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700',
            )}
          >
            <span>{trend.positive ? '↑' : '↓'}</span>
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
