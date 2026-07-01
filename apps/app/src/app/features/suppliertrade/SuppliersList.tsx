import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  DataTable,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type DataTableSort,
} from '@org/ui';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { st, statusTone, type DomainSummary, type Supplier } from './api';

const PAGE_SIZE = 20;

/**
 * Suppliers list — the reference server-side table (docs/UI-STANDARDS.md):
 * pagination, search, and sort are all handled by the API via the DataTable
 * `server` contract. Built entirely from @org/ui components (no native controls).
 */
export function SuppliersList() {
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [domainKey, setDomainKey] = useState('');

  const [rows, setRows] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DataTableSort | null>({
    key: 'createdAt',
    dir: 'desc',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    st.domains()
      .then((d) => {
        setDomains(d);
        setDomainKey((p) => p || d[0]?.key || '');
      })
      .catch(() => toast.error('Could not load domains'));
  }, []);

  const fetchPage = useCallback(() => {
    if (!domainKey) return;
    setLoading(true);
    st.suppliers({
      domainKey,
      page,
      pageSize: PAGE_SIZE,
      search: query || undefined,
      sortBy: sort?.key,
      sortOrder: sort?.dir,
    })
      .then((res) => {
        setRows(res.items);
        setTotal(res.total);
      })
      .catch(() => toast.error('Could not load suppliers'))
      .finally(() => setLoading(false));
  }, [domainKey, page, query, sort]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // Reset to first page when the domain filter changes.
  useEffect(() => {
    setPage(1);
  }, [domainKey]);

  const columns = useMemo(
    () => [
      {
        key: 'legalName',
        header: 'Supplier',
        cell: (r: Supplier) => (
          <Link
            to={`/suppliers/${r.id}`}
            className="font-medium text-primary hover:underline"
          >
            {r.legalName}
          </Link>
        ),
        sortValue: (r: Supplier) => r.legalName,
      },
      {
        key: 'supplierType',
        header: 'Type',
        cell: (r: Supplier) => (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            {r.supplierType}
          </span>
        ),
        sortValue: (r: Supplier) => r.supplierType,
      },
      {
        key: 'status',
        header: 'Status',
        cell: (r: Supplier) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusTone(r.status)}`}
          >
            {r.status}
          </span>
        ),
        sortValue: (r: Supplier) => r.status,
      },
      {
        key: 'gstin',
        header: 'GSTIN',
        cell: (r: Supplier) =>
          r.gstin ? (
            <span className="font-mono text-xs text-foreground/70">
              {r.gstin}
            </span>
          ) : (
            <span className="text-foreground/40">—</span>
          ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        cell: (r: Supplier) => (
          <span className="text-xs text-foreground/60">
            {new Date(r.createdAt).toLocaleDateString()}
          </span>
        ),
        sortValue: (r: Supplier) => r.createdAt,
      },
    ],
    [],
  );

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-sm text-foreground/60">
            Verify and grade suppliers across your domains.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={domainKey} onValueChange={setDomainKey}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              {domains.map((d) => (
                <SelectItem key={d.key} value={d.key}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild size="sm">
            <Link to={`/onboarding${domainKey ? `?domain=${domainKey}` : ''}`}>
              <UserPlus size={16} className="mr-1.5" />
              New supplier
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-xl p-4">
        <DataTable
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          searchPlaceholder="Search name or GSTIN…"
          tableId="st-suppliers"
          empty={
            <div className="py-8 text-center text-sm text-foreground/50">
              No suppliers found.
              <div className="mt-2">
                <Link to="/onboarding" className="text-primary hover:underline">
                  Onboard the first supplier
                </Link>
              </div>
            </div>
          }
          server={{
            page,
            pageCount,
            total,
            onPageChange: setPage,
            sort,
            onSortChange: (s) => {
              setSort(s);
              setPage(1);
            },
            query,
            onQueryChange: (q) => {
              setQuery(q);
              setPage(1);
            },
            pageSize: PAGE_SIZE,
            loading,
          }}
        />
      </Card>
    </div>
  );
}

export default SuppliersList;
