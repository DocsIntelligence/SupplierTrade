# ai

## Purpose
Provider-agnostic LLM dispatch. Currently supports OpenAI, Anthropic Claude, and Google Gemini. Has a shared interface, optional model whitelist (cost guardrail), and a fallback chain.

## Files
- `apps/api/src/app/ai/ai.module.ts`
- `apps/api/src/app/ai/ai.service.ts`
- `apps/api/src/app/ai/ai.controller.ts`
- `apps/api/src/app/ai/providers/ai-provider.interface.ts`
- `apps/api/src/app/ai/providers/{openai,claude,gemini}.provider.ts`

## Env vars
| Var | Required | Notes |
|-----|----------|-------|
| `AI_DEFAULT_PROVIDER` | no | `openai` / `claude` / `gemini` |
| `AI_MODEL_WHITELIST`  | no | `provider:model` pairs comma-separated |
| `OPENAI_API_KEY`      | no | enables OpenAI |
| `OPENAI_MODEL`        | no | default model |
| `ANTHROPIC_API_KEY`   | no | enables Claude |
| `ANTHROPIC_MODEL`     | no | |
| `GEMINI_API_KEY`      | no | enables Gemini |
| `GEMINI_MODEL`        | no | |

## Providers / abstractions
Common contract:
```ts
interface AiProvider {
  generate(prompt, opts?): Promise<AiResponse>
  stream?(prompt, opts?): AsyncGenerator<string>
  extract?<T>(input, schema, opts?): Promise<Structured<T>>
  embed?(texts): Promise<number[][]>
}
```

`AiService.generate()` picks the configured default and falls back through the chain on transient errors.

## Prisma models
None directly. Pairs with `ai-usage` for metering.

## Endpoints (selected)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/ai/generate` | jwt | text generation |
| POST | `/ai/extract`  | jwt | structured-output extraction |

## Admin UI
None directly. Spend dashboard lives under `/config/ai-usage`.

## Plug into a new project
1. Copy `apps/api/src/app/ai/`.
2. Set at least one provider key.
3. Pair with `ai-usage` for cost tracking.

## Extending
Add a provider:
1. New file `providers/<name>.provider.ts` implementing `AiProvider`.
2. Register it in `ai.module.ts`.
3. Add a `<NAME>_API_KEY` to `config/schema.ts` and `OPTIONAL_GROUPS`.
