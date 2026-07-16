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
import { Plus, Edit, Trash2, Copy, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

// ── Types ──
interface Promocode {
  id: string;
  code: string;
  type: string;
  value: number;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
}

// ── Schema matching server DTO ──
const promocodeSchema = z.object({
  code: z.string().min(3, 'Kod kamida 3 belgi').max(50).toUpperCase(),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.coerce.number().min(1, 'Qiymat 1 dan katta'),
  usageLimit: z.coerce.number().min(1).optional().or(z.literal(0)),
  isActive: z.boolean().default(true),
  validFrom: z.string().optional().or(z.literal('')),
  validTo: z.string().optional().or(z.literal('')),
});

type PromocodeForm = z.infer<typeof promocodeSchema>;

const f = (n: number) => n.toLocaleString('uz-UZ');

// ── Page ──
export default function PromocodesPage() {
  const [data, setData] = useState<Promocode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Promocode | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PromocodeForm>({
    resolver: zodResolver(promocodeSchema as any),
    defaultValues: {
      code: '',
      type: 'PERCENT',
      value: 10,
      usageLimit: 100,
      isActive: true,
      validFrom: '',
      validTo: '',
    },
  });

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page: String(page), limit: String(limit) };
      const res = await get<{ data: Promocode[]; total: number; page: number; limit: number }>(
        '/promocodes',
        params,
      );
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Promokodlarni yuklashda xatolik',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Submit ──
  const handleSubmit = async (values: PromocodeForm) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        code: values.code,
        type: values.type,
        value: values.value,
        usageLimit: values.usageLimit || undefined,
        isActive: values.isActive,
        validFrom: values.validFrom || undefined,
        validTo: values.validTo || undefined,
      };

      if (editing) {
        await patch(`/promocodes/${editing.id}`, payload);
        toast.success('Promokod yangilandi');
      } else {
        await post('/promocodes', payload);
        toast.success('Promokod yaratildi');
      }
      setDialogOpen(false);
      form.reset();
      setEditing(null);
      fetchData();
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
  const openEdit = (item: Promocode) => {
    setEditing(item);
    form.reset({
      code: item.code,
      type: item.type as any,
      value: item.value,
      usageLimit: item.usageLimit || 0,
      isActive: item.isActive,
      validFrom: item.validFrom ? item.validFrom.split('T')[0] : '',
      validTo: item.validTo ? item.validTo.split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({
      code: '',
      type: 'PERCENT',
      value: 10,
      usageLimit: 100,
      isActive: true,
      validFrom: '',
      validTo: '',
    });
    setDialogOpen(true);
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    if (!confirm('Bu promokodni oʻchirishni xohlaysizmi?')) return;
    try {
      await del(`/promocodes/${id}`);
      toast.success('Promokod oʻchirildi');
      fetchData();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Oʻchirishda xatolik',
      );
    }
  };

  // ── Copy code ──
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('Kod nusxalandi');
    });
  };

  // ── Columns ──
  const columns: ColumnDef<Promocode>[] = [
    {
      accessorKey: 'code',
      header: 'Kod',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm tracking-wider uppercase">{row.original.code}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(row.original.code)}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Chegirma turi',
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
      id: 'usage',
      header: 'Ishlatilgan',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.usedCount}
          {row.original.usageLimit ? ` / ${row.original.usageLimit}` : ''}
        </span>
      ),
    },
    {
      id: 'validity',
      header: 'Amal qilish muddati',
      cell: ({ row }) => {
        const r = row.original;
        if (!r.validFrom && !r.validTo) return <span className="text-sm text-muted-foreground">Cheksiz</span>;
        return (
          <span className="text-xs text-muted-foreground">
            {r.validFrom ? format(new Date(r.validFrom), 'dd.MM.yyyy', { locale: uz }) : '...'}
            {' — '}
            {r.validTo ? format(new Date(r.validTo), 'dd.MM.yyyy', { locale: uz }) : '...'}
          </span>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Faol',
      cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'YES' : 'NO'} />,
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
        title="Promo kodlar"
        description="Promo kodlar va chegirmalarni boshqarish"
        action={{ label: 'Yangi promokod', onClick: openCreate, icon: <Plus className="h-4 w-4" /> }}
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <ChartCard title="Faol kodlar">
          <p className="text-2xl font-bold">{data.filter((r) => r.isActive).length}</p>
        </ChartCard>
        <ChartCard title="Jami kodlar">
          <p className="text-2xl font-bold">{total}</p>
        </ChartCard>
        <ChartCard title="Jami ishlatilgan">
          <p className="text-2xl font-bold">{data.reduce((a, r) => a + Number(r.usedCount), 0)}</p>
        </ChartCard>
        <ChartCard title="Oʻrtacha chegirma">
          <p className="text-2xl font-bold">
            {data.filter((r) => r.type === 'PERCENT').length > 0
              ? `${(data.filter((r) => r.type === 'PERCENT').reduce((a, r) => a + Number(r.value), 0) / data.filter((r) => r.type === 'PERCENT').length).toFixed(0)}%`
              : '—'}
          </p>
        </ChartCard>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        error={error}
        pageCount={Math.ceil(total / limit)}
        pageIndex={page - 1}
        pageSize={limit}
        onPageChange={(p) => setPage(p + 1)}
        onPageSizeChange={(s) => { setLimit(s); setPage(1); }}
        onRetry={fetchData}
        emptyMessage="Promokod topilmadi"
        emptyDescription="Yangi promokod qoʻshish uchun tugmani bosing"
      />

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Promokodni tahrirlash' : 'Yangi promokod'}</DialogTitle>
            <DialogDescription>Chegirma kodini yarating yoki tahrirlang</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promokod</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="SUMMER2025" className="font-mono uppercase" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chegirma turi</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value="PERCENT">Foizli (%)</option>
                        <option value="FIXED">Qatʼiy (soʻm)</option>
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
                      {form.watch('type') === 'PERCENT' ? 'Chegirma foizi (%)' : 'Chegirma summasi (soʻm)'}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="usageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maks. foydalanish</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>
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
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Faol</FormLabel>
                      <p className="text-xs text-muted-foreground">Foydalanuvchilar bu kodni ishlata olishadi</p>
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
