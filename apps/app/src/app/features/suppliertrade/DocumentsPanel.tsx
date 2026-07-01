import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card } from '@org/ui';
import { toast } from 'sonner';
import { Check, FileText, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import {
  fileObjectUrl,
  st,
  type MediaAsset,
  type MediaRequirement,
  type DocRequirement,
  type SupplierDocument,
  type SupplierRequirements,
} from './api';

/**
 * Where a supplier's documents & images live. The list of what's required is
 * config-driven (supplier_type.required_documents / media_capture); this panel
 * renders one uploader per requirement and shows what's already uploaded.
 * Files go through the storage module (S3 or local-disk fallback in dev).
 */
export function DocumentsPanel({ supplierId }: { supplierId: string }) {
  const [reqs, setReqs] = useState<SupplierRequirements | null>(null);
  const [docs, setDocs] = useState<SupplierDocument[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    Promise.all([
      st.requirements(supplierId),
      st.documents(supplierId),
      st.media(supplierId),
    ])
      .then(([r, d, m]) => {
        setReqs(r);
        setDocs(d);
        setMedia(m);
      })
      .catch(() => toast.error('Could not load documents'))
      .finally(() => setLoading(false));
  }, [supplierId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <Card className="rounded-xl p-6">
        <p className="text-sm text-foreground/50">Loading documents…</p>
      </Card>
    );
  }

  const hasAny =
    (reqs?.required_documents.length ?? 0) + (reqs?.media_capture.length ?? 0) >
    0;

  return (
    <Card className="rounded-xl p-6">
      <h2 className="mb-1 text-lg font-semibold text-foreground">
        Documents & media
      </h2>
      <p className="mb-5 text-sm text-foreground/60">
        Required items for a{' '}
        <span className="font-medium">{reqs?.supplierType}</span>. Upload each to
        complete KYC.
      </p>

      {!hasAny && (
        <p className="text-sm text-foreground/50">
          This supplier type has no document requirements configured.
        </p>
      )}

      {reqs && reqs.required_documents.length > 0 && (
        <div className="mb-6">
          <SectionLabel>Documents</SectionLabel>
          <div className="grid gap-3">
            {reqs.required_documents.map((spec) => (
              <DocRow
                key={spec.key}
                spec={spec}
                uploaded={docs.filter((d) => d.docKey === spec.key)}
                supplierId={supplierId}
                onChange={refresh}
              />
            ))}
          </div>
        </div>
      )}

      {reqs && reqs.media_capture.length > 0 && (
        <div>
          <SectionLabel>Media</SectionLabel>
          <div className="grid gap-3">
            {reqs.media_capture.map((spec) => (
              <MediaRow
                key={spec.key}
                spec={spec}
                uploaded={media.filter((m) => m.mediaKey === spec.key)}
                supplierId={supplierId}
                onChange={refresh}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
      {children}
    </p>
  );
}

function humanize(key: string) {
  return key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

function DocRow({
  spec,
  uploaded,
  supplierId,
  onChange,
}: {
  spec: DocRequirement;
  uploaded: SupplierDocument[];
  supplierId: string;
  onChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const accept = (spec.accepts ?? [])
    .map((a) => (a === 'image' ? 'image/*' : a === 'pdf' ? '.pdf' : a))
    .join(',');

  const onPick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      await st.uploadDocument(supplierId, spec.key, file);
      toast.success(`${humanize(spec.key)} uploaded`);
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-foreground/40" />
          <span className="text-sm font-medium">{humanize(spec.key)}</span>
          {spec.required ? (
            <span className="rounded-full bg-error/10 px-2 py-0.5 text-[11px] text-error">
              Required
            </span>
          ) : (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-foreground/50">
              Optional
            </span>
          )}
          {uploaded.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-success">
              <Check size={12} /> {uploaded.length} uploaded
            </span>
          )}
        </div>
        {/* Hidden native input — no @org/ui file component exists (see UI-STANDARDS §1). */}
        <input
          ref={inputRef}
          type="file"
          accept={accept || undefined}
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={14} className="mr-1.5" />
          {busy ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
      {uploaded.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {uploaded.map((d) => (
            <FileLink
              key={d.id}
              label={d.fileRef.split('/').pop() ?? 'file'}
              fileUrl={d.fileUrl}
              mime={d.mime}
              onDelete={async () => {
                await st.deleteDocument(supplierId, d.id);
                toast.success('Document removed');
                onChange();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaRow({
  spec,
  uploaded,
  supplierId,
  onChange,
}: {
  spec: MediaRequirement;
  uploaded: MediaAsset[];
  supplierId: string;
  onChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      let geo: { lat: number; lng: number } | undefined;
      if (spec.geotag && 'geolocation' in navigator) {
        geo = await new Promise<{ lat: number; lng: number } | undefined>(
          (res) => {
            navigator.geolocation.getCurrentPosition(
              (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
              () => res(undefined),
              { timeout: 5000 },
            );
          },
        );
      }
      await st.uploadMedia(supplierId, spec.key, file, geo);
      toast.success(`${humanize(spec.key)} uploaded`);
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-foreground/40" />
          <span className="text-sm font-medium">{humanize(spec.key)}</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-foreground/50 capitalize">
            {spec.type}
            {spec.geotag ? ' · geotagged' : ''}
          </span>
          {uploaded.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-success">
              <Check size={12} /> {uploaded.length}
            </span>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={spec.type === 'video' ? 'video/*' : 'image/*'}
          capture={spec.geotag ? 'environment' : undefined}
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={14} className="mr-1.5" />
          {busy ? 'Uploading…' : 'Add'}
        </Button>
      </div>
      {uploaded.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {uploaded.map((m) => (
            <MediaThumb key={m.id} media={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileLink({
  label,
  fileUrl,
  mime,
  onDelete,
}: {
  label: string;
  fileUrl: string;
  mime: string;
  onDelete: () => Promise<void>;
}) {
  const [opening, setOpening] = useState(false);
  const open = async () => {
    setOpening(true);
    try {
      const url = await fileObjectUrl(fileUrl);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Could not open file');
    } finally {
      setOpening(false);
    }
  };
  return (
    <div className="flex items-center justify-between rounded-md bg-secondary/30 px-2.5 py-1.5">
      <button
        type="button"
        onClick={open}
        className="truncate text-left text-xs text-primary hover:underline"
      >
        {opening ? 'Opening…' : `${label} (${mime})`}
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Remove"
        className="ml-2 text-foreground/40 hover:text-error"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function MediaThumb({ media }: { media: MediaAsset }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let revoked: string | null = null;
    if (media.type === 'image') {
      fileObjectUrl(media.fileUrl)
        .then((u) => {
          revoked = u;
          setUrl(u);
        })
        .catch(() => undefined);
    }
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [media.fileUrl, media.type]);

  if (media.type !== 'image') {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-secondary text-[10px] text-foreground/50">
        video
      </div>
    );
  }
  return url ? (
    <img
      src={url}
      alt="uploaded media"
      className="h-16 w-16 rounded-md object-cover"
    />
  ) : (
    <div className="h-16 w-16 animate-pulse rounded-md bg-secondary" />
  );
}

export default DocumentsPanel;
