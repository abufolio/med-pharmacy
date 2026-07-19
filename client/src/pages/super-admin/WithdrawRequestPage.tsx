import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { withdrawApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { PageLoader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { useToastStore } from '@/components/ui/toast';
import { formatDateShort, formatCurrency } from '@/lib/utils';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import type { WithdrawRequest } from '@/types';

const statusColors: Record<string, string> = {
  PENDING: 'warning',
  APPROVED: 'info',
  REJECTED: 'danger',
  PAID: 'success',
};

export function WithdrawRequestPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | 'PAID'>('APPROVED');

  const { data, isLoading } = useQuery({
    queryKey: ['withdrawals', page],
    queryFn: () => withdrawApi.list({ page, limit: 20 }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: 'APPROVED' | 'REJECTED' | 'PAID'; reason?: string } }) =>
      withdrawApi.review(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      setDetailOpen(false);
      setSelectedRequest(null);
      addToast('Request reviewed', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  if (isLoading) return <PageLoader />;

  const requests = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('nav.withdrawals')}</h1>
          <p className="text-sm text-slate-500 mt-1">{total} {t('common.items')}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('user.firstName')}</TableHead>
                <TableHead>{t('wallet.amount')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req: any) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">
                    {req.user ? `${req.user.firstName} ${req.user.lastName}` : '—'}
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(req.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={(statusColors[req.status] || 'outline') as any}>{req.status}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDateShort(req.createdAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedRequest(req); setDetailOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">{t('common.noData')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {total > 20 && <Pagination page={page} total={total} limit={20} onPageChange={setPage} />}
      </Card>

      {/* Review Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Withdraw Request Review</DialogTitle></DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">{t('user.firstName')}:</span>
                  <p className="font-medium">{selectedRequest.user?.firstName} {selectedRequest.user?.lastName}</p>
                </div>
                <div>
                  <span className="text-slate-500">{t('user.phone')}:</span>
                  <p className="font-medium">{selectedRequest.user?.phone}</p>
                </div>
                <div>
                  <span className="text-slate-500">{t('wallet.amount')}:</span>
                  <p className="font-medium text-lg text-primary-600">{formatCurrency(selectedRequest.amount)}</p>
                </div>
                <div>
                  <span className="text-slate-500">{t('common.status')}:</span>
                  <Badge variant={(statusColors[selectedRequest.status] || 'outline') as any}>{selectedRequest.status}</Badge>
                </div>
                <div>
                  <span className="text-slate-500">{t('common.date')}:</span>
                  <p className="font-medium">{formatDateShort(selectedRequest.createdAt)}</p>
                </div>
              </div>

              {selectedRequest.status === 'PENDING' && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <Select
                    label="Action"
                    value={reviewAction}
                    onChange={(e) => setReviewAction(e.target.value as any)}
                    options={[
                      { value: 'APPROVED', label: 'Approve' },
                      { value: 'REJECTED', label: 'Reject' },
                      { value: 'PAID', label: 'Mark as Paid' },
                    ]}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant={reviewAction === 'REJECTED' ? 'destructive' : 'default'}
                      className="flex-1"
                      onClick={() => reviewMutation.mutate({ id: selectedRequest.id, data: { status: reviewAction } })}
                      disabled={reviewMutation.isPending}
                    >
                      {reviewAction === 'APPROVED' && <><CheckCircle className="h-4 w-4" /> Approve</>}
                      {reviewAction === 'REJECTED' && <><XCircle className="h-4 w-4" /> Reject</>}
                      {reviewAction === 'PAID' && <><CheckCircle className="h-4 w-4" /> Mark Paid</>}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
