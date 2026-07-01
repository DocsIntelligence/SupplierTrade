import type { FormFieldMeta } from '@org/dto';
import { APP_ENV } from '../../../config';

const API = APP_ENV.apiUrl;

/** Shared dynamic-form field contract (maintained in @org/dto). */
export type FormField = FormFieldMeta;

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API}${path}`, { credentials: 'include' });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

async function send<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    throw new Error(await extractError(r));
  }
  return r.status === 204 ? (undefined as T) : r.json();
}

/** Normalise Nest/Zod error payloads into a readable string. */
async function extractError(r: Response): Promise<string> {
  try {
    const j = await r.json();
    const m = j?.message;
    if (Array.isArray(m)) {
      return m
        .map((x) =>
          typeof x === 'string'
            ? x
            : x?.message
              ? `${x.path ? `${x.path}: ` : ''}${x.message}`
              : JSON.stringify(x),
        )
        .join('; ');
    }
    if (typeof m === 'string') return m;
  } catch {
    /* ignore */
  }
  return `${r.status} ${r.statusText}`;
}

// ─── Types (mirror the API's UI-safe views) ─────────────────────

export interface LookupValueView {
  id: string;
  label: string;
  value: string | null;
  /** metadata.i18n holds localized labels — see localizedLookupLabel */
  metadata?: unknown;
}

export interface LookupGroupView {
  id: string;
  key: string;
  name: string;
  values: LookupValueView[];
}

export interface DomainSummary {
  key: string;
  name: string;
  version: number;
  status: string;
}

export interface SupplierTypeView {
  key: string;
  label: string;
  required_documents: { key: string; accepts?: string[]; required?: boolean }[];
  media_capture: { key: string; type: string; required?: boolean }[];
}

export interface QcCriterion {
  key: string;
  type: string;
  max?: number;
  min?: number;
}

export interface DomainConfigView {
  key: string;
  name: string;
  version: number;
  status: string;
  terminology: Record<string, string>;
  feature_flags: Record<string, boolean>;
  supplier_types: SupplierTypeView[];
  qc_profile: {
    scorer: string;
    grading_scale?: string[];
    criteria?: QcCriterion[];
  } | null;
  workflow_states: string[];
}

export interface Supplier {
  id: string;
  domainKey: string;
  supplierType: string;
  legalName: string;
  gstin?: string | null;
  status: string;
  attributes: Record<string, unknown>;
  createdAt: string;
}

export type SignalStatus = 'pass' | 'flag' | 'na';

export interface SignalResult {
  status: SignalStatus;
  evidence: Record<string, unknown>;
  summary: string;
}

export interface VerificationReport {
  id: string;
  status: string; // verified | flagged | insufficient
  signalsJson: Record<string, SignalResult>;
  summary?: string | null;
  createdAt: string;
}

export interface Listing {
  id: string;
  domainKey: string;
  supplierId: string;
  status: string;
  attributes: Record<string, unknown>;
  createdAt: string;
}

export interface QcJob {
  id: string;
  grade?: string | null;
  status: string;
  scorer: string;
  criteriaResultsJson: Record<
    string,
    { value: number; ok: boolean; limit?: number }
  >;
  createdAt: string;
}

export interface DocRequirement {
  key: string;
  accepts?: string[];
  required?: boolean;
}

export interface MediaRequirement {
  key: string;
  type: 'image' | 'video';
  min?: number;
  geotag?: boolean;
  required?: boolean;
}

export interface SupplierRequirements {
  supplierType: string;
  required_documents: DocRequirement[];
  media_capture: MediaRequirement[];
}

export interface SupplierDocument {
  id: string;
  docKey: string;
  fileRef: string;
  fileUrl: string;
  mime: string;
  status: string;
  uploadedAt: string;
}

export interface MediaAsset {
  id: string;
  mediaKey: string;
  type: string;
  fileRef: string;
  fileUrl: string;
  geoLat?: number | null;
  geoLng?: number | null;
  capturedAt: string;
}

/** Server-side list response (matches @org/dto paginatedResponseSchema). */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SupplierListParams {
  domainKey: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  supplierType?: string;
  status?: string;
}

function qs(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// ─── Endpoints ──────────────────────────────────────────────────

export const st = {
  domains: () => get<DomainSummary[]>('/domains'),
  domain: (key: string) => get<DomainConfigView>(`/domains/${key}`),
  form: (key: string, entity: 'supplier' | 'listing') =>
    get<FormField[]>(`/domains/${key}/form/${entity}`),

  lookup: (key: string) => get<LookupGroupView>(`/lookups/${key}`),

  /** Server-side paginated/searchable/sortable supplier list. */
  suppliers: (params: SupplierListParams) =>
    get<Paginated<Supplier>>(`/suppliers${qs({ ...params })}`),
  supplier: (id: string) => get<Supplier>(`/suppliers/${id}`),
  createSupplier: (body: {
    domainKey: string;
    supplierType: string;
    legalName: string;
    gstin?: string;
    attributes?: Record<string, unknown>;
    consent?: boolean;
  }) => send<Supplier>('/suppliers', 'POST', body),
  supplierEvent: (id: string, event: string) =>
    send<{ currentState: string }>(`/suppliers/${id}/events/${event}`, 'POST'),
  verify: (id: string) =>
    send<VerificationReport>(`/suppliers/${id}/verify`, 'POST'),
  reports: (id: string) =>
    get<VerificationReport[]>(`/suppliers/${id}/verification-reports`),

  listings: (domainKey: string) =>
    get<Listing[]>(`/listings?domainKey=${encodeURIComponent(domainKey)}`),
  createListing: (body: {
    domainKey: string;
    supplierId: string;
    attributes?: Record<string, unknown>;
  }) => send<Listing>('/listings', 'POST', body),

  scoreQc: (listingId: string, criteria: Record<string, number>) =>
    send<QcJob>(`/qc/listings/${listingId}`, 'POST', { criteria }),
  qcJobs: (domainKey: string) =>
    get<QcJob[]>(`/qc?domainKey=${encodeURIComponent(domainKey)}`),

  // Documents & media (config-driven per supplier type)
  requirements: (id: string) =>
    get<SupplierRequirements>(`/suppliers/${id}/requirements`),
  documents: (id: string) => get<SupplierDocument[]>(`/suppliers/${id}/documents`),
  media: (id: string) => get<MediaAsset[]>(`/suppliers/${id}/media`),
  uploadDocument: (id: string, docKey: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('docKey', docKey);
    return upload<SupplierDocument>(`/suppliers/${id}/documents`, fd);
  },
  uploadMedia: (
    id: string,
    mediaKey: string,
    file: File,
    geo?: { lat: number; lng: number },
  ) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mediaKey', mediaKey);
    if (geo) {
      fd.append('geoLat', String(geo.lat));
      fd.append('geoLng', String(geo.lng));
    }
    return upload<MediaAsset>(`/suppliers/${id}/media`, fd);
  },
  deleteDocument: (id: string, docId: string) =>
    send<{ deleted: boolean }>(`/suppliers/${id}/documents/${docId}`, 'DELETE'),
};

/** Multipart upload (no JSON content-type — the browser sets the boundary). */
async function upload<T>(path: string, body: FormData): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    credentials: 'include',
    body,
  });
  if (!r.ok) throw new Error(await extractError(r));
  return r.json();
}

/**
 * Fetch a stored file as an object URL (authenticated). Cross-origin `<img src>`
 * can't send the auth cookie, so we fetch with credentials and wrap in a blob.
 * Caller must `URL.revokeObjectURL` when done.
 */
export async function fileObjectUrl(fileApiPath: string): Promise<string> {
  const r = await fetch(`${API}${fileApiPath}`, { credentials: 'include' });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return URL.createObjectURL(await r.blob());
}

// ─── Small shared helpers ───────────────────────────────────────

/** Tailwind classes for a graded status badge (never a plain green ✓). */
export function statusTone(status: string): string {
  switch (status) {
    case 'verified':
    case 'pass':
    case 'qc_passed':
    case 'completed':
      return 'bg-success/15 text-success';
    case 'flagged':
    case 'flag':
    case 'qc_failed':
    case 'disputed':
      return 'bg-error/15 text-error';
    case 'insufficient':
    case 'na':
      return 'bg-warning/15 text-warning';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
}
