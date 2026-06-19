import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Supported output formats for the generic renderer. */
export const RENDER_FORMATS = ['pdf', 'png', 'docx'] as const;
export type RenderFormat = (typeof RENDER_FORMATS)[number];

/** Page sizes the PDF renderer understands (width × height in inches). */
export const PAGE_SIZES = {
  a4: { width: 8.27, height: 11.69 },
  letter: { width: 8.5, height: 11 },
  legal: { width: 8.5, height: 14 },
} as const;
export type PageSizeKey = keyof typeof PAGE_SIZES;

/**
 * Render a chunk of HTML to a downloadable document. Deliberately generic —
 * the caller supplies the HTML (e.g. the output of the @org/ui rich-text
 * editor); the renderer knows nothing about any domain model.
 */
export const renderHtmlSchema = z.object({
  /** Full HTML (a complete document or a fragment — the renderer wraps it). */
  html: z.string().min(1, 'html is required'),
  format: z.enum(RENDER_FORMATS).default('pdf'),
  pageSize: z.enum(['a4', 'letter', 'legal']).default('a4'),
  /** Download filename (without extension). */
  title: z.string().max(200).default('document'),
  /** Optional Google font family to load before capture (e.g. "Lora"). */
  fontFamily: z.string().max(80).optional(),
  /** PDF/print margin in inches. */
  margin: z.number().min(0).max(3).default(0.6),
});

export type RenderHtmlInput = z.infer<typeof renderHtmlSchema>;

export class RenderHtmlDto extends createZodDto(renderHtmlSchema) {}
