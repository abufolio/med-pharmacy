import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardApi, customerApi } from '@/lib/api-services';
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
import { useToastStore } from '@/components/ui/toast';
import { formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Plus, Link, Unlink, Ban } from 'lucide-react';

export function CardManagementPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ uid: '' });
  const [assignForm, setAssignForm] = useState({ phone: '', cardUid: '' });
  const [foundUser, setFoundUser] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cards', page],
    queryFn: () => cardApi.list({ page, limit: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: { uid: string }) => cardApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      setCreateOpen(false);
      setCreateForm({ uid: '' });
      addToast('Card created', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const assignMutation = useMutation({
    mutationFn: (data: { cardUid: string; userId: string }) => cardApi.assign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      setAssignOpen(false);
      setAssignForm({ phone: '', cardUid: '' });
      setFoundUser(null);
      addToast('Card assigned', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const unassignMutation = useMutation({
    mutationFn: (cardUid: string) => cardApi.unassign(cardUid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      addToast('Card unassigned', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const blockMutation = useMutation({
    mutationFn: (uid: string) => cardApi.updateStatus(uid, 'BLOCKED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      addToast('Card blocked', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const searchUser = async () => {
    try {
      const { data } = await customerApi.getByPhone(assignForm.phone);
      setFoundUser(data);
    } catch {
      addToast('User not found', 'error');
      setFoundUser(null);
    }
  };

  if (isLoading) return <PageLoader />;

  const cards = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('card.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{total} {t('common.items')}</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Link className="h-4 w-4" />{t('card.assign')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('card.assignTo')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input label="Card UID" value={assignForm.cardUid} onChange={(e) => setAssignForm({ ...assignForm, cardUid: e.target.value })} />
                <div className="flex gap-2">
                  <Input label={t('user.phone')} value={assignForm.phone} onChange={(e) => setAssignForm({ ...assignForm, phone: e.target.value })} />
                  <Button variant="outline" className="mt-6" onClick={searchUser}>Search</Button>
                </div>
                {foundUser && (
                  <div className="p-3 rounded-lg bg-slate-50">
                    <p className="font-medium">{foundUser.firstName} {foundUser.lastName}</p>
                    <p className="text-sm text-slate-500">{foundUser.phone}</p>
                  </div>
                )}
                <Button className="w-full" onClick={() => assignMutation.mutate({ cardUid: assignForm.cardUid, userId: foundUser?.id })}
                  disabled={!foundUser || assignMutation.isPending}>
                  {t('card.assign')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" />{t('card.create')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('card.create')}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input label={t('card.uid')} value={createForm.uid} onChange={(e) => setCreateForm({ ...createForm, uid: e.target.value })} />
                <Button className="w-full" onClick={() => createMutation.mutate(createForm)} disabled={createMutation.isPending}>
                  {t('common.create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <SearchInput value={search} onChange={setSearch} className="max-w-sm" placeholder="Search by UID..." />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('card.uid')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>{t('card.issuedAt')}</TableHead>
                <TableHead className="w-[140px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((card: any) => {
                const activeAssignment = card.assignments?.find((a: any) => a.status === 'ACTIVE');
                return (
                  <TableRow key={card.id}>
                    <TableCell><code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{card.uid}</code></TableCell>
                    <TableCell><Badge variant={getStatusColor(card.status) as any}>{getStatusLabel(card.status)}</Badge></TableCell>
                    <TableCell>
                      {activeAssignment
                        ? `${activeAssignment.user?.firstName || ''} ${activeAssignment.user?.lastName || ''}`
                        : <span className="text-slate-400">—</span>
                      }
                    </TableCell>
                    <TableCell className="text-slate-500">{formatDateShort(card.issuedAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {activeAssignment ? (
                          <Button variant="ghost" size="sm" onClick={() => unassignMutation.mutate(card.uid)}>
                            <Unlink className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {card.status !== 'BLOCKED' ? (
                          <Button variant="ghost" size="sm" onClick={() => blockMutation.mutate(card.uid)}>
                            <Ban className="h-4 w-4 text-danger" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {cards.length === 0 && (
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
