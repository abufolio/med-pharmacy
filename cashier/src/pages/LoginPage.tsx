import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginValue.trim() || !password.trim()) {
      setError('Login va parolni kiriting');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login({ login: loginValue.trim(), password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left side — gradient brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMjAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              <img src="/med-bonus-logo.png" alt="Med Bonus" className="h-14 w-14 object-cover" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Med Bonus</h1>
              <p className="text-emerald-100 text-sm font-medium">Farmatsiya cashback tizimi</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Kassir tizimiga<br />xush kelibsiz
          </h2>
          <p className="text-emerald-100 text-lg max-w-md">
            NFC kartalarni skaner qiling, tranzaksiyalarni amalga oshiring va cashbacklarni boshqaring
          </p>
          <div className="mt-12 flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 text-white">
              <p className="text-2xl font-bold">3</p>
              <p className="text-emerald-100 text-sm">Bosqichli<br/>jarayon</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 text-white">
              <p className="text-2xl font-bold">NFC</p>
              <p className="text-emerald-100 text-sm">Tezkor<br/>skaner</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 text-white">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-emerald-100 text-sm">Uzluksiz<br/>xizmat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg mb-4 overflow-hidden">
              <img src="/med-bonus-logo.png" alt="Med Bonus" className="h-14 w-14 object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Med Bonus</h1>
            <p className="text-sm text-slate-500 mt-1">Kassir tizimiga kirish</p>
          </div>

          {/* Desktop title */}
          <div className="hidden lg:block mb-10">
            <h1 className="text-2xl font-bold text-slate-900">Tizimga kirish</h1>
            <p className="text-sm text-slate-500 mt-1">Login va parolingizni kiriting</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700 animate-slide-down">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Login"
              placeholder="admin"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              autoComplete="username"
              autoFocus
            />

            <div className="relative">
              <Input
                label="Parol"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {!loading && <LogIn className="h-5 w-5" />}
              Kirish
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Default: <span className="font-mono text-slate-500">admin / admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
