import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { readerApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PageLoader } from '@/components/ui/loader';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToastStore } from '@/components/ui/toast';
import { formatDateShort } from '@/lib/utils';
import { Plus } from 'lucide-react';

export function PharmacyReaderPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();

  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ serialNumber: '', model: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['readers', page],
    queryFn: () => readerApi.list({ page, limit: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => readerApi.create({ ...data, pharmacyId: user?.pharmacyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readers'] });
      setCreateOpen(false);
      setForm({ serialNumber: '', model: '' });
      addToast('Reader created', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  if (isLoading) return <PageLoader />;

  const readers = data?.data || [];
  const total = data?.total || 0;

  const statusColors: Record<string, string> = {
    ONLINE: 'success',
    OFFLINE: 'outline',
    FAULTY: 'danger',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.readers')}</h1>
          <p className="text-sm text-slate-500 mt-1">{total} {t('common.items')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Add Reader
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial Number</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>Last Ping</TableHead>
                <TableHead>{t('common.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readers.map((reader: any) => (
                <TableRow key={reader.id}>
                  <TableCell className="font-mono font-medium text-sm">{reader.serialNumber}</TableCell>
                  <TableCell>{reader.model || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={(statusColors[reader.status] || 'outline') as any}>{reader.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{reader.lastPingAt ? formatDateShort(reader.lastPingAt) : '—'}</TableCell>
                  <TableCell className="text-slate-500">{formatDateShort(reader.createdAt)}</TableCell>
                </TableRow>
              ))}
              {readers.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">{t('common.noData')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {total > 20 && <Pagination page={page} total={total} limit={20} onPageChange={setPage} />}
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Reader</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input label="Serial Number" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
            <Input label="Model (optional)" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
              {t('common.create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
