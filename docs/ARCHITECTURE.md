# Architecture

This document describes how **@org/starter** is put together: the apps, the shared
libraries, the runtime request/render/auth flows, and the data model. Diagrams are
[Mermaid](https://mermaid.js.org) and render on GitHub.

- [1. System context](#1-system-context)
- [2. Monorepo & dependency graph](#2-monorepo--dependency-graph)
- [3. API module map](#3-api-module-map)
- [4. Authentication flow](#4-authentication-flow)
- [5. Document render pipeline](#5-document-render-pipeline)
- [6. AI provider abstraction](#6-ai-provider-abstraction)
- [7. Data model](#7-data-model)

---

## 1. System context

Four deployable apps share one set of libraries and one database. The browser talks to
the **web** (Next.js) and **app** (React) frontends; both call the **api** (NestJS). The
API owns the database and fans out to external providers (OAuth, mail, payments, AI,
storage) and to the **artboard** renderer for document export.

```mermaid
flowchart TD
    user([Browser])

    subgraph frontends [Frontends]
        web["web — Next.js<br/>:7110"]
        app["app — React + Vite<br/>:7100"]
    end

    api["api — NestJS<br/>:7130/api"]
    artboard["artboard — Vite<br/>:7120 · HTML render target"]
    db[("SQLite<br/>tools/prisma/dev.db")]

    subgraph external [External providers]
        oauth["OAuth<br/>Google · GitHub · LinkedIn"]
        chrome["Headless Chrome<br/>Browserless / local"]
        smtp["SMTP + Redis queue"]
        pay["Razorpay · Stripe"]
        ai["Claude · OpenAI · Gemini"]
        store["Object storage<br/>local / S3-compatible"]
    end

    user --> web
    user --> app
    web -->|"REST /api/* (proxied)"| api
    app -->|"REST /api/*"| api

    api --> db
    api --> oauth
    api --> smtp
    api --> pay
    api --> ai
    api --> store
    api -->|"render payload + x-render-token"| artboard
    api -->|"navigate & print"| chrome
    chrome -->|"loads"| artboard
```

---

## 2. Monorepo & dependency graph

The workspace is an [Nx](https://nx.dev) + pnpm monorepo. Apps depend on shared libs;
`@org/dto` is the contract shared by client and server (same Zod schema validates both
sides). Path resolution is via `tsconfig.base.json` `paths` (Vite uses `nxViteTsPaths`;
Next mirrors the paths in `apps/web/tsconfig.json` + `transpilePackages`).

```mermaid
flowchart BT
    subgraph apps ["apps/"]
        api["api"]
        app["app"]
        web["web"]
        artboard["artboard"]
    end

    subgraph libs ["libs/shared/"]
        dto["@org/dto<br/>Zod + createZodDto"]
        ui["@org/ui<br/>components"]
        utils["@org/utils<br/>enums · errors · config · i18n"]
        hooks["@org/hooks"]
        store["@org/store"]
        apiclient["@org/api-client"]
        translit["@org/transliteration"]
    end

    app --> dto & ui & utils & hooks & store & apiclient
    web --> dto & ui & utils & hooks & store & apiclient
    artboard --> ui & utils
    api --> dto & utils

    ui --> utils
    ui --> translit
    apiclient --> dto
    hooks --> store
```

> **Note:** the `@org/ui` barrel re-exports the rich-text editor, which imports
> `@org/transliteration`. Any `@org/ui` consumer therefore transitively needs that path
> registered — in `tsconfig.base.json`, and (for `web`) also in `apps/web/tsconfig.json`
> and `next.config.js` `transpilePackages`.

---

## 3. API module map

The NestJS API is a set of feature modules over a Prisma data layer, with global config,
logging, and a database module. Cross-cutting concerns (throttling, validation, cookies,
helmet) are applied in `main.ts` / `app.module.ts`.

```mermaid
flowchart TD
    subgraph platform [Platform]
        config["AppConfigModule<br/>env validation"]
        logger["AppLoggerModule<br/>nestjs-pino"]
        database["DatabaseModule<br/>Prisma client"]
        common["CommonModule"]
        health["HealthModule"]
    end

    subgraph features [Feature modules]
        auth["AuthModule<br/>JWT · OAuth · passkeys"]
        users["UsersModule"]
        admin["AdminModule"]
        payment["PaymentModule<br/>Razorpay · Stripe · wallets"]
        lookup["LookupModule<br/>reference data"]
        mail["MailModule<br/>queue + SMTP"]
        ai["AiModule<br/>provider abstraction"]
        aiusage["AiUsageModule<br/>cost metering"]
        settings["SettingsModule<br/>scoped key/value"]
        render["RenderModule<br/>PDF/PNG/DOCX"]
        storage["StorageModule"]
    end

    features --> database
    features --> config
    auth --> users
    payment --> users
    aiusage --> database
    render --> storage
    ai --> aiusage
```

---

## 4. Authentication flow

Auth supports password (local), OAuth (Google/GitHub/LinkedIn), and passkeys (WebAuthn).
Sessions use short-lived **access** + long-lived **refresh** JWTs in HTTP-only cookies;
OAuth callbacks redirect back to `FRONTEND_URL`.

```mermaid
sequenceDiagram
    actor U as User (browser)
    participant F as Frontend (app/web)
    participant A as API /auth
    participant P as OAuth provider
    participant DB as Database

    rect rgb(238, 246, 255)
    note over U,DB: Password login
    U->>F: email + password
    F->>A: POST /auth/login
    A->>DB: verify Secrets (hash)
    A-->>F: set access + refresh cookies
    end

    rect rgb(240, 250, 240)
    note over U,DB: OAuth login
    U->>A: GET /auth/google
    A->>P: redirect to consent
    P-->>A: GET /auth/google/callback (code)
    A->>P: exchange code → profile
    A->>DB: upsert User + UserIdentity
    A-->>U: redirect FRONTEND_URL + cookies
    end

    rect rgb(255, 247, 238)
    note over U,DB: Token refresh
    F->>A: POST /auth/refresh (refresh cookie)
    A->>DB: validate refresh token
    A-->>F: new access cookie
    end
```

---

## 5. Document render pipeline

`RenderService` turns HTML into **PDF/PNG** via headless Chrome, or **DOCX** via
`@turbodocx/html-to-docx`. Chrome is reached over a Browserless WebSocket (`CHROME_URL`)
or launched from a local binary. The **artboard** app hosts a `/render` route that the
API (or Chrome) loads with an internal `x-render-token`. Output is persisted through
`StorageService`.

```mermaid
sequenceDiagram
    participant C as Caller (api endpoint)
    participant R as RenderService
    participant AB as artboard /render
    participant CR as Headless Chrome
    participant S as StorageService

    C->>R: render(html, format)
    alt format = docx
        R->>R: html-to-docx → Buffer
    else format = pdf | png
        R->>CR: connect (CHROME_URL) or launch
        R->>AB: load render payload (x-render-token)
        AB-->>CR: rendered DOM
        CR-->>R: page.pdf() / page.screenshot()
    end
    R->>S: persist(buffer)
    S-->>C: stored artifact reference
```

---

## 6. AI provider abstraction

Per the project's interface-first principle, AI access goes through a single
`AiProvider` interface with concrete Claude / OpenAI / Gemini implementations selected by
config. Every call is metered by `AiUsageModule` (tokens, cost, latency) against an
`AiModelPricing` rate card.

```mermaid
flowchart LR
    caller["AiService /<br/>feature code"] --> iface{{"AiProvider<br/>interface"}}
    iface -.implemented by.-> claude["ClaudeProvider"]
    iface -.-> openai["OpenAIProvider"]
    iface -.-> gemini["GeminiProvider"]

    config["env keys<br/>ANTHROPIC / OPENAI / GEMINI"] -->|"selects + priority"| iface

    claude --> meter["AiUsage recorder"]
    openai --> meter
    gemini --> meter
    meter --> pricing[("AiModelPricing<br/>rate card")]
    meter --> usage[("AiUsage<br/>per-call rows")]
```

---

## 7. Data model

Core entities (Prisma → SQLite). Former enum columns are `String`s whose allowed values
live in `@org/utils`; array columns are `Json`.

```mermaid
erDiagram
    User ||--o| Secrets : has
    User ||--o{ UserIdentity : "OAuth links"
    User ||--o{ Passkey : "WebAuthn"
    User ||--o| UserWallet : has
    User ||--o{ Payment : makes

    Plan ||--o{ PlanFeature : defines
    Plan ||--o{ UserWallet : "subscribed via"
    UserWallet ||--o{ WalletUsage : meters
    Payment ||--o{ UserWallet : "funds"

    LookupGroup ||--o{ LookupValue : contains

    AiModelPricing ||..o{ AiUsage : "priced by"

    User {
        string id PK
        string email UK
        string role "enum-as-string"
        string provider
    }
    Plan {
        string id PK
        string type
        int price
        string currency
    }
    Payment {
        string id PK
        string gateway
        string status
    }
    AiUsage {
        string id PK
        string provider
        string model
        int totalTokens
        decimal estimatedCostUsd
    }
    Setting {
        string key
        string scope
        json value
    }
```

---

See [CONTRIBUTING.md](../CONTRIBUTING.md) for conventions and the golden rules, and the
[README](../README.md) for setup.
