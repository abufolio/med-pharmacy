import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { PageLoader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToastStore } from '@/components/ui/toast';
import { formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Plus } from 'lucide-react';

export function PharmacyCustomerPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', language: 'uz' });

  const { data, isLoading } = useQuery({
    queryKey: ['pharmacy-customers', page, search],
    queryFn: () => customerApi.list({ page, limit: 20, search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => customerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-customers'] });
      setCreateOpen(false);
      setForm({ firstName: '', lastName: '', phone: '', language: 'uz' });
      addToast('Customer created', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  if (isLoading) return <PageLoader />;

  const users = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.customers')}</h1>
          <p className="text-sm text-slate-500 mt-1">{total} {t('common.items')}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />{t('user.create')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('user.create')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input label={t('user.firstName')} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <Input label={t('user.lastName')} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              <Input label={t('user.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Select label={t('user.language')} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}
                options={[
                  { value: 'uz', label: "O'zbek" },
                  { value: 'ru', label: 'Русский' },
                  { value: 'en', label: 'English' },
                ]}
              />
              <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
                {t('common.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} className="max-w-sm" placeholder="Search customers..." />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('user.firstName')}</TableHead>
                <TableHead>{t('user.lastName')}</TableHead>
                <TableHead>{t('user.phone')}</TableHead>
                <TableHead>{t('user.language')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.firstName}</TableCell>
                  <TableCell>{user.lastName}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.language?.toUpperCase()}</TableCell>
                  <TableCell><Badge variant={getStatusColor(user.status) as any}>{getStatusLabel(user.status)}</Badge></TableCell>
                  <TableCell className="text-slate-500">{formatDateShort(user.createdAt)}</TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">{t('common.noData')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {total > 20 && <Pagination page={page} total={total} limit={20} onPageChange={setPage} />}
      </Card>
    </div>
  );
}
