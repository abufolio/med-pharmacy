import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { PageLoader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToastStore } from '@/components/ui/toast';
import { formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Plus, Ban, CheckCircle } from 'lucide-react';

export function EmployeeListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ login: '', password: '', fullName: '', roleId: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page],
    queryFn: () => employeeApi.list({ page, limit: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => employeeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setCreateOpen(false);
      setForm({ login: '', password: '', fullName: '', roleId: '' });
      addToast('Employee created', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => employeeApi.suspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      addToast('Employee suspended', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => employeeApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      addToast('Employee activated', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  if (isLoading) return <PageLoader />;

  const employees = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('employee.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{total} {t('common.items')}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />{t('employee.create')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('employee.create')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input label={t('employee.fullName')} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <Input label={t('employee.login')} value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
              <Input label={t('employee.password')} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
                {t('common.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('employee.fullName')}</TableHead>
                <TableHead>{t('employee.login')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead className="w-[120px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp: any) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.fullName}</TableCell>
                  <TableCell>{emp.login}</TableCell>
                  <TableCell><Badge variant={getStatusColor(emp.status) as any}>{getStatusLabel(emp.status)}</Badge></TableCell>
                  <TableCell className="text-slate-500">{formatDateShort(emp.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {emp.status === 'ACTIVE' ? (
                        <Button variant="ghost" size="sm" onClick={() => suspendMutation.mutate(emp.id)}>
                          <Ban className="h-4 w-4 text-danger" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => activateMutation.mutate(emp.id)}>
                          <CheckCircle className="h-4 w-4 text-success" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">{t('common.noData')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {total > 20 && <Pagination page={page} total={total} limit={20} onPageChange={setPage} />}
      </Card>
    </div>
  );
}
