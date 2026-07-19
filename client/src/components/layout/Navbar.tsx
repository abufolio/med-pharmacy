import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api-services';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Globe, LogOut, User, Menu } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await authApi.logout(refreshToken || undefined);
    } catch {
      // ignore
    }
    logout();
    navigate('/login');
  };

  const currentLang = i18n.language;
  const langLabels: Record<string, string> = { uz: "O'zbek", ru: 'Русский', en: 'English' };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-base font-semibold text-gray-900 hidden sm:block">
            {user?.pharmacyName || 'Med Bonus'}
          </h1>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all cursor-pointer">
              <Globe className="h-[18px] w-[18px]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {Object.entries(langLabels).map(([code, label]) => (
              <DropdownMenuItem
                key={code}
                onClick={() => changeLanguage(code as 'uz' | 'ru' | 'en')}
                className={currentLang === code ? 'bg-emerald-50 text-emerald-700 font-medium' : ''}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all cursor-pointer">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
              <Avatar
                initials={getInitials(user?.fullName || user?.login)}
                size="sm"
                className="ring-2 ring-emerald-100"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700 leading-tight">
                  {user?.fullName || user?.login}
                </p>
                <p className="text-[11px] text-gray-400">
                  {user?.role === 'SUPER_ADMIN' ? 'Super Admin' :
                   user?.role === 'PHARMACY_ADMIN' ? 'Pharmacy Admin' : 'Employee'}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{user?.fullName || user?.login}</p>
              <p className="text-xs text-gray-500">{user?.pharmacyName || ''}</p>
            </div>
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="h-4 w-4" />
              {t('common.profile')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
              {t('common.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
