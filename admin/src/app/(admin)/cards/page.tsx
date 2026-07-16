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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CreditCard, Plus, ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

// ── Types matching server response ──
interface Card {
  id: string;
  uid: string;
  status: string;
  issuedAt: string;
  currentAssignment?: {
    id: string;
    status: string;
    assignedAt: string;
    user: { id: string; firstName: string; lastName: string; phone: string };
  };
}

// ── Schemas ──
const assignSchema = z.object({
  cardUid: z.string().min(4, 'Karta UIDni kiriting').max(32),
  userId: z.string().min(1, 'Foydalanuvchi ID ni kiriting'),
});

const createCardSchema = z.object({
  uid: z.string().min(4, 'Karta UIDni kiriting').max(32),
});

// ── Page ──
export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Create card dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Block
  const [blockCard, setBlockCard] = useState<Card | null>(null);
  const [blocking, setBlocking] = useState(false);

  const assignForm = useForm<z.infer<typeof assignSchema>>({
    resolver: zodResolver(assignSchema),
    defaultValues: { cardUid: '', userId: '' },
  });

  const createForm = useForm<z.infer<typeof createCardSchema>>({
    resolver: zodResolver(createCardSchema),
    defaultValues: { uid: '' },
  });

  // ── Fetch ──
  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      const res = await get<{ data: Card[]; total: number; page: number; limit: number }>(
        '/cards',
        params,
      );
      setCards(res.data.data);
      setTotal(res.data.total);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Kartalarni yuklashda xatolik',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  // ── Create card ──
  const handleCreate = async (values: z.infer<typeof createCardSchema>) => {
    setCreating(true);
    try {
      await post('/cards', { uid: values.uid });
      toast.success('Karta yaratildi');
      setCreateOpen(false);
      createForm.reset();
      fetchCards();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Yaratishda xatolik',
      );
    } finally {
      setCreating(false);
    }
  };

  // ── Assign card ──
  const handleAssign = async (values: z.infer<typeof assignSchema>) => {
    setAssigning(true);
    try {
      await post('/cards/assign', { cardUid: values.cardUid, userId: values.userId });
      toast.success('Karta muvaffaqiyatli biriktirildi');
      setAssignOpen(false);
      assignForm.reset();
      fetchCards();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Biriktirishda xatolik',
      );
    } finally {
      setAssigning(false);
    }
  };

  // ── Block card ──
  const handleBlock = async () => {
    if (!blockCard) return;
    setBlocking(true);
    try {
      await patch(`/cards/${blockCard.uid}/status`, { status: 'BLOCKED' });
      toast.success('Karta bloklandi');
      setBlockCard(null);
      fetchCards();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Bloklashda xatolik',
      );
    } finally {
      setBlocking(false);
    }
  };

  // ── Columns ──
  const columns: ColumnDef<Card>[] = [
    {
      accessorKey: 'uid',
      header: 'UID',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-mono text-sm font-medium">{row.original.uid}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Holat',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'user',
      header: 'Foydalanuvchi',
      cell: ({ row }) => {
        const u = row.original.currentAssignment?.user;
        if (!u) return <span className="text-sm text-muted-foreground">Biriktirilmagan</span>;
        return (
          <div>
            <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
            <p className="text-xs text-muted-foreground">{u.phone}</p>
          </div>
        );
      },
    },
    {
      id: 'assignedAt',
      header: 'Biriktirilgan',
      cell: ({ row }) => {
        const a = row.original.currentAssignment?.assignedAt;
        if (!a) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <span className="text-xs text-muted-foreground">
            {format(new Date(a), 'dd MMM yyyy', { locale: uz })}
          </span>
        );
      },
    },
    {
      accessorKey: 'issuedAt',
      header: 'Yaratilgan',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.original.issuedAt), 'dd MMM yyyy', { locale: uz })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const card = row.original;
        return (
          <div className="flex items-center gap-1 justify-end">
            {card.status === 'ACTIVE' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-destructive"
                onClick={() => setBlockCard(card)}
              >
                <ShieldAlert className="h-3 w-3 mr-1" />
                Bloklash
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="NFC Kartalar"
        description="Barcha NFC kartalarni boshqarish, biriktirish va bloklash"
      >
        <Button variant="outline" size="sm" onClick={() => { createForm.reset(); setCreateOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Yangi karta
        </Button>
        <Button size="sm" onClick={() => { assignForm.reset(); setAssignOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Karta biriktirish
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={cards}
        isLoading={isLoading}
        error={error}
        pageCount={Math.ceil(total / limit)}
        pageIndex={page - 1}
        pageSize={limit}
        onPageChange={(p) => setPage(p + 1)}
        onPageSizeChange={(s) => { setLimit(s); setPage(1); }}
        searchable
        searchQuery={search}
        searchPlaceholder="Karta UID yoki foydalanuvchi..."
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onRetry={fetchCards}
        emptyMessage="Karta topilmadi"
        emptyDescription="Yangi karta qoʻshish yoki biriktirish uchun tugmani bosing"
      />

      {/* Create Card Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Yangi NFC karta</DialogTitle>
            <DialogDescription>Tizimga yangi kartani qoʻshish</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="uid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Karta UID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="04A2B3C4D5" className="font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Yaratilmoqda...' : 'Yaratish'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Karta biriktirish</DialogTitle>
            <DialogDescription>NFC kartani foydalanuvchiga biriktirish</DialogDescription>
          </DialogHeader>
          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit(handleAssign)} className="space-y-4">
              <FormField
                control={assignForm.control}
                name="cardUid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Karta UID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="04A2B3C4D5" className="font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assignForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foydalanuvchi ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="UUID" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={assigning}>
                  {assigning ? 'Biriktirilmoqda...' : 'Biriktirish'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Block Confirmation */}
      <Dialog open={!!blockCard} onOpenChange={() => setBlockCard(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Kartani bloklash</DialogTitle>
            <DialogDescription>
              {blockCard && (
                <span className="font-mono text-xs">{blockCard.uid}</span>
              )} - bu karta bloklanadi
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setBlockCard(null)}>
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={blocking}
            >
              {blocking ? 'Bloklanmoqda...' : 'Bloklash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
