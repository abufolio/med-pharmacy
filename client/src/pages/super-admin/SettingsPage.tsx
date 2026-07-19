import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { PageLoader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToastStore } from '@/components/ui/toast';
import { formatDateShort } from '@/lib/utils';
import { Edit2, Plus } from 'lucide-react';
import type { Setting } from '@/types';

export function SettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [page, setPage] = useState(1);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [jsonValue, setJsonValue] = useState('{}');
  const [jsonError, setJsonError] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newScope, setNewScope] = useState('SYSTEM');

  const { data, isLoading } = useQuery({
    queryKey: ['settings', page],
    queryFn: () => settingApi.list({ page, limit: 20 }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, data }: { key: string; data: { value: Record<string, unknown> } }) =>
      settingApi.update(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setEditOpen(false);
      setEditingSetting(null);
      addToast('Setting updated', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const createMutation = useMutation({
    mutationFn: (data: { key: string; value: Record<string, unknown>; scope?: string }) =>
      settingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setCreateOpen(false);
      setNewKey('');
      setNewScope('SYSTEM');
      setJsonValue('{}');
      addToast('Setting created', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const handleEdit = (setting: Setting) => {
    setEditingSetting(setting);
    setJsonValue(JSON.stringify(setting.value, null, 2));
    setJsonError('');
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      setJsonError('');
      if (editingSetting) {
        updateMutation.mutate({ key: editingSetting.key, data: { value: parsed } });
      }
    } catch {
      setJsonError('Invalid JSON format');
    }
  };

  const handleCreate = () => {
    if (!newKey) {
      addToast('Key is required', 'error');
      return;
    }
    try {
      const parsed = JSON.parse(jsonValue);
      setJsonError('');
      createMutation.mutate({ key: newKey, value: parsed, scope: newScope || undefined });
    } catch {
      setJsonError('Invalid JSON format');
    }
  };

  if (isLoading) return <PageLoader />;

  const settings = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('common.settings')}</h1>
          <p className="text-sm text-slate-500 mt-1">{total} {t('common.items')}</p>
        </div>
        <Button onClick={() => { setCreateOpen(true); setJsonValue('{}'); setJsonError(''); }}>
          <Plus className="h-4 w-4" /> Add Setting
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Value Preview</TableHead>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead className="w-[80px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((setting: any) => (
                <TableRow key={setting.id}>
                  <TableCell className="font-mono font-medium text-sm">{setting.key}</TableCell>
                  <TableCell><Badge variant="outline">{setting.scope || '—'}</Badge></TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-[300px] truncate">
                    {JSON.stringify(setting.value).slice(0, 60)}...
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{formatDateShort(setting.createdAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(setting)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {settings.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">{t('common.noData')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {total > 20 && <Pagination page={page} total={total} limit={20} onPageChange={setPage} />}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Setting: {editingSetting?.key}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Value (JSON)</label>
              <textarea
                className="w-full h-48 p-3 border border-slate-300 rounded-lg font-mono text-sm"
                value={jsonValue}
                onChange={(e) => { setJsonValue(e.target.value); setJsonError(''); }}
              />
              {jsonError && <p className="text-xs text-danger mt-1">{jsonError}</p>}
            </div>
            <Button className="w-full" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Setting</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input label="Key" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. cashback_percent" />
            <Input label="Scope (optional)" value={newScope} onChange={(e) => setNewScope(e.target.value)} placeholder="SYSTEM" />
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Value (JSON)</label>
              <textarea
                className="w-full h-48 p-3 border border-slate-300 rounded-lg font-mono text-sm"
                value={jsonValue}
                onChange={(e) => { setJsonValue(e.target.value); setJsonError(''); }}
                defaultValue='{"defaultValue": 0}'
              />
              {jsonError && <p className="text-xs text-danger mt-1">{jsonError}</p>}
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
              {t('common.create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
