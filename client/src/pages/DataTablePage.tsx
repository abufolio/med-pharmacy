import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api, { getErrorMessage } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { PageLoader } from '@/components/ui/loader';
import { formatCurrency, formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  badge?: boolean;
  currency?: boolean;
  date?: boolean;
  short?: boolean;
  boolean?: boolean;
  count?: boolean;
}

interface DataTablePageProps {
  title: string;
  endpoint: string;
  columns: Column[];
  createForm?: React.ReactNode;
  onCreate?: () => void;
  onRowClick?: (row: any) => void;
}

export function DataTablePage({ title, endpoint, columns, createForm, onCreate, onRowClick }: DataTablePageProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, any> = { page, limit };
      if (search) params.search = search;

      const { data: res } = await api.get(endpoint, { params });

      if (Array.isArray(res)) {
        setData(res);
        setTotal(res.length);
      } else if (res.data) {
        setData(res.data);
        setTotal(res.total || res.data.length);
      } else {
        setData([]);
        setTotal(0);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, limit, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderCell = (row: any, col: Column) => {
    const value = col.key.includes('.')
      ? col.key.split('.').reduce((obj, k) => obj?.[k], row)
      : row[col.key];

    if (value === undefined || value === null) return <span className="text-slate-400">—</span>;

    if (col.badge) {
      return (
        <Badge variant={getStatusColor(String(value)) as any}>
          {getStatusLabel(String(value))}
        </Badge>
      );
    }

    if (col.currency) return <span className="font-medium">{formatCurrency(value)}</span>;
    if (col.date) return <span className="text-slate-500">{formatDateShort(value)}</span>;
    if (col.boolean) return value ? <Badge variant="success">Yes</Badge> : <Badge variant="outline">No</Badge>;
    if (col.short && typeof value === 'string') return <code className="text-xs">{value.slice(0, 8)}...</code>;
    if (col.count && Array.isArray(value)) return <span>{value.length}</span>;

    return <span>{String(value)}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t(title)}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total} {t('common.items')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {(onCreate || createForm) && (
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              {t('common.create')}
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          className="w-full max-w-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <PageLoader />
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">{t('common.noData')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{t(col.label)}</TableHead>
                  ))}
                  <TableHead className="w-[80px]">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row: any, idx: number) => (
                  <TableRow
                    key={row.id || idx}
                    onClick={() => onRowClick?.(row)}
                    className={onRowClick ? 'cursor-pointer' : ''}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key}>{renderCell(row, col)}</TableCell>
                    ))}
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        onRowClick?.(row);
                      }}>
                        {t('common.edit')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {total > limit && (
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
          />
        )}
      </Card>

      {/* Create Form Dialog */}
      {createForm && (
        <div className="hidden">{createForm}</div>
      )}
    </div>
  );
}
