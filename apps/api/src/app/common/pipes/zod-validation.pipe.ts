import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      );
    }
    return parsed.data;
  }
}
