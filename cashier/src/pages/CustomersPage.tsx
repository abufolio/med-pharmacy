import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/loader';
import { Dialog } from '@/components/ui/dialog';
import { useToastStore } from '@/components/ui/toast';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import {
  ArrowLeft,
  Search,
  Plus,
  User,
  AlertCircle,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Customer } from '@/types';

const PAGE_SIZE = 20;

export function CustomersPage() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [data, setData] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', language: 'uz' });
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page, limit: PAGE_SIZE };
      if (search) params.search = search;

      const { data: res } = await customerApi.list(params);
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCreate = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      addToast('Barcha maydonlarni toʻldiring', 'error');
      return;
    }

    setCreating(true);
    try {
      await customerApi.create(form);
      addToast('Mijoz muvaffaqiyatli yaratildi', 'success');
      setCreateOpen(false);
      setForm({ firstName: '', lastName: '', phone: '', language: 'uz' });
      fetchData();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setCreating(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="iconSm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base font-semibold text-slate-900">Mijozlar</h1>
              <p className="text-xs text-slate-500">{total} ta mijoz</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="iconSm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Yangi</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 page-enter">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Telefon raqam yoki ism boʻyicha qidirish..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <PageLoader />
            ) : data.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Mijozlar topilmadi</p>
                <p className="text-sm text-slate-400 mt-1">
                  {search ? 'Qidiruv natijasi boʻyicha mijoz topilmadi' : 'Hali mijozlar mavjud emas'}
                </p>
                {!search && (
                  <Button variant="outline" className="mt-4" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Yangi mijoz qoʻshish
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {/* Header - hidden on mobile */}
                <div className="hidden sm:flex items-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <div className="flex-[2]">Ism</div>
                  <div className="flex-[2]">Familiya</div>
                  <div className="flex-[2]">Telefon</div>
                  <div className="w-20">Til</div>
                  <div className="w-24">Status</div>
                </div>

                {data.map((c, idx) => (
                  <div
                    key={c.id}
                    className="px-5 py-4 hover:bg-slate-50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${idx * 0.03}s` }}
                  >
                    {/* Mobile */}
                    <div className="sm:hidden flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{c.phone}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(c.status || 'ACTIVE') as any} size="sm">
                        {getStatusLabel(c.status || 'ACTIVE')}
                      </Badge>
                    </div>

                    {/* Desktop */}
                    <div className="hidden sm:flex items-center">
                      <div className="flex-[2] flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{c.firstName}</span>
                      </div>
                      <div className="flex-[2] text-sm text-slate-700">{c.lastName}</div>
                      <div className="flex-[2] text-sm text-slate-500">{c.phone}</div>
                      <div className="w-20">
                        <span className="text-xs font-medium text-slate-600">
                          {c.language?.toUpperCase() || 'UZ'}
                        </span>
                      </div>
                      <div className="w-24">
                        <Badge variant={getStatusColor(c.status || 'ACTIVE') as any} size="sm">
                          {getStatusLabel(c.status || 'ACTIVE')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                {total} tadan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} koʻrsatilmoqda
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="iconSm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600 px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="iconSm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      {/* Create Customer Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Yangi mijoz qoʻshish">
        <div className="space-y-4">
          <Input
            label="Ism"
            placeholder="Ismni kiriting"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            label="Familiya"
            placeholder="Familiyani kiriting"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <Input
            label="Telefon"
            placeholder="+998 XX XXX XX XX"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Til</label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            >
              <option value="uz">Oʻzbek</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>
              Bekor qilish
            </Button>
            <Button className="flex-1" onClick={handleCreate} loading={creating}>
              {!creating && <Plus className="h-4 w-4" />}
              Qoʻshish
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
