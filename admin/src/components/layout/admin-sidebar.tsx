'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  ArrowRightLeft,
  Percent,
  Wallet,
  Settings,
  ShieldAlert,
  BarChart3,
  KeyRound,
  Ticket,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const superAdminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Dorixonalar', href: '/admin/pharmacies', icon: <Building2 className="h-4 w-4" /> },
  { label: 'Foydalanuvchilar', href: '/admin/users', icon: <Users className="h-4 w-4" /> },
  { label: 'Kartalar', href: '/admin/cards', icon: <CreditCard className="h-4 w-4" /> },
  { label: 'Tranzaksiyalar', href: '/admin/transactions', icon: <ArrowRightLeft className="h-4 w-4" /> },
  { label: 'Cashback', href: '/admin/cashback', icon: <Percent className="h-4 w-4" /> },
  { label: 'Yechib olish', href: '/admin/withdraw', icon: <Wallet className="h-4 w-4" /> },
  { label: 'Promo kodlar', href: '/admin/promocodes', icon: <Ticket className="h-4 w-4" /> },
  { label: 'Rollar', href: '/admin/roles', icon: <KeyRound className="h-4 w-4" /> },
  { label: 'Hisobotlar', href: '/admin/reports', icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'Audit log', href: '/admin/audit', icon: <ShieldAlert className="h-4 w-4" /> },
  { label: 'Sozlamalar', href: '/admin/settings', icon: <Settings className="h-4 w-4" /> },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SA';

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center w-full')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            PC
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm">Pharmacy Cashback</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-1 px-2">
          {superAdminNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* User info */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName || 'Admin'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
