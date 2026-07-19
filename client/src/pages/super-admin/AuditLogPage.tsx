import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/lib/api-services';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { PageLoader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDateShort } from '@/lib/utils';
import { Eye, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AuditLog } from '@/types';

export function AuditLogPage() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page],
    queryFn: () => auditApi.list({ page, limit: 20 }),
  });

  if (isLoading) return <PageLoader />;

  const logs = data?.data || [];
  const total = data?.total || 0;

  const actionColors: Record<string, string> = {
    CREATE: 'success',
    UPDATE: 'info',
    DELETE: 'danger',
    LOGIN: 'warning',
    LOGOUT: 'outline',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.audit')}</h1>
          <p className="text-sm text-slate-500 mt-1">{total} {t('common.items')}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="w-[80px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-slate-500 whitespace-nowrap">{formatDateShort(log.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={(actionColors[log.action] || 'outline') as any}>{log.action}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.entity}
                    {log.entityId && <span className="text-slate-400 text-xs ml-1">#{log.entityId.slice(0, 6)}</span>}
                  </TableCell>
                  <TableCell>{log.actorType}{log.actorId ? ` (${log.actorId.slice(0, 6)}...)` : ''}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-400">{log.ipAddress || '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedLog(log); setDetailOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">{t('common.noData')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {total > 20 && <Pagination page={page} total={total} limit={20} onPageChange={setPage} />}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Audit Log Detail</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Action:</span><p className="font-medium">{selectedLog.action}</p></div>
                <div><span className="text-slate-500">Entity:</span><p className="font-medium">{selectedLog.entity}</p></div>
                <div><span className="text-slate-500">Actor:</span><p className="font-medium">{selectedLog.actorType}</p></div>
                <div><span className="text-slate-500">Date:</span><p className="font-medium">{formatDateShort(selectedLog.createdAt)}</p></div>
                {selectedLog.ipAddress && (
                  <div><span className="text-slate-500">IP:</span><p className="font-medium">{selectedLog.ipAddress}</p></div>
                )}
              </div>

              {selectedLog.oldValue && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Code className="h-4 w-4" /> Old Value
                  </div>
                  <pre className="bg-slate-50 rounded-lg p-3 text-xs font-mono max-h-40 overflow-auto whitespace-pre">
                    {JSON.stringify(selectedLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.newValue && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Code className="h-4 w-4" /> New Value
                  </div>
                  <pre className="bg-slate-50 rounded-lg p-3 text-xs font-mono max-h-40 overflow-auto whitespace-pre">
                    {JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
