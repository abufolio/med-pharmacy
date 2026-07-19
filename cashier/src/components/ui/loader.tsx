import { cn } from '@/lib/utils';

interface PageLoaderProps {
  text?: string;
  className?: string;
}

export function PageLoader({ text = 'Yuklanmoqda...', className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20 gap-3 animate-fade-in',
        className,
      )}
    >
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-primary-100" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-primary-600 animate-spin" />
      </div>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  };

  return (
    <div
      className={cn(
        'rounded-full border-slate-200 border-t-primary-600 animate-spin',
        sizeClasses[size],
        className,
      )}
    />
  );
}
