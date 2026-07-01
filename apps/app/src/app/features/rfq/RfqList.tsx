import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { FilePlus2 } from 'lucide-react';
import { st, type DomainSummary, type RfqSummary } from '../suppliertrade/api';

const PAGE_SIZE = 20;

/** Buyer RFQ console list — server-side DataTable (docs/UI-STANDARDS §2). */
export function RfqList() {
  const { t } = useTranslation();
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [domainKey, setDomainKey] = useState('');
  const [rows, setRows] = useState<RfqSummary[]>([]);
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
      .catch(() => toast.error(t('st.common.loading')));
  }, [t]);

  const fetchPage = useCallback(() => {
    if (!domainKey) return;
    setLoading(true);
    st.rfqs({
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
      .catch(() => toast.error(t('st.common.loading')))
      .finally(() => setLoading(false));
  }, [domainKey, page, query, sort, t]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  useEffect(() => {
    setPage(1);
  }, [domainKey]);

  const columns = useMemo(
    () => [
      {
        key: 'title',
        header: t('st.rfq.colTitle'),
        cell: (r: RfqSummary) => (
          <Link
            to={`/rfqs/${r.id}`}
            className="font-medium text-primary hover:underline"
          >
            {r.title}
          </Link>
        ),
        sortValue: (r: RfqSummary) => r.title,
      },
      {
        key: 'status',
        header: t('st.rfq.colStatus'),
        cell: (r: RfqSummary) => <RfqStatusChip status={r.status} />,
        sortValue: (r: RfqSummary) => r.status,
      },
      {
        key: 'lines',
        header: t('st.rfq.colLines'),
        cell: (r: RfqSummary) => (
          <span className="tabular-nums">{r._count?.lines ?? 0}</span>
        ),
      },
      {
        key: 'responses',
        header: t('st.rfq.colResponses'),
        cell: (r: RfqSummary) => (
          <span className="tabular-nums">{r._count?.responses ?? 0}</span>
        ),
      },
      {
        key: 'createdAt',
        header: t('st.rfq.colCreated'),
        cell: (r: RfqSummary) => (
          <span className="text-xs text-foreground/60">
            {new Date(r.createdAt).toLocaleDateString()}
          </span>
        ),
        sortValue: (r: RfqSummary) => r.createdAt,
      },
    ],
    [t],
  );

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t('st.rfq.title')}
          </h1>
          <p className="text-sm text-foreground/60">{t('st.rfq.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {domains.length > 1 && (
            <Select value={domainKey} onValueChange={setDomainKey}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {domains.map((d) => (
                  <SelectItem key={d.key} value={d.key}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button asChild size="sm">
            <Link to="/rfqs/new">
              <FilePlus2 size={16} className="mr-1.5" />
              {t('st.rfq.new')}
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-xl p-4">
        <DataTable
          data={rows}
          columns={columns}
          rowKey={(r) => r.id}
          tableId="st-rfqs"
          empty={
            <div className="py-8 text-center text-sm text-foreground/50">
              {t('st.rfq.empty')}
              <div className="mt-2">
                <Link to="/rfqs/new" className="text-primary hover:underline">
                  {t('st.rfq.new')}
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

/** RFQ lifecycle chip — distinct from the supplier trust StatusBadge. */
export function RfqStatusChip({ status }: { status: string }) {
  const tone =
    status === 'awarded' || status === 'closed'
      ? 'bg-success/15 text-success'
      : status === 'cancelled'
        ? 'bg-error/15 text-error'
        : status === 'draft'
          ? 'bg-secondary text-foreground/60'
          : 'bg-primary/15 text-primary';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${tone}`}>
      {status}
    </span>
  );
}

export default RfqList;
