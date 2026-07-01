import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, resolve } from 'node:path';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

/** Minimal extension → MIME map for the local-disk fallback. */
const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly enabled: boolean;
  /** Local-disk fallback root, used when S3 is not configured (dev). */
  private readonly localDir: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('STORAGE_ENDPOINT');
    const accessKey = this.config.get<string>('STORAGE_ACCESS_KEY');
    const secretKey = this.config.get<string>('STORAGE_SECRET_KEY');
    this.bucket = this.config.get<string>('STORAGE_BUCKET') ?? 'uploads';
    this.publicUrl =
      this.config.get<string>('STORAGE_PUBLIC_URL') ?? endpoint ?? '';

    const localDirCfg =
      this.config.get<string>('STORAGE_LOCAL_DIR') ?? '.data/uploads';
    this.localDir = isAbsolute(localDirCfg)
      ? localDirCfg
      : resolve(process.cwd(), localDirCfg);

    this.enabled = Boolean(endpoint && accessKey && secretKey);

    if (this.enabled) {
      this.client = new S3Client({
        endpoint,
        region: this.config.get<string>('STORAGE_REGION') ?? 'us-east-1',
        credentials: { accessKeyId: accessKey!, secretAccessKey: secretKey! },
        forcePathStyle: true, // Required for MinIO
      });
      this.logger.log(`Storage initialized (endpoint: ${endpoint})`);
    } else {
      this.logger.warn(
        `Storage: S3 not configured — using local-disk fallback at ${this.localDir}`,
      );
    }
  }

  /** True when S3 is configured. Local fallback is always available. */
  isEnabled(): boolean {
    return this.enabled;
  }

  /** API path the frontend fetches to stream a stored object. */
  fileApiPath(key: string): string {
    return `/storage/file/${key}`;
  }

  private localPath(key: string): string {
    // Prevent path traversal outside the local root.
    const full = resolve(this.localDir, key);
    if (!full.startsWith(resolve(this.localDir))) {
      throw new BadRequestException('Invalid storage key');
    }
    return full;
  }

  private mimeForKey(key: string): string {
    return MIME_BY_EXT[extname(key).toLowerCase()] ?? 'application/octet-stream';
  }

  /** Read an object's bytes + content type (works for S3 or local). */
  async getObject(key: string): Promise<{ body: Buffer; contentType: string }> {
    if (this.client) {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      const bytes = await res.Body?.transformToByteArray();
      if (!bytes) throw new NotFoundException('File not found');
      return {
        body: Buffer.from(bytes),
        contentType: res.ContentType ?? this.mimeForKey(key),
      };
    }
    const path = this.localPath(key);
    if (!existsSync(path)) throw new NotFoundException('File not found');
    return { body: await readFile(path), contentType: this.mimeForKey(key) };
  }

  /** Upload a file buffer */
  async upload(
    file: Buffer,
    options: {
      filename: string;
      contentType: string;
      folder?: string;
      userId?: string;
    },
  ): Promise<UploadResult> {
    const ext = extname(options.filename);
    const key = options.folder
      ? `${options.folder}/${randomUUID()}${ext}`
      : `${options.userId ?? 'public'}/${randomUUID()}${ext}`;

    if (!this.client) {
      // Local-disk fallback (dev).
      const path = this.localPath(key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, file);
      return {
        key,
        url: this.fileApiPath(key),
        size: file.length,
        contentType: options.contentType,
      };
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: options.contentType,
      }),
    );

    return {
      key,
      url: `${this.publicUrl}/${this.bucket}/${key}`,
      size: file.length,
      contentType: options.contentType,
    };
  }

  /** Get a presigned upload URL (client uploads directly to S3) */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<{ url: string; key: string }> {
    if (!this.client) throw new BadRequestException('Storage not configured');

    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn },
    );

    return { url, key };
  }

  /** Get a presigned download URL */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    if (!this.client) throw new BadRequestException('Storage not configured');

    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  /** Delete a file */
  async delete(key: string): Promise<void> {
    if (!this.client) {
      await rm(this.localPath(key), { force: true });
      this.logger.debug(`Deleted (local): ${key}`);
      return;
    }
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    this.logger.debug(`Deleted: ${key}`);
  }

  /** Delete all files in a folder (e.g. user's folder) */
  async deleteFolder(prefix: string): Promise<number> {
    if (!this.client) throw new BadRequestException('Storage not configured');

    const listed = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }),
    );

    const keys = listed.Contents?.map((obj) => obj.Key).filter(Boolean) ?? [];
    for (const key of keys) {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key! }),
      );
    }

    this.logger.debug(`Deleted ${keys.length} objects in ${prefix}/`);
    return keys.length;
  }

  /** Check if a file exists */
  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  /** List files in a folder */
  async list(prefix: string, maxKeys = 100) {
    if (!this.client) throw new BadRequestException('Storage not configured');

    const result = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      }),
    );

    return (result.Contents ?? []).map((obj) => ({
      key: obj.Key!,
      size: obj.Size ?? 0,
      lastModified: obj.LastModified?.toISOString(),
    }));
  }
}
