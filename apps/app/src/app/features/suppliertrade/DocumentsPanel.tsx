import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CUSTOM_DOC_KEY } from '@org/dto';
import { selectUser, useAppSelector } from '@org/store';
import { Button, Card, Input } from '@org/ui';
import { toast } from 'sonner';
import {
  Camera,
  Check,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
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
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);
  const isAdmin = user?.role === 'admin';
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
      .catch(() => toast.error(t('st.common.loading')))
      .finally(() => setLoading(false));
  }, [supplierId, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <Card className="rounded-xl p-6">
        <p className="text-sm text-foreground/50">{t('st.common.loading')}</p>
      </Card>
    );
  }

  const hasAny =
    (reqs?.required_documents.length ?? 0) + (reqs?.media_capture.length ?? 0) >
    0;

  return (
    <Card className="rounded-xl p-6">
      <h2 className="mb-1 text-lg font-semibold text-foreground">
        {t('st.documents.title')}
      </h2>
      <p className="mb-5 text-sm text-foreground/60">
        {t('st.documents.subtitle', { type: reqs?.supplierType })}
      </p>

      {!hasAny && (
        <p className="text-sm text-foreground/50">{t('st.documents.none')}</p>
      )}

      {reqs && reqs.required_documents.length > 0 && (
        <div className="mb-6">
          <SectionLabel>{t('st.documents.documents')}</SectionLabel>
          <div className="grid gap-3">
            {reqs.required_documents.map((spec) => (
              <DocRow
                key={spec.key}
                spec={spec}
                uploaded={docs.filter((d) => d.docKey === spec.key)}
                supplierId={supplierId}
                isAdmin={isAdmin}
                onChange={refresh}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other / custom documents — anyone can add extras beyond the config. */}
      <OtherDocs
        supplierId={supplierId}
        docs={docs.filter((d) => d.docKey === CUSTOM_DOC_KEY)}
        isAdmin={isAdmin}
        onChange={refresh}
      />

      {reqs && reqs.media_capture.length > 0 && (
        <div>
          <SectionLabel>{t('st.documents.media')}</SectionLabel>
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
  isAdmin,
  onChange,
}: {
  spec: DocRequirement;
  uploaded: SupplierDocument[];
  supplierId: string;
  isAdmin: boolean;
  onChange: () => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const acceptsImage = (spec.accepts ?? []).includes('image');
  const accept = (spec.accepts ?? [])
    .map((a) => (a === 'image' ? 'image/*' : a === 'pdf' ? '.pdf' : a))
    .join(',');

  const onPick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      await st.uploadDocument(supplierId, spec.key, file);
      toast.success(t('st.documents.uploaded', { count: 1 }));
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
        <div className="flex min-w-0 items-center gap-2">
          <FileText size={16} className="shrink-0 text-foreground/40" />
          <span className="truncate text-sm font-medium">{humanize(spec.key)}</span>
          {spec.required ? (
            <span className="rounded-full bg-error/10 px-2 py-0.5 text-[11px] text-error">
              {t('st.common.required')}
            </span>
          ) : (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-foreground/50">
              {t('st.common.optional')}
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
          {acceptsImage ? (
            <Camera size={15} className="mr-1.5" />
          ) : (
            <Upload size={14} className="mr-1.5" />
          )}
          {busy ? t('st.documents.uploading') : t('st.documents.upload')}
        </Button>
      </div>
      {uploaded.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {uploaded.map((d) => (
            <DocItem
              key={d.id}
              doc={d}
              supplierId={supplierId}
              isAdmin={isAdmin}
              onChange={onChange}
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
  const { t } = useTranslation();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const isPhoto = spec.type === 'image';

  /** Fetch device location once (shared across a batch), if the field wants it. */
  const getGeo = async (): Promise<{ lat: number; lng: number } | undefined> => {
    if (!spec.geotag || !('geolocation' in navigator)) return undefined;
    return new Promise((res) => {
      navigator.geolocation.getCurrentPosition(
        (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => res(undefined),
        { timeout: 5000 },
      );
    });
  };

  const onPick = async (files: FileList | null) => {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;
    setBusy(true);
    try {
      const geo = await getGeo();
      let ok = 0;
      for (const file of list) {
        try {
          await st.uploadMedia(supplierId, spec.key, file, geo);
          ok++;
        } catch (e) {
          toast.error((e as Error).message);
        }
      }
      if (ok > 0) toast.success(t('st.documents.uploaded', { count: ok }));
      onChange();
    } finally {
      setBusy(false);
      if (cameraRef.current) cameraRef.current.value = '';
      if (galleryRef.current) galleryRef.current.value = '';
    }
  };

  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <ImageIcon size={16} className="shrink-0 text-foreground/40" />
          <span className="truncate text-sm font-medium">{humanize(spec.key)}</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] capitalize text-foreground/50">
            {isPhoto ? t('st.documents.photo') : t('st.documents.video')}
            {spec.geotag ? ` · ${t('st.documents.geotagged')}` : ''}
          </span>
          {typeof spec.min === 'number' && spec.min > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                uploaded.length >= spec.min
                  ? 'bg-success/15 text-success'
                  : 'bg-warning/15 text-warning'
              }`}
            >
              {uploaded.length}/{spec.min}
            </span>
          )}
          {uploaded.length > 0 &&
            !(typeof spec.min === 'number' && spec.min > 0) && (
              <span className="flex items-center gap-1 text-[11px] text-success">
                <Check size={12} /> {uploaded.length}
              </span>
            )}
        </div>
        <div className="flex shrink-0 gap-2">
          {/* Camera: single shot, opens camera directly on mobile (capture). */}
          <input
            ref={cameraRef}
            type="file"
            accept={isPhoto ? 'image/*' : 'video/*'}
            capture="environment"
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
          {/* Gallery: multi-select from the device library (no capture). */}
          <input
            ref={galleryRef}
            type="file"
            accept={isPhoto ? 'image/*' : 'video/*'}
            multiple
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
          <Button
            size="sm"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera size={15} className="mr-1.5" />
            {busy
              ? t('st.documents.uploading')
              : isPhoto
                ? t('st.documents.takePhoto')
                : t('st.documents.recordVideo')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => galleryRef.current?.click()}
          >
            <ImagePlus size={15} className="mr-1.5" />
            {isPhoto
              ? t('st.documents.choosePhoto')
              : t('st.documents.chooseVideo')}
          </Button>
        </div>
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

function fmtSize(bytes?: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function docStatusStyle(status: string): { cls: string; key: string } {
  if (status === 'accepted')
    return { cls: 'bg-success/15 text-success', key: 'st.documents.accepted' };
  if (status === 'rejected')
    return { cls: 'bg-error/15 text-error', key: 'st.documents.rejected' };
  return { cls: 'bg-warning/15 text-warning', key: 'st.documents.pending' };
}

/**
 * One uploaded document with its full detail trail (status, note, size, date)
 * so users and admins can inspect it later. Admins get accept/reject controls;
 * rejecting requires a reason. Anyone with access can open or remove it.
 */
function DocItem({
  doc,
  supplierId,
  isAdmin,
  onChange,
}: {
  doc: SupplierDocument;
  supplierId: string;
  isAdmin: boolean;
  onChange: () => void;
}) {
  const { t } = useTranslation();
  const [opening, setOpening] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const status = docStatusStyle(doc.status);

  const open = async () => {
    setOpening(true);
    try {
      const url = await fileObjectUrl(doc.fileUrl);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error(t('st.common.loading'));
    } finally {
      setOpening(false);
    }
  };

  const review = async (decision: 'accepted' | 'rejected', note?: string) => {
    setReviewing(true);
    try {
      await st.reviewDocument(supplierId, doc.id, { decision, note });
      toast.success(t(`st.documents.${decision}`));
      setRejectOpen(false);
      setReason('');
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setReviewing(false);
    }
  };

  const meta = [
    doc.originalName,
    fmtSize(doc.sizeBytes),
    t('st.documents.uploadedOn', {
      date: new Date(doc.uploadedAt).toLocaleDateString(),
    }),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="rounded-md border border-border/50 bg-secondary/20 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={open}
              className="truncate text-left text-sm font-medium text-primary hover:underline"
            >
              {opening ? t('st.documents.opening') : doc.label || doc.docKey}
            </button>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${status.cls}`}
            >
              {t(status.key)}
            </span>
          </div>
          {meta && (
            <p className="mt-0.5 truncate text-[11px] text-foreground/45">{meta}</p>
          )}
          {doc.note && (
            <p className="mt-1 text-xs text-foreground/70">“{doc.note}”</p>
          )}
          {doc.reviewNote && (
            <p className="mt-1 text-xs text-error/90">
              {t('st.documents.reviewNote')}: {doc.reviewNote}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={async () => {
            await st.deleteDocument(supplierId, doc.id);
            toast.success(t('st.documents.remove'));
            onChange();
          }}
          aria-label={t('st.documents.remove')}
          className="ml-1 shrink-0 text-foreground/40 hover:text-error"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {isAdmin && doc.status === 'pending' && !rejectOpen && (
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={reviewing}
            onClick={() => review('accepted')}
          >
            <Check size={13} className="mr-1" />
            {t('st.documents.accept')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-error"
            disabled={reviewing}
            onClick={() => setRejectOpen(true)}
          >
            <X size={13} className="mr-1" />
            {t('st.documents.reject')}
          </Button>
        </div>
      )}
      {isAdmin && rejectOpen && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Input
            className="h-8 flex-1"
            placeholder={t('st.documents.rejectReason')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button
            size="sm"
            variant="ghost"
            className="text-error"
            disabled={reviewing || !reason.trim()}
            onClick={() => review('rejected', reason)}
          >
            {t('st.documents.reject')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRejectOpen(false)}>
            {t('st.common.cancel')}
          </Button>
        </div>
      )}
    </div>
  );
}

/** User-added custom documents section: name + optional note + file. */
function OtherDocs({
  supplierId,
  docs,
  isAdmin,
  onChange,
}: {
  supplierId: string;
  docs: SupplierDocument[];
  isAdmin: boolean;
  onChange: () => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!label.trim() || !file) return;
    setBusy(true);
    try {
      await st.uploadDocument(supplierId, CUSTOM_DOC_KEY, file, {
        label: label.trim(),
        note: note.trim() || undefined,
      });
      toast.success(t('st.documents.uploaded', { count: 1 }));
      setLabel('');
      setNote('');
      setFile(null);
      setOpen(false);
      if (inputRef.current) inputRef.current.value = '';
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <SectionLabel>{t('st.documents.other')}</SectionLabel>
        {!open && (
          <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
            <Plus size={14} className="mr-1" />
            {t('st.documents.addOther')}
          </Button>
        )}
      </div>

      {open && (
        <div className="mb-3 grid gap-2 rounded-lg border border-border/60 p-3">
          <Input
            placeholder={t('st.documents.docNamePlaceholder')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Input
            placeholder={t('st.documents.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={14} className="mr-1.5" />
              {file ? file.name : t('st.documents.chooseFile')}
            </Button>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              {t('st.common.cancel')}
            </Button>
            <Button
              size="sm"
              disabled={busy || !label.trim() || !file}
              onClick={submit}
            >
              {busy ? t('st.documents.uploading') : t('st.documents.add')}
            </Button>
          </div>
        </div>
      )}

      {docs.length === 0 ? (
        <p className="text-xs text-foreground/45">{t('st.documents.otherHint')}</p>
      ) : (
        <div className="grid gap-2">
          {docs.map((d) => (
            <DocItem
              key={d.id}
              doc={d}
              supplierId={supplierId}
              isAdmin={isAdmin}
              onChange={onChange}
            />
          ))}
        </div>
      )}
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
