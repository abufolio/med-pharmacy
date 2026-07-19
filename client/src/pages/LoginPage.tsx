import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { useToastStore } from '@/components/ui/toast';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';
import { Activity, Eye, EyeOff, LogIn } from 'lucide-react';

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !password) {
      setError(t('auth.loginError'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authApi.login({ login, password });
      setAuth(res.user, res.tokens);

      const roleRedirects: Record<string, string> = {
        SUPER_ADMIN: '/dashboard',
        PHARMACY_ADMIN: '/dashboard',
        EMPLOYEE: '/dashboard',
      };
      navigate(roleRedirects[res.user.role] || '/dashboard', { replace: true });
      addToast(`Welcome, ${res.user.fullName || res.user.login}!`, 'success');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const currentLang = i18n.language;
  const langLabels: Record<string, string> = { uz: "O'zbek", ru: 'Русский', en: 'English' };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800">
        {/* Decorative elements */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-emerald-500/10" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 rounded-full bg-teal-400/10" />

        <div className="relative flex flex-col justify-center px-16 py-20 z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Activity className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Med Bonus</h1>
              <p className="text-emerald-200 text-sm font-medium">Dorixona cashback tizimi</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mt-8">
            Dorixona biznesingizni
            <br />
            <span className="text-emerald-300">yangi bosqichga</span> olib chiqing
          </h2>

          <p className="text-emerald-100/80 text-lg mt-4 max-w-md leading-relaxed">
            Boshqaruv paneli orqali barcha dorixona operatsiyalari, cashback va bonus tizimini
            bir joydan boshqaring.
          </p>

          <div className="mt-12 flex items-center gap-8">
            <div className="flex -space-x-2">
              {['A', 'B', 'M', 'K'].map((letter, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-emerald-600 bg-emerald-500/30 flex items-center justify-center text-white text-xs font-bold"
                >
                  {letter}
                </div>
              ))}
            </div>
            <p className="text-emerald-200 text-sm">50+ dorixona faol foydalanmoqda</p>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Med Bonus</h1>
              <p className="text-xs text-gray-500">Admin panel</p>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex justify-end gap-2 mb-4">
            {Object.entries(langLabels).map(([code, label]) => (
              <button
                key={code}
                onClick={() => changeLanguage(code as 'uz' | 'ru' | 'en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentLang === code
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                <LogIn className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
              <p className="text-gray-500 mt-1.5">Tizimga kirish uchun ma'lumotlaringizni kiriting</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-[fade-in_0.3s_ease]">
                <div className="w-5 h-5 rounded-full bg-red-400 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  !
                </div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={t('auth.username')}
                placeholder="admin yoki cashier1"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                disabled={loading}
                autoFocus
              />

              <div className="relative">
                <Input
                  label={t('auth.password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/50 border-0"
                disabled={loading}
              >
                {loading ? <Loader size="sm" /> : t('auth.loginBtn')}
              </Button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-8">
              Med Bonus v2.0 &mdash; Dorixona cashback tizimi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
