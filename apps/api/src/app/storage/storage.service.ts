import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('STORAGE_ENDPOINT');
    const accessKey = this.config.get<string>('STORAGE_ACCESS_KEY');
    const secretKey = this.config.get<string>('STORAGE_SECRET_KEY');
    this.bucket = this.config.get<string>('STORAGE_BUCKET') ?? 'uploads';
    this.publicUrl =
      this.config.get<string>('STORAGE_PUBLIC_URL') ?? endpoint ?? '';

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
        'Storage not configured — STORAGE_ENDPOINT/ACCESS_KEY/SECRET_KEY missing',
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
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
    if (!this.client) throw new BadRequestException('Storage not configured');

    const ext = extname(options.filename);
    const key = options.folder
      ? `${options.folder}/${randomUUID()}${ext}`
      : `${options.userId ?? 'public'}/${randomUUID()}${ext}`;

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
    if (!this.client) throw new BadRequestException('Storage not configured');

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
