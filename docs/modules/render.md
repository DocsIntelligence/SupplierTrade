# render

## Purpose
HTML → PDF / PNG / DOCX. PDF + PNG via Puppeteer (Browserless SaaS or local Chrome binary). DOCX via `@turbodocx/html-to-docx`. Renders are persisted to `storage` and a download URL is returned.

## Files
- `apps/api/src/app/render/render.module.ts`
- `apps/api/src/app/render/render.service.ts`
- `apps/api/src/app/render/render.controller.ts`
- `apps/api/src/app/render/render.dto.ts`

## Env vars
| Var | Required | Notes |
|-----|----------|-------|
| `CHROME_URL` | no | Browserless WebSocket endpoint |
| `PUPPETEER_EXECUTABLE_PATH` | no | local Chrome binary |

One of the two must be set for PDF / PNG to work.

## Providers / abstractions
- `puppeteer-core` — pick browser source per env vars.
- `@turbodocx/html-to-docx` — pure-JS DOCX.
- Output upload goes through `StorageService`.

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/render/pdf`  | jwt | HTML → PDF |
| POST | `/render/png`  | jwt | HTML → PNG |
| POST | `/render/docx` | jwt | HTML → DOCX |

## Admin UI
None.

## Plug into a new project
1. Copy `apps/api/src/app/render/`.
2. Set Chrome env vars.
3. Ensure `StorageModule` is imported.

## Extending
Add a Markdown → PDF helper by piping `marked` → HTML → existing PDF path. Wrap heavy loads in BullMQ for parallelism.
