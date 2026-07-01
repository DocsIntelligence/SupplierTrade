import { Inject, Injectable } from '@nestjs/common';
import {
  VERIFICATION_ADAPTERS,
  VerificationAdapter,
} from './verification-adapter.interface';

/**
 * Resolves verification adapters by key. Fail-fast: an unknown key throws, and
 * duplicate keys throw at construction (DOMAIN-ARCHITECTURE.md §5).
 */
@Injectable()
export class VerificationAdapterRegistry {
  private readonly map = new Map<string, VerificationAdapter>();

  constructor(
    @Inject(VERIFICATION_ADAPTERS) adapters: VerificationAdapter[],
  ) {
    for (const adapter of adapters) {
      if (this.map.has(adapter.key)) {
        throw new Error(
          `Duplicate verification adapter key: "${adapter.key}"`,
        );
      }
      this.map.set(adapter.key, adapter);
    }
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  keys(): string[] {
    return [...this.map.keys()];
  }

  resolve(key: string): VerificationAdapter {
    const adapter = this.map.get(key);
    if (!adapter) {
      throw new Error(
        `Unregistered verification adapter: "${key}". Registered: [${this.keys().join(', ')}]`,
      );
    }
    return adapter;
  }
}
