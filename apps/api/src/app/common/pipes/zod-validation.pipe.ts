import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

interface ParseIssue {
  message?: string;
  path?: (string | number)[];
}

/**
 * Validates/parses a payload against a Zod schema and returns typed data.
 *
 * Message generation uses a per-parse error map so it never falls back to Zod's
 * global default error map — the workspace resolves two Zod majors (v3 + v4) in
 * the bundle, and the default-map path throws `defaultErrorMap is not a function`
 * for issues without a custom message (e.g. a missing required field). Supplying
 * the map here keeps every validation error a clean 400, with field paths.
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const fallback = (issue: ParseIssue): string =>
      issue.message && !/^Invalid input$/i.test(issue.message)
        ? issue.message
        : issue.path?.length
          ? `${issue.path.join('.')} is invalid`
          : 'Invalid value';

    let parsed: ReturnType<ZodSchema<T>['safeParse']>;
    try {
      parsed = this.schema.safeParse(value, {
        // v4 per-parse customization
        error: (issue: ParseIssue) => fallback(issue),
        // v3 per-parse customization
        errorMap: (issue: ParseIssue) => ({ message: fallback(issue) }),
      } as never);
    } catch {
      // Never leak a 500 from validation, whatever the zod internals do.
      throw new BadRequestException('Invalid request payload');
    }

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
