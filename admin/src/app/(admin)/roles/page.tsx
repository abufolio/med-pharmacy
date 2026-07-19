'use client';

import { useState, useCallback, useEffect } from 'react';
import { get, post, patch, del } from '@/lib/api/client';
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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Shield, ShieldAlert, UserCog } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

// ── Types (employees with roles) ──
interface Employee {
  id: string;
  login: string;
  fullName: string;
  role: string;
  pharmacyId?: string | null;
  pharmacy?: { id: string; name: string } | null;
  isActive: boolean;
  createdAt: string;
}

// ── Schema ──
const employeeSchema = z.object({
  login: z.string().min(3, 'Login kamida 3 belgi').max(64),
  password: z.string().min(6, 'Parol kamida 6 belgi').max(128).optional().or(z.literal('')),
  fullName: z.string().min(2, 'Ism kamida 2 belgi').max(128),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

const f = (n: number) => n.toLocaleString('uz-UZ');

// ── Page ──
export default function RolesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema as any),
    defaultValues: {
      login: '',
      password: '',
      fullName: '',
    },
  });

  // ── Fetch ──
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await get<{ data: Employee[]; total: number; page: number; limit: number }>(
        '/employees',
        { page: String(page), limit: String(limit) },
      );
      setEmployees(res.data.data);
      setTotal(res.data.total);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Xodimlarni yuklashda xatolik',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // ── Submit ──
  const handleSubmit = async (values: EmployeeForm) => {
    setSubmitting(true);
    try {
      if (editing) {
        await patch(`/employees/${editing.id}`, {
          fullName: values.fullName,
          login: values.login,
        });
        toast.success('Xodim yangilandi');
      } else {
        await post('/auth/register-employee', {
          login: values.login,
          password: values.password,
          fullName: values.fullName,
        });
        toast.success('Yangi xodim yaratildi');
      }
      setDialogOpen(false);
      form.reset();
      setEditing(null);
      fetchEmployees();
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
  const openEdit = (emp: Employee) => {
    setEditing(emp);
    form.reset({
      login: emp.login,
      password: '',
      fullName: emp.fullName,
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ login: '', password: '', fullName: '' });
    setDialogOpen(true);
  };

  // ── Suspend ──
  const handleSuspend = async (emp: Employee) => {
    if (!confirm(`"${emp.fullName}" xodimini toʻxtatishni xohlaysizmi?`)) return;
    try {
      await post(`/employees/${emp.id}/suspend`);
      toast.success('Xodim toʻxtatildi');
      fetchEmployees();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Xatolik',
      );
    }
  };

  // ── Activate ──
  const handleActivate = async (emp: Employee) => {
    try {
      await post(`/employees/${emp.id}/activate`);
      toast.success('Xodim faollashtirildi');
      fetchEmployees();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Xatolik',
      );
    }
  };

  // ── Columns ──
  const columns: ColumnDef<Employee>[] = [
    {
      id: 'name',
      header: 'Xodim',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
            {row.original.fullName?.charAt(0) || '?'}
          </div>
          <div>
            <p className="text-sm font-medium">{row.original.fullName}</p>
            <p className="text-xs text-muted-foreground">@{row.original.login}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }) => <StatusBadge status={row.original.role} />,
    },
    {
      id: 'pharmacy',
      header: 'Dorixona',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.pharmacy?.name || '—'}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Holat',
      cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'ACTIVE' : 'SUSPENDED'} />,
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
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(emp)}>
              <Edit className="h-4 w-4" />
            </Button>
            {emp.isActive ? (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleSuspend(emp)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="h-8 text-emerald-600" onClick={() => handleActivate(emp)}>
                Faollashtirish
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Xodimlar va ruxsatlar" description="Xodimlarni boshqarish va rollar" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldAlert className="h-10 w-10 text-destructive mb-3" />
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchEmployees}>
              Qayta urinish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xodimlar va ruxsatlar"
        description="Xodimlarni boshqarish, rollar va ruxsatlar matritsasi"
        action={{ label: 'Yangi xodim', onClick: openCreate, icon: <Plus className="h-4 w-4" /> }}
      />

      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        error={error}
        pageCount={Math.ceil(total / limit)}
        pageIndex={page - 1}
        pageSize={limit}
        onPageChange={(p) => setPage(p + 1)}
        onPageSizeChange={(s) => { setLimit(s); setPage(1); }}
        onRetry={fetchEmployees}
        emptyMessage="Xodim topilmadi"
        emptyDescription="Yangi xodim qoʻshish uchun tugmani bosing"
      />

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Xodimni tahrirlash' : 'Yangi xodim'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Xodim maʼlumotlarini yangilang' : 'Yangi xodim yaratish va rol berish'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Toʻliq ism</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ali Valiyev" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="login"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ali_valiyev" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!editing && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parol</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Kamida 6 belgi" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
