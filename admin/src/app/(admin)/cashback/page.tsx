'use client';

import { useState, useCallback, useEffect } from 'react';
import { get, post, patch, del } from '@/lib/api/client';
import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { ChartCard } from '@/components/shared/chart-card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Percent, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

// ── Types ──
interface CashbackRule {
  id: string;
  type: string;
  value: number;
  minPurchase: number | null;
  maxCashback: number | null;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
  pharmacy?: { id: string; name: string };
  pharmacyId?: string;
}

// ── Schema ──
const ruleSchema = z.object({
  type: z.enum(['PERCENT', 'FIXED', 'CAMPAIGN']),
  value: z.coerce.number().min(0, 'Qiymat 0 dan katta').max(100, 'Foiz 100 dan oshmasligi kerak'),
  minPurchase: z.coerce.number().min(0).optional().or(z.literal(0)),
  maxCashback: z.coerce.number().min(0).optional().or(z.literal(0)),
  isActive: z.boolean().default(true),
  validFrom: z.string().optional().or(z.literal('')),
  validTo: z.string().optional().or(z.literal('')),
});

type RuleForm = z.infer<typeof ruleSchema>;

const f = (n: number) => n.toLocaleString('uz-UZ');

// ── Page ──
export default function CashbackPage() {
  const [rules, setRules] = useState<CashbackRule[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    activeRules: 0,
    totalRules: 0,
    averagePercent: 0,
    maxCashbackGlobal: 20,
  });

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CashbackRule | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema as any),
    defaultValues: {
      type: 'PERCENT',
      value: 5,
      minPurchase: 0,
      maxCashback: 0,
      isActive: true,
      validFrom: '',
      validTo: '',
    },
  });

  // ── Fetch ──
  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page: String(page), limit: String(limit) };
      const res = await get<{ data: CashbackRule[]; total: number; page: number; limit: number }>(
        '/cashbacks/rules',
        params,
      );
      setRules(res.data.data);
      setTotal(res.data.total);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Cashback qoidalarini yuklashda xatolik',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  // ── Submit ──
  const handleSubmit = async (values: RuleForm) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type: values.type,
        value: values.value,
        minPurchase: values.minPurchase || 0,
        maxCashback: values.maxCashback || undefined,
        isActive: values.isActive,
        validFrom: values.validFrom || undefined,
        validTo: values.validTo || undefined,
      };

      if (editing) {
        await patch(`/cashbacks/rules/${editing.id}`, payload);
        toast.success('Qoida yangilandi');
      } else {
        await post('/cashbacks/rules', payload);
        toast.success('Yangi qoida yaratildi');
      }
      setDialogOpen(false);
      form.reset();
      setEditing(null);
      fetchRules();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Xatolik yuz berdi',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open Edit ──
  const openEdit = (rule: CashbackRule) => {
    setEditing(rule);
    form.reset({
      type: rule.type as any,
      value: rule.value,
      minPurchase: rule.minPurchase || 0,
      maxCashback: rule.maxCashback || 0,
      isActive: rule.isActive,
      validFrom: rule.validFrom ? rule.validFrom.split('T')[0] : '',
      validTo: rule.validTo ? rule.validTo.split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({
      type: 'PERCENT',
      value: 5,
      minPurchase: 0,
      maxCashback: 0,
      isActive: true,
      validFrom: '',
      validTo: '',
    });
    setDialogOpen(true);
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    if (!confirm('Bu qoidani oʻchirishni xohlaysizmi?')) return;
    try {
      await del(`/cashbacks/rules/${id}`);
      toast.success('Qoida oʻchirildi');
      fetchRules();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Oʻchirishda xatolik',
      );
    }
  };

  // ── Columns ──
  const columns: ColumnDef<CashbackRule>[] = [
    {
      accessorKey: 'type',
      header: 'Tur',
      cell: ({ row }) => <StatusBadge status={row.original.type} />,
    },
    {
      accessorKey: 'value',
      header: 'Qiymat',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.type === 'PERCENT' ? `${row.original.value}%` : `${f(Number(row.original.value))} soʻm`}
        </span>
      ),
    },
    {
      accessorKey: 'minPurchase',
      header: 'Min. xarid',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.minPurchase ? `${f(Number(row.original.minPurchase))} soʻm` : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'maxCashback',
      header: 'Maks cashback',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.maxCashback ? `${f(Number(row.original.maxCashback))} soʻm` : 'Cheksiz'}
        </span>
      ),
    },
    {
      id: 'period',
      header: 'Amal qilish muddati',
      cell: ({ row }) => {
        const r = row.original;
        if (!r.validFrom && !r.validTo) return <span className="text-sm text-muted-foreground">Cheksiz</span>;
        return (
          <span className="text-xs text-muted-foreground">
            {r.validFrom ? format(new Date(r.validFrom), 'dd.MM.yyyy', { locale: uz }) : '...'} —{' '}
            {r.validTo ? format(new Date(r.validTo), 'dd.MM.yyyy', { locale: uz }) : '...'}
          </span>
        );
      },
    },
    {
      id: 'pharmacy',
      header: 'Dorixona',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.pharmacy?.name || 'Global'}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Faol',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'YES' : 'NO'} />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row.original)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cashback boshqaruvi"
        description="Cashback qoidalari va global cheklovlar"
        action={{ label: 'Yangi qoida', onClick: openCreate, icon: <Plus className="h-4 w-4" /> }}
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <ChartCard title="Faol qoidalar">
          <p className="text-2xl font-bold">{rules.filter((r) => r.isActive).length}</p>
        </ChartCard>
        <ChartCard title="Jami qoidalar">
          <p className="text-2xl font-bold">{total}</p>
        </ChartCard>
        <ChartCard title="Global maks. foiz">
          <p className="text-2xl font-bold">{stats.maxCashbackGlobal}%</p>
        </ChartCard>
        <ChartCard title="Oʻrtacha foiz">
          <p className="text-2xl font-bold">
            {rules.filter((r) => r.type === 'PERCENT' && r.isActive).length > 0
              ? `${(rules.filter((r) => r.type === 'PERCENT' && r.isActive).reduce((a, r) => a + Number(r.value), 0) / rules.filter((r) => r.type === 'PERCENT' && r.isActive).length).toFixed(1)}%`
              : '—'}
          </p>
        </ChartCard>
      </div>

      <DataTable
        columns={columns}
        data={rules}
        isLoading={isLoading}
        error={error}
        pageCount={Math.ceil(total / limit)}
        pageIndex={page - 1}
        pageSize={limit}
        onPageChange={(p) => setPage(p + 1)}
        onPageSizeChange={(s) => { setLimit(s); setPage(1); }}
        onRetry={fetchRules}
        emptyMessage="Cashback qoidasi topilmadi"
        emptyDescription="Yangi qoida qoʻshish uchun tugmani bosing"
      />

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Qoidani tahrirlash' : 'Yangi cashback qoidasi'}</DialogTitle>
            <DialogDescription>Cashback hisoblash qoidalarini belgilang</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cashback turi</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value="PERCENT">Foizli (%)</option>
                        <option value="FIXED">Qatʼiy (soʻm)</option>
                        <option value="CAMPAIGN">Aksiya</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch('type') === 'PERCENT' ? 'Foiz qiymati (%)' : 'Cashback summasi (soʻm)'}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minPurchase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min. xarid (soʻm)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxCashback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maks. cashback (soʻm)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amal qilish boshlanishi</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="validTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amal qilish tugashi</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Faol</FormLabel>
                      <p className="text-xs text-muted-foreground">Qoida darhol qoʻllanilsin</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saqlanmoqda...' : editing ? 'Yangilash' : 'Yaratish'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
