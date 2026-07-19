import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyApi, districtApi } from '@/lib/api-services';
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
import { useNavigate } from 'react-router-dom';

export function PharmacyListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', address: '', login: '', password: '', districtId: '',
  });

  const { data: pharmaciesData, isLoading: loadingPharmacies } = useQuery({
    queryKey: ['pharmacies', page, search, statusFilter],
    queryFn: () => pharmacyApi.list({ page, limit: 20, status: statusFilter || undefined }),
  });

  const { data: districts } = useQuery({
    queryKey: ['districts'],
    queryFn: () => districtApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => pharmacyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
      setCreateOpen(false);
      setForm({ name: '', phone: '', address: '', login: '', password: '', districtId: '' });
      addToast('Pharmacy created successfully', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      pharmacyApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
      addToast('Status updated', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const handleCreate = () => {
    if (!form.name || !form.phone || !form.login || !form.password || !form.districtId) {
      addToast('Please fill all required fields', 'error');
      return;
    }
    createMutation.mutate(form);
  };

  const pharmacies: any[] = pharmaciesData?.data || [];
  const total = pharmaciesData?.total || 0;
  const allDistricts: any[] = districts?.data || [];

  if (loadingPharmacies) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('pharmacy.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{total} {t('common.items')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="">{t('common.all')}</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING">Pending</option>
          </select>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" />{t('pharmacy.create')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t('pharmacy.create')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <Input label={t('pharmacy.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input label={t('pharmacy.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input label={t('pharmacy.address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                <Input label={t('pharmacy.login')} value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
                <Input label={t('pharmacy.password')} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <Select
                  label={t('pharmacy.district')}
                  value={form.districtId}
                  onChange={(e) => setForm({ ...form, districtId: e.target.value })}
                  options={allDistricts.map((d: any) => ({ value: d.id, label: d.name }))}
                  placeholder="Select district"
                />
                <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
                  {t('common.create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} className="max-w-sm" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('pharmacy.name')}</TableHead>
                <TableHead>{t('pharmacy.phone')}</TableHead>
                <TableHead>{t('pharmacy.address')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pharmacies.map((pharmacy: any) => (
                <TableRow key={pharmacy.id} className="cursor-pointer" onClick={() => navigate(`/super-admin/pharmacies/${pharmacy.id}`)}>
                  <TableCell className="font-medium">{pharmacy.name}</TableCell>
                  <TableCell>{pharmacy.phone}</TableCell>
                  <TableCell className="text-slate-500 max-w-[200px] truncate">{pharmacy.address || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(pharmacy.status) as any}>
                      {getStatusLabel(pharmacy.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDateShort(pharmacy.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        const nextStatus = pharmacy.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                        updateStatusMutation.mutate({ id: pharmacy.id, status: nextStatus });
                      }}>
                        {pharmacy.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pharmacies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {total > 20 && (
          <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
        )}
      </Card>
    </div>
  );
}
