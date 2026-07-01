import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { StorageService } from '../../storage/storage.service';
import { DomainsService } from '../../platform/domains/domains.service';
import { findSupplierType } from '../../platform/domains/domain.types';

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

  async addDocument(
    supplierId: string,
    docKey: string,
    file: Express.Multer.File,
  ) {
    if (!docKey) throw new BadRequestException('docKey is required');
    const supplier = await this.supplierOrThrow(supplierId);
    const domain = await this.domains.getConfig(supplier.domainKey);
    const type = findSupplierType(domain, supplier.supplierType);
    const spec = type?.required_documents?.find((d) => d.key === docKey);
    if (!spec) {
      throw new BadRequestException(
        `Unknown document "${docKey}" for supplier type "${supplier.supplierType}"`,
      );
    }
    this.assertAccepted(spec.accepts, file.mimetype);

    const { key } = await this.storage.upload(file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
      folder: `suppliers/${supplierId}/documents`,
    });

    return this.db.supplierDocument.create({
      data: {
        supplierId,
        domainKey: supplier.domainKey,
        docKey,
        fileRef: key,
        mime: file.mimetype,
      },
    });
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
