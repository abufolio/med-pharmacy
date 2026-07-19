import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashbackRuleApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PageLoader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToastStore } from '@/components/ui/toast';
import { formatDateShort, formatCurrency } from '@/lib/utils';
import { Plus, Edit2, Power, PowerOff } from 'lucide-react';
import type { CashbackRuleType } from '@/types';

export function PharmacyCashbackRulesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ type: 'PERCENT' as CashbackRuleType, value: 0, minPurchase: 0, maxCashback: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ['pharmacy-cashback-rules', user?.pharmacyId],
    queryFn: () => cashbackRuleApi.listByPharmacy(user?.pharmacyId || ''),
    enabled: !!user?.pharmacyId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      if (!user?.pharmacyId) throw new Error('No pharmacy');
      return cashbackRuleApi.createForPharmacy(user.pharmacyId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-cashback-rules'] });
      setCreateOpen(false);
      setForm({ type: 'PERCENT', value: 0, minPurchase: 0, maxCashback: 0 });
      addToast('Rule created', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => cashbackRuleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-cashback-rules'] });
      setEditOpen(false);
      setEditingId(null);
      addToast('Rule updated', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => cashbackRuleApi.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-cashback-rules'] });
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  if (isLoading) return <PageLoader />;

  const rules = (data as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('cashback.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{rules.length} {t('common.items')}</p>
        </div>
        <Button onClick={() => { setCreateOpen(true); setForm({ type: 'PERCENT', value: 0, minPurchase: 0, maxCashback: 0 }); }}>
          <Plus className="h-4 w-4" />{t('cashback.create')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('cashback.type')}</TableHead>
                <TableHead>{t('cashback.value')}</TableHead>
                <TableHead>{t('cashback.minPurchase')}</TableHead>
                <TableHead>{t('cashback.maxCashback')}</TableHead>
                <TableHead>{t('cashback.active')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule: any) => (
                <TableRow key={rule.id}>
                  <TableCell><Badge variant={rule.type === 'PERCENT' ? 'info' : rule.type === 'FIXED' ? 'warning' : 'success'}>{rule.type}</Badge></TableCell>
                  <TableCell className="font-medium">{rule.type === 'PERCENT' ? `${rule.value}%` : formatCurrency(rule.value)}</TableCell>
                  <TableCell>{rule.minPurchase ? formatCurrency(rule.minPurchase) : '—'}</TableCell>
                  <TableCell>{rule.maxCashback ? formatCurrency(rule.maxCashback) : '—'}</TableCell>
                  <TableCell><Badge variant={rule.isActive ? 'success' : 'outline'}>{rule.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell className="text-slate-500">{formatDateShort(rule.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingId(rule.id);
                        setForm({ type: rule.type, value: rule.value, minPurchase: rule.minPurchase || 0, maxCashback: rule.maxCashback || 0 });
                        setEditOpen(true);
                      }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}>
                        {rule.isActive ? <PowerOff className="h-4 w-4 text-warning" /> : <Power className="h-4 w-4 text-success" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">{t('common.noData')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('cashback.create')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select label={t('cashback.type')} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CashbackRuleType })}
              options={[
                { value: 'PERCENT', label: t('cashback.percent') },
                { value: 'FIXED', label: t('cashback.fixed') },
                { value: 'CAMPAIGN', label: t('cashback.campaign') },
              ]}
            />
            <Input label={t('cashback.value')} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
            <Input label={t('cashback.minPurchase')} type="number" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: Number(e.target.value) })} />
            <Input label={t('cashback.maxCashback')} type="number" value={form.maxCashback} onChange={(e) => setForm({ ...form, maxCashback: Number(e.target.value) })} />
            <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
              {t('common.create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('cashback.edit')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select label={t('cashback.type')} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CashbackRuleType })}
              options={[
                { value: 'PERCENT', label: t('cashback.percent') },
                { value: 'FIXED', label: t('cashback.fixed') },
                { value: 'CAMPAIGN', label: t('cashback.campaign') },
              ]}
            />
            <Input label={t('cashback.value')} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
            <Input label={t('cashback.minPurchase')} type="number" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: Number(e.target.value) })} />
            <Input label={t('cashback.maxCashback')} type="number" value={form.maxCashback} onChange={(e) => setForm({ ...form, maxCashback: Number(e.target.value) })} />
            <Button className="w-full" onClick={() => editingId && updateMutation.mutate({ id: editingId, data: form })} disabled={updateMutation.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
