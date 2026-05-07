import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  private connected = false;

  constructor(private readonly config: ConfigService) {}

  async connect(): Promise<void> {
    const url = this.config.get<string>('DATABASE_URL');
    if (!url) {
      this.logger.warn(
        'DATABASE_URL is not set — running without a database (in-memory store).',
      );
      return;
    }
    // TODO: replace with Prisma/TypeORM/Drizzle/etc.
    this.connected = true;
    this.logger.log(`Connected to database`);
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    this.connected = false;
    this.logger.log('Disconnected from database');
  }

  isConnected() {
    return this.connected;
  }
}
