import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from './schema';

@Injectable()
export class TypedConfigService {
  constructor(private readonly nest: ConfigService<AppConfig, true>) {}

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.nest.getOrThrow(key, { infer: true });
  }
}
