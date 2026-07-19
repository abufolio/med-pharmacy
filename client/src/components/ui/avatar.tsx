import { cn } from '@/lib/utils';

interface AvatarProps {
  initials: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };

export function Avatar({ initials, className, size = 'md' }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center',
        sizeMap[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
