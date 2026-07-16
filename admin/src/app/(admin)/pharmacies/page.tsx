'use client';

import { useState, useCallback, useEffect } from 'react';
import { get, post, patch } from '@/lib/api/client';
import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, Building2, MapPin, Phone, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

// ── Types ──
interface Pharmacy {
  id: string;
  name: string;
  address: string | null;
  phone: string;
  login: string;
  status: string;
  district?: { id: string; name: string; region?: { id: string; name: string } };
  employeesCount?: number;
  transactionsCount?: number;
  cashbackSum?: number;
  createdAt: string;
  updatedAt: string;
}

interface Region {
  id: string;
  name: string;
  districts: { id: string; name: string }[];
}

// ── Schema ──
const pharmacySchema = z.object({
  name: z.string().min(2, 'Nomi kamida 2 belgi').max(200),
  districtId: z.string().uuid('Hududni tanlang'),
  address: z.string().max(300).optional().or(z.literal('')),
  phone: z.string().regex(/^\+998\d{9}$/, 'Telefon +998XXXXXXXXX formatida'),
});

type PharmacyForm = z.infer<typeof pharmacySchema>;

// ── Page ──
export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Pharmacy | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Detail
  const [detail, setDetail] = useState<Pharmacy | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Regions
  const [regions, setRegions] = useState<Region[]>([]);

  const form = useForm<PharmacyForm>({
    resolver: zodResolver(pharmacySchema),
    defaultValues: { name: '', districtId: '', address: '', phone: '+998' },
  });

  // ── Fetch pharmacists ──
  const fetchPharmacies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      const res = await get<{ data: Pharmacy[]; total: number; page: number; limit: number }>(
        '/pharmacies',
        params,
      );
      setPharmacies(res.data.data);
      setTotal(res.data.total);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Dorixonalarni yuklashda xatolik',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => { fetchPharmacies(); }, [fetchPharmacies]);

  // ── Fetch regions ──
  useEffect(() => {
    get<Region[]>('/regions').then((res) => {
      if (res.data) setRegions(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
  }, []);

  // ── Helpers ──
  const generateLogin = () => 'ph_' + Math.random().toString(36).substring(2, 8);
  const generatePassword = () => Math.random().toString(36).substring(2, 10) + 'A1!';

  // ── Create / Update ──
  const handleSubmit = async (values: PharmacyForm) => {
    setSubmitting(true);
    try {
      if (editing) {
        await patch(`/pharmacies/${editing.id}`, values);
        toast.success('Dorixona yangilandi');
      } else {
        const login = generateLogin();
        const password = generatePassword();
        const res = await post<{ id: string; login: string }>('/pharmacies', {
          ...values,
          login,
          password,
        });
        toast.success('Dorixona yaratildi', {
          description: `Login: ${res.data.login}\nParol: ${password}`,
          duration: 10000,
        });
      }
      setDialogOpen(false);
      form.reset();
      setEditing(null);
      fetchPharmacies();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Xatolik yuz berdi',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Suspend (soft-delete via status) ──
  const handleSuspend = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await patch(`/pharmacies/${deleteId}/status`, { status: 'SUSPENDED' });
      toast.success('Dorixona toʻxtatildi');
      setDeleteId(null);
      fetchPharmacies();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Toʻxtatishda xatolik',
      );
    } finally {
      setDeleting(false);
    }
  };

  // ── Edit handler ──
  const openEdit = (pharmacy: Pharmacy) => {
    setEditing(pharmacy);
    form.reset({
      name: pharmacy.name,
      districtId: pharmacy.district?.id || '',
      address: pharmacy.address || '',
      phone: pharmacy.phone,
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: '', districtId: '', address: '', phone: '+998' });
    setDialogOpen(true);
  };

  // ── Columns ──
  const columns: ColumnDef<Pharmacy>[] = [
    {
      accessorKey: 'name',
      header: 'Nomi',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Telefon',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.phone}</span>
      ),
    },
    {
      id: 'location',
      header: 'Hudud',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.district?.region?.name}, {row.original.district?.name}
        </span>
      ),
    },
    {
      accessorKey: 'employeesCount',
      header: 'Xodimlar',
      cell: ({ row }) => <span className="text-sm">{row.original.employeesCount ?? 0}</span>,
    },
    {
      accessorKey: 'transactionsCount',
      header: 'Tranzaksiyalar',
      cell: ({ row }) => <span className="text-sm">{row.original.transactionsCount ?? 0}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Holat',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Qoʻshilgan',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy', { locale: uz })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => { setDetail(row.original); setDetailOpen(true); }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => setDeleteId(row.original.id)}
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
        title="Dorixonalar"
        description="Barcha dorixonalarni boshqarish, qoʻshish va tahrirlash"
        action={{ label: 'Yangi dorixona', onClick: openCreate, icon: <Plus className="h-4 w-4" /> }}
      />

      <DataTable
        columns={columns}
        data={pharmacies}
        isLoading={isLoading}
        error={error}
        pageCount={Math.ceil(total / limit)}
        pageIndex={page - 1}
        pageSize={limit}
        onPageChange={(p) => setPage(p + 1)}
        onPageSizeChange={(s) => { setLimit(s); setPage(1); }}
        searchable
        searchQuery={search}
        searchPlaceholder="Dorixona nomi yoki telefon..."
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onRetry={fetchPharmacies}
        emptyMessage="Dorixona topilmadi"
        emptyDescription="Yangi dorixona qoʻshish uchun tugmani bosing"
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Dorixonani tahrirlash' : 'Yangi dorixona qoʻshish'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Dorixona maʼlumotlarini yangilang'
                : 'Yangi dorixona maʼlumotlarini kiriting. Avtomatik login yaratiladi.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dorixona nomi</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Masalan: Hayot Dorixona" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="districtId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hudud</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Hududni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.map((region) => (
                          <div key={region.id}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              {region.name}
                            </div>
                            {region.districts.map((district) => (
                              <SelectItem key={district.id} value={district.id}>
                                {district.name}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manzil</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Dorixona manzili" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+998901234567" />
                    </FormControl>
                    <FormMessage />
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

      {/* Suspend Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dorixonani toʻxtatish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu dorixona va unga tegishli barcha maʼlumotlar toʻxtatiladi. Xodimlar tizimga kira olmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend} disabled={deleting} className="bg-destructive">
              {deleting ? 'Toʻxtatilmoqda...' : 'Toʻxtatish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
            <DialogDescription>Dorixona haqida batafsil maʼlumot</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={detail.status} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Login</p>
                  <p className="font-mono">{detail.login}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Telefon</p>
                  <p>{detail.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Hudud</p>
                  <p>{detail.district?.region?.name}, {detail.district?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Manzil</p>
                  <p>{detail.address || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Xodimlar</p>
                  <p>{detail.employeesCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Tranzaksiyalar</p>
                  <p>{detail.transactionsCount ?? 0}</p>
                </div>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Qoʻshilgan: {format(new Date(detail.createdAt), 'dd MMM yyyy, HH:mm', { locale: uz })}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
