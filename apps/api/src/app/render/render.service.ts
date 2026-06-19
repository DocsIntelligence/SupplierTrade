import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import HTMLtoDOCX from '@turbodocx/html-to-docx';
import puppeteer, { type Browser } from 'puppeteer-core';
import { StorageService } from '../storage/storage.service';
import { errorMessage } from '../common/error.util';
import {
  PAGE_SIZES,
  type PageSizeKey,
  type RenderFormat,
  type RenderHtmlInput,
} from './render.dto';

export interface RenderResult {
  key: string;
  url: string;
  format: RenderFormat;
  bytes: number;
  contentType: string;
}

const CONTENT_TYPES: Record<RenderFormat, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * Generic HTML → PDF / PNG / DOCX renderer. Headless Chrome (`puppeteer.connect`
 * to a Browserless `CHROME_URL`, or `puppeteer.launch` with a local binary at
 * `PUPPETEER_EXECUTABLE_PATH`) draws the HTML; DOCX goes through
 * `@turbodocx/html-to-docx`. Output is persisted via `StorageService` and a
 * download URL is returned.
 *
 * No domain coupling — the caller owns the HTML (e.g. the rich-text editor's
 * output). Runs synchronously; for heavy/batch loads move the call behind a
 * BullMQ queue (see the `mail` module for the queue pattern).
 */
@Injectable()
export class RenderService {
  private readonly logger = new Logger(RenderService.name);

  constructor(private readonly storage: StorageService) {}

  async render(input: RenderHtmlInput, userId?: string): Promise<RenderResult> {
    const format = input.format;
    const filename = `${sanitize(input.title)}.${format}`;

    const buffer =
      format === 'docx'
        ? await this.renderDocx(input)
        : await this.renderWithChrome(input);

    const stored = await this.storage.upload(buffer, {
      filename,
      contentType: CONTENT_TYPES[format],
      folder: 'renders',
      userId,
    });
    return {
      key: stored.key,
      url: stored.url,
      format,
      bytes: buffer.length,
      contentType: CONTENT_TYPES[format],
    };
  }

  // ── DOCX (no browser needed) ────────────────────────────────────────────
  private async renderDocx(input: RenderHtmlInput): Promise<Buffer> {
    const out = await HTMLtoDOCX(wrapHtml(input), null, {
      table: { row: { cantSplit: true } },
      footer: false,
      pageNumber: false,
    });
    // html-to-docx returns Buffer | ArrayBuffer | Blob depending on env.
    if (Buffer.isBuffer(out)) return out;
    if (out instanceof ArrayBuffer) return Buffer.from(out);
    return Buffer.from(await (out as Blob).arrayBuffer());
  }

  // ── PDF / PNG (headless Chrome) ─────────────────────────────────────────
  private async renderWithChrome(input: RenderHtmlInput): Promise<Buffer> {
    const { browser, dispose } = await this.acquireBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(wrapHtml(input), { waitUntil: 'load' });
      if (input.fontFamily) {
        // Best-effort: give a webfont a moment to load before capture.
        await page
          .evaluate(() => (document as Document & { fonts?: FontFaceSet }).fonts?.ready)
          .catch(() => undefined);
      }

      if (input.format === 'png') {
        return Buffer.from(
          await page.screenshot({ type: 'png', fullPage: true }),
        );
      }

      const size = PAGE_SIZES[input.pageSize as PageSizeKey] ?? PAGE_SIZES.a4;
      const m = `${input.margin}in`;
      const pdf = await page.pdf({
        width: `${size.width}in`,
        height: `${size.height}in`,
        printBackground: true,
        margin: { top: m, right: m, bottom: m, left: m },
      });
      return Buffer.from(pdf);
    } finally {
      await dispose();
    }
  }

  // ── Browser acquisition (Browserless WS or local Chromium) ──────────────
  private async acquireBrowser(): Promise<{
    browser: Browser;
    dispose: () => Promise<void>;
  }> {
    const chromeUrl = process.env.CHROME_URL;
    if (chromeUrl) {
      const token = process.env.CHROME_TOKEN;
      const endpoint = token
        ? `${chromeUrl}${chromeUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
        : chromeUrl;
      let browser: Browser;
      try {
        browser = await puppeteer.connect({
          browserWSEndpoint: endpoint,
          acceptInsecureCerts: process.env.CHROME_IGNORE_HTTPS_ERRORS === 'true',
        });
      } catch (e) {
        throw new BadRequestException(
          `Could not connect to headless browser at ${chromeUrl} — is the Browserless/Chrome endpoint (CHROME_URL) running and reachable? (${errorMessage(e)})`,
        );
      }
      return { browser, dispose: () => browser.disconnect() };
    }

    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (!executablePath) {
      throw new BadRequestException(
        'Rendering needs a browser: set CHROME_URL (Browserless WS endpoint) or PUPPETEER_EXECUTABLE_PATH (local Chromium binary).',
      );
    }
    let browser: Browser;
    try {
      browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    } catch (e) {
      throw new BadRequestException(
        `Could not launch local Chromium at ${executablePath} (PUPPETEER_EXECUTABLE_PATH): ${errorMessage(e)}`,
      );
    }
    return { browser, dispose: () => browser.close() };
  }
}

function sanitize(title: string): string {
  return title.replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-') || 'document';
}

/** Wrap a fragment in a minimal printable HTML document. */
function wrapHtml(input: RenderHtmlInput): string {
  const fontLink = input.fontFamily
    ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(
        input.fontFamily,
      )}:wght@400;700&display=swap" />`
    : '';
  const fontRule = input.fontFamily
    ? `body{font-family:'${input.fontFamily}',serif;}`
    : '';
  // Already a full document? render as-is (still inject the font).
  if (/<html[\s>]/i.test(input.html)) return input.html;
  return `<!doctype html><html><head><meta charset="utf-8" />${fontLink}<style>
    *{box-sizing:border-box;} body{margin:0;color:#111;line-height:1.5;font-size:12pt;}
    img{max-width:100%;} table{border-collapse:collapse;width:100%;} ${fontRule}
  </style></head><body>${input.html}</body></html>`;
}
