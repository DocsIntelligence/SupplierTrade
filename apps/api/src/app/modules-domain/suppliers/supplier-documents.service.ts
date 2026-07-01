import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CUSTOM_DOC_KEY, type ReviewDocumentDto } from '@org/dto';
import { DatabaseService } from '../../database/database.service';
import { StorageService } from '../../storage/storage.service';
import { AuditService } from '../../audit/audit.service';
import { DomainsService } from '../../platform/domains/domains.service';
import { findSupplierType } from '../../platform/domains/domain.types';

/** Fallback allowlist for custom ("other") documents when config gives none. */
const CUSTOM_DOC_ACCEPTS = ['pdf', 'image'];

function humanize(key: string): string {
  return key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Supplier documents & media (DOMAIN-ARCHITECTURE.md §2b/§6). What a supplier
 * must upload is config-driven — `supplier_type.required_documents` and
 * `.media_capture` — so this service validates the doc/media key against the
 * supplier's type config, stores the file via the storage module (S3 or local
 * fallback), and records a SupplierDocument / MediaAsset row. File bytes are
 * streamed back through `/storage/file/<fileRef>`.
 */
@Injectable()
export class SupplierDocumentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
    private readonly domains: DomainsService,
    private readonly audit: AuditService,
  ) {}

  private async supplierOrThrow(id: string) {
    const supplier = await this.db.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return supplier;
  }

  /** Required-document + media-capture spec for a supplier's type (from config). */
  async requirements(supplierId: string) {
    const supplier = await this.supplierOrThrow(supplierId);
    const domain = await this.domains.getConfig(supplier.domainKey);
    const type = findSupplierType(domain, supplier.supplierType);
    return {
      supplierType: supplier.supplierType,
      required_documents: type?.required_documents ?? [],
      media_capture: type?.media_capture ?? [],
    };
  }

  /**
   * Store a document. `docKey` may be a config-defined required document OR the
   * special `CUSTOM_DOC_KEY` ("other") for a user-added document — custom docs
   * require a `label` and accept the general pdf/image allowlist. Captures
   * original filename, size, uploader, and an optional note for later review.
   */
  async addDocument(
    supplierId: string,
    docKey: string,
    file: Express.Multer.File,
    opts: { label?: string; note?: string; uploadedById?: string } = {},
  ) {
    if (!docKey) throw new BadRequestException('docKey is required');
    if (!file) throw new BadRequestException('A file is required');
    const supplier = await this.supplierOrThrow(supplierId);
    const domain = await this.domains.getConfig(supplier.domainKey);
    const type = findSupplierType(domain, supplier.supplierType);

    let label = opts.label?.trim();
    if (docKey === CUSTOM_DOC_KEY) {
      if (!label) {
        throw new BadRequestException('A document name is required');
      }
      this.assertAccepted(CUSTOM_DOC_ACCEPTS, file.mimetype);
    } else {
      const spec = type?.required_documents?.find((d) => d.key === docKey);
      if (!spec) {
        throw new BadRequestException(
          `Unknown document "${docKey}" for supplier type "${supplier.supplierType}"`,
        );
      }
      this.assertAccepted(spec.accepts, file.mimetype);
      label = label || humanize(docKey);
    }

    const { key } = await this.storage.upload(file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
      folder: `suppliers/${supplierId}/documents`,
    });

    const doc = await this.db.supplierDocument.create({
      data: {
        supplierId,
        domainKey: supplier.domainKey,
        docKey,
        label,
        note: opts.note?.trim() || null,
        fileRef: key,
        mime: file.mimetype,
        originalName: file.originalname,
        sizeBytes: file.size,
        uploadedById: opts.uploadedById ?? null,
        status: 'pending',
      },
    });

    await this.audit.record({
      actorId: opts.uploadedById ?? null,
      action: 'supplier_document.upload',
      targetType: 'supplier',
      targetId: supplierId,
      after: { docKey, label, id: doc.id },
    });
    return doc;
  }

  /**
   * Admin review of a document: accept or reject with a note (required on
   * reject). Records the reviewer, decision time, and an audit entry so both
   * the user and other admins can see the history.
   */
  async reviewDocument(
    supplierId: string,
    docId: string,
    dto: ReviewDocumentDto,
    reviewerId?: string,
  ) {
    const doc = await this.db.supplierDocument.findUnique({
      where: { id: docId },
    });
    if (!doc || doc.supplierId !== supplierId) {
      throw new NotFoundException('Document not found');
    }
    const updated = await this.db.supplierDocument.update({
      where: { id: docId },
      data: {
        status: dto.decision,
        reviewNote: dto.note?.trim() || null,
        reviewedById: reviewerId ?? null,
        decidedAt: new Date(),
      },
    });
    await this.audit.record({
      actorId: reviewerId ?? null,
      action: `supplier_document.${dto.decision}`,
      targetType: 'supplier',
      targetId: supplierId,
      before: { status: doc.status },
      after: { status: dto.decision, note: dto.note ?? null, docId },
    });
    return updated;
  }

  async addMedia(
    supplierId: string,
    args: {
      mediaKey: string;
      file: Express.Multer.File;
      geoLat?: number;
      geoLng?: number;
    },
  ) {
    if (!args.mediaKey) throw new BadRequestException('mediaKey is required');
    const supplier = await this.supplierOrThrow(supplierId);
    const domain = await this.domains.getConfig(supplier.domainKey);
    const type = findSupplierType(domain, supplier.supplierType);
    const spec = type?.media_capture?.find((m) => m.key === args.mediaKey);
    if (!spec) {
      throw new BadRequestException(
        `Unknown media "${args.mediaKey}" for supplier type "${supplier.supplierType}"`,
      );
    }
    const isImage = args.file.mimetype.startsWith('image/');
    const isVideo = args.file.mimetype.startsWith('video/');
    if (spec.type === 'image' && !isImage) {
      throw new BadRequestException('Expected an image file');
    }
    if (spec.type === 'video' && !isVideo) {
      throw new BadRequestException('Expected a video file');
    }

    const { key } = await this.storage.upload(args.file.buffer, {
      filename: args.file.originalname,
      contentType: args.file.mimetype,
      folder: `suppliers/${supplierId}/media`,
    });

    return this.db.mediaAsset.create({
      data: {
        supplierId,
        domainKey: supplier.domainKey,
        mediaKey: args.mediaKey,
        type: isVideo ? 'video' : 'image',
        fileRef: key,
        geoLat: args.geoLat ?? null,
        geoLng: args.geoLng ?? null,
      },
    });
  }

  async listDocuments(supplierId: string) {
    await this.supplierOrThrow(supplierId);
    const docs = await this.db.supplierDocument.findMany({
      where: { supplierId },
      orderBy: { uploadedAt: 'desc' },
    });
    return docs.map((d) => ({ ...d, fileUrl: this.storage.fileApiPath(d.fileRef) }));
  }

  async listMedia(supplierId: string) {
    await this.supplierOrThrow(supplierId);
    const media = await this.db.mediaAsset.findMany({
      where: { supplierId },
      orderBy: { capturedAt: 'desc' },
    });
    return media.map((m) => ({ ...m, fileUrl: this.storage.fileApiPath(m.fileRef) }));
  }

  async deleteDocument(supplierId: string, docId: string) {
    const doc = await this.db.supplierDocument.findUnique({
      where: { id: docId },
    });
    if (!doc || doc.supplierId !== supplierId) {
      throw new NotFoundException('Document not found');
    }
    await this.storage.delete(doc.fileRef).catch(() => undefined);
    await this.db.supplierDocument.delete({ where: { id: docId } });
    return { deleted: true };
  }

  private assertAccepted(accepts: string[] | undefined, mime: string) {
    if (!accepts?.length) return;
    const ok = accepts.some((a) =>
      a === 'image'
        ? mime.startsWith('image/')
        : a === 'pdf'
          ? mime === 'application/pdf'
          : a === 'video'
            ? mime.startsWith('video/')
            : mime === a,
    );
    if (!ok) {
      throw new BadRequestException(
        `File type not accepted. Allowed: ${accepts.join(', ')}`,
      );
    }
  }
}
