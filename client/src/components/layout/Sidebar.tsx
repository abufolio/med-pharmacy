import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  UserCog,
  CreditCard,
  ArrowLeftRight,
  PiggyBank,
  Wallet,
  Ticket,
  Radio,
  FileBarChart,
  Settings,
  ShieldAlert,
  Menu,
  ScanLine,
  ChevronLeft,
  ClipboardList,
  Activity,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'nav.dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'PHARMACY_ADMIN', 'EMPLOYEE'] },
  // Super Admin only
  { label: 'nav.pharmacies', path: '/super-admin/pharmacies', icon: Building2, roles: ['SUPER_ADMIN'] },
  { label: 'nav.regions', path: '/super-admin/regions', icon: MapPin, roles: ['SUPER_ADMIN'] },
  { label: 'nav.users', path: '/super-admin/users', icon: Users, roles: ['SUPER_ADMIN'] },
  { label: 'nav.employees', path: '/super-admin/employees', icon: UserCog, roles: ['SUPER_ADMIN'] },
  { label: 'nav.cards', path: '/super-admin/cards', icon: CreditCard, roles: ['SUPER_ADMIN'] },
  { label: 'nav.transactions', path: '/super-admin/transactions', icon: ArrowLeftRight, roles: ['SUPER_ADMIN'] },
  { label: 'nav.cashbackRules', path: '/super-admin/cashback-rules', icon: PiggyBank, roles: ['SUPER_ADMIN'] },
  { label: 'nav.withdrawals', path: '/super-admin/withdrawals', icon: Wallet, roles: ['SUPER_ADMIN'] },
  { label: 'nav.promoCodes', path: '/super-admin/promo-codes', icon: Ticket, roles: ['SUPER_ADMIN'] },
  { label: 'nav.reports', path: '/super-admin/reports', icon: FileBarChart, roles: ['SUPER_ADMIN'] },
  { label: 'nav.settings', path: '/super-admin/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
  { label: 'nav.audit', path: '/super-admin/audit', icon: ShieldAlert, roles: ['SUPER_ADMIN'] },
  // Pharmacy Admin
  { label: 'nav.employees', path: '/pharmacy/employees', icon: UserCog, roles: ['PHARMACY_ADMIN'] },
  { label: 'nav.cashbackRules', path: '/pharmacy/cashback-rules', icon: PiggyBank, roles: ['PHARMACY_ADMIN'] },
  { label: 'nav.customers', path: '/pharmacy/customers', icon: Users, roles: ['PHARMACY_ADMIN'] },
  { label: 'nav.transactions', path: '/pharmacy/transactions', icon: ArrowLeftRight, roles: ['PHARMACY_ADMIN'] },
  { label: 'nav.reports', path: '/pharmacy/reports', icon: FileBarChart, roles: ['PHARMACY_ADMIN'] },
  { label: 'nav.readers', path: '/pharmacy/readers', icon: Radio, roles: ['PHARMACY_ADMIN'] },
  // Employee
  { label: 'nav.scan', path: '/employee/scan', icon: ScanLine, roles: ['EMPLOYEE'] },
  { label: 'nav.transactions', path: '/employee/transactions', icon: ClipboardList, roles: ['EMPLOYEE'] },
  { label: 'nav.customers', path: '/employee/customers', icon: Users, roles: ['EMPLOYEE'] },
];

export function Sidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isPharmacyAdmin = user?.role === 'PHARMACY_ADMIN';
  const isEmployee = user?.role === 'EMPLOYEE';

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-white shadow-lg border border-gray-100"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#0f172a] transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-[68px] px-4 border-b border-white/5',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Activity className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm tracking-tight">Med Bonus</p>
              <p className="text-blue-300/50 text-[10px] uppercase tracking-widest font-medium">Admin</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
          <p className={cn(
            'text-[10px] uppercase tracking-widest text-gray-500 font-semibold px-3 mb-2',
            collapsed && 'text-center text-[8px]'
          )}>
            {collapsed ? '•••' : t('nav.menu') || 'Menu'}
          </p>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path) ||
              (item.path === '/dashboard' && (location.pathname === '/' || location.pathname.startsWith('/dashboard') ||
                (isSuperAdmin && (location.pathname === '/super-admin')) ||
                (isPharmacyAdmin && (location.pathname === '/pharmacy')) ||
                (isEmployee && (location.pathname === '/employee'))));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-gray-400 hover:bg-white/[0.06] hover:text-gray-200',
                  collapsed && 'justify-center px-2',
                )}
                title={t(item.label)}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-full" />
                )}
                <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                {!collapsed && <span className="truncate">{t(item.label)}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User profile at bottom */}
        {user && (
          <div className={cn(
            'border-t border-white/5 p-3',
            collapsed && 'px-2'
          )}>
            <div className={cn(
              'flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.04]',
              collapsed && 'justify-center px-0'
            )}>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {getInitials(user?.fullName || user?.login)}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {user?.fullName || user?.login}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {user?.role === 'SUPER_ADMIN' ? 'Super Admin' :
                     user?.role === 'PHARMACY_ADMIN' ? 'Farmatsiya' : 'Kassir'}
                  </p>
                </div>
              )}
              {!collapsed && (
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title={t('common.logout')}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-10 border-t border-white/5 text-gray-500 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
          title={collapsed ? t('nav.expand') || 'Expand' : t('nav.collapse') || 'Collapse'}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')} />
        </button>
      </aside>
    </>
  );
}
