# Fief — Agent Briefing

> **Read this file in full before doing anything else.**
> This is not a README. It is a briefing written for the agent working on this project.
> Update the relevant sections at the end of every conversation (see [End-of-Session Checklist](#end-of-session-checklist)).

---

## What Is Fief?

Fief is a self-hosted DNS delegation manager. The operator owns one or more domains registered with a DNS provider (initially NameCheap) and uses Fief to grant scoped, revocable control over specific subdomains to other people — without exposing the registrar credentials or the root domain.

Each **tenant** is represented by an API key associated with a **subdomain path** (e.g. `filippo.lucchesi.io`). Within that path, the tenant can freely create, modify, and delete DNS records (A, AAAA, CNAME, TXT) via a REST API or a simple web UI.

A special **admin API key** (set in `.env`) grants access to a broader management interface: view and edit all tenants and their records, generate and revoke API keys, and assign subdomain paths.

Fief runs as a service under **Portcullis** on the staging VPS, using Portcullis's shared Postgres instance. It does not manage its own Caddy instance — Portcullis handles all routing and SSL.

---

## Stack

| Layer | Technology | Version |
|---|---|---|
| UI / API | Next.js (App Router, TypeScript, Tailwind) | 16.2 |
| Database | PostgreSQL | 18 (shared Portcullis instance) |
| ORM / Migrations | Prisma | 7 (latest compatible) |
| i18n | next-intl | latest compatible |
| DNS provider — NameCheap | Custom module in `lib/dns/namecheap.ts` | — |
| DNS provider interface | `lib/dns/provider.ts` (abstract interface) | — |

**Do not suggest replacing or upgrading any of these without explicit instruction.**

---

## Architecture

### Relationship to Portcullis

Fief is a **tenant service** of Portcullis. It does not manage its own reverse proxy or SSL. Instead:

- Fief registers itself with Portcullis as a service (e.g. `fief.yourdomain.com → fief_app:3000`).
- Portcullis's Caddy instance handles all inbound traffic and certificate provisioning.
- Fief uses the **shared Postgres instance** managed by Portcullis (`db_network`), with its own dedicated database and user.

### Docker Networks

Fief joins two external networks created and managed by Portcullis:

- `caddy_gateway` — so Portcullis's Caddy can reach the Fief app container.
- `db_network` — so the Fief app container can reach the shared Postgres instance.

Fief has **no** `caddy` or `postgres` container of its own. Its `docker-compose.yml` contains only the Next.js app container.

```
caddy_gateway (external, owned by Portcullis)
  └── fief_app       ← receives proxied traffic from Portcullis Caddy

db_network (external, owned by Portcullis)
  └── fief_app       ← connects to shared Postgres as fief / fief db

fief_internal (stack-internal)
  └── fief_app
```

### docker-compose.yml shape

```yaml
services:
  app:
    build: .
    container_name: fief_app
    restart: unless-stopped
    env_file: .env
    networks:
      - fief_internal
      - caddy_gateway
      - db_network

networks:
  fief_internal:
  caddy_gateway:
    external: true
  db_network:
    external: true
```

No ports are exposed on the host. Caddy reaches `fief_app:3000` via `caddy_gateway`.

---

## DNS Provider Architecture

Fief is designed to support multiple DNS registrars. The abstraction lives in `lib/dns/provider.ts` and defines the interface all provider modules must implement. The NameCheap module is the first and only implementation for now.

### Provider interface (`lib/dns/provider.ts`)

```typescript
export interface DnsRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT';
  host: string;   // relative to the tenant's subdomain path
  value: string;
  ttl?: number;
}

export interface DnsProvider {
  /** List all records currently under the given subdomain path */
  listRecords(subdomainPath: string): Promise<DnsRecord[]>;
  /** Set (upsert) a record */
  setRecord(subdomainPath: string, record: DnsRecord): Promise<void>;
  /** Delete a record by host + type */
  deleteRecord(subdomainPath: string, host: string, type: DnsRecord['type']): Promise<void>;
}
```

### NameCheap module (`lib/dns/namecheap.ts`)

NameCheap's API is XML-based. Key notes:

- Base URL: `https://api.namecheap.com/xml.response`
- Required params on every call: `ApiUser`, `ApiKey`, `UserName`, `ClientIp`, `Command`
- `ClientIp` must be the **public IP of the server making the request**. On the VPS this is the VPS's public IP, set in `.env` as `NAMECHEAP_CLIENT_IP`.
- NameCheap's `setHosts` command **replaces all records for a domain at once** — it is not additive. To add or modify one record, you must first fetch all existing records, apply the change in memory, then push the full set back. The module must handle this transparently.
- The NameCheap API operates at the **SLD+TLD level** (e.g. `lucchesi.io`), not at the subdomain level. The module must correctly split a tenant's subdomain path (e.g. `filippo.lucchesi.io`) into SLD (`lucchesi`) + TLD (`io`) for API calls, and scope reads/writes to only the relevant host entries.
- Sandbox API available at `https://api.sandbox.namecheap.com/xml.response` — controlled by `NAMECHEAP_SANDBOX=true` in `.env`.

### Provider registry (`lib/dns/index.ts`)

Exports a single `getProvider(): DnsProvider` function that reads `DNS_PROVIDER` from the environment and returns the appropriate implementation. Currently only `namecheap` is valid.

---

## Authentication Model

### Tenant API key

- A random, unguessable string (e.g. 32-byte hex).
- Stored **hashed** (bcrypt or argon2) in Postgres. The plaintext is shown once on creation and never again.
- Associated with exactly one subdomain path (e.g. `filippo.lucchesi.io`).
- Passed as `Authorization: Bearer <key>` on API requests.
- On web UI login, entered on the login page. If valid, a signed HTTP-only session cookie is issued (use `iron-session` or similar — no JWT in localStorage).

### Admin API key

- A single key defined in `.env` as `ADMIN_API_KEY`.
- Not stored in Postgres — compared directly from the environment.
- Grants access to the admin interface: manage all tenants, all records, generate/revoke keys.
- Same authentication flow as tenant keys (Bearer header for API, login page for UI).

### Session handling

- Sessions are HTTP-only signed cookies. Never store auth state in localStorage or sessionStorage.
- Session payload: `{ tenantId: string | null, isAdmin: boolean }`.
- `isAdmin: true` is only set when the presented key matches `ADMIN_API_KEY`.

---

## REST API

All endpoints are under `/api/v1/`. Authentication via `Authorization: Bearer <key>` header.

### Tenant endpoints (scoped to the key's subdomain path)

```
GET    /api/v1/records              List all records for this tenant
POST   /api/v1/records              Create or update a record
DELETE /api/v1/records/:host/:type  Delete a specific record
```

### Admin endpoints (admin key only)

```
GET    /api/v1/admin/tenants               List all tenants
POST   /api/v1/admin/tenants               Create a tenant (generate key, assign path)
DELETE /api/v1/admin/tenants/:id           Delete a tenant and their records
POST   /api/v1/admin/tenants/:id/rotate    Rotate a tenant's API key
```

All responses are JSON. Errors follow `{ error: string, code: string }`.

---

## Web UI

### Tenant UI

- Login page: enter API key → session cookie issued → redirect to tenant dashboard.
- Dashboard: list current DNS records with edit/delete actions.
- Add record form: select type (A / AAAA / CNAME / TXT), enter host and value.
- Mobile-friendly PWA (see PWA requirements below).

### Admin UI

- Same login page, but admin key grants access to the admin dashboard.
- Admin dashboard: list all tenants, their subdomain paths, and record counts.
- Per-tenant detail: view/edit/delete their records.
- Key management: generate new tenant, rotate or revoke a key.

---

## Database Schema

Fief uses its own dedicated Postgres database (`fief`) and user (`fief`) on the shared Portcullis Postgres instance.

```prisma
model Tenant {
  id             String    @id @default(cuid())
  subdomainPath  String    @unique   // e.g. "filippo.lucchesi.io"
  label          String              // human-readable name, e.g. "Filippo"
  keyHash        String              // bcrypt/argon2 hash of the API key
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

DNS records are **not** stored in Postgres — they are always read from and written to the registrar's API directly. Postgres is the source of truth only for tenants and their key hashes.

---

## Internationalisation (i18n)

- Library: **next-intl** (same as Portcullis).
- Initial languages: `en` (default), `it`.
- All user-facing strings in `messages/{locale}.json`. Never hardcode UI strings.
- Use `useTranslations` in client components, `getTranslations` in server components and route handlers.
- Locale config in `i18n/config.ts`.

---

## PWA Requirements

Fief is a PWA.

- Web App Manifest at `public/manifest.json` — complete with name, short_name, icons, display, start_url, theme_color.
- Service worker via `next-pwa` (compatible with Next.js 16.2).
- UI must be usable on mobile — a tenant may manage their DNS records from their phone.
- Offline: the shell loads offline; API-dependent views show a clear offline state.

---

## Development Environment

### Local machine (primary workspace)

All development, building, and testing happens locally. The local machine:

- Has Docker + Docker Compose identical to the VPS.
- Is **not reachable from outside** (no NAT). The NameCheap API is called *outbound* from the container, so this is fine — no inbound requirement.

### Allowed commands (agent may run these)

```bash
tsc --noEmit                  # type-check after changes
npx prisma generate           # regenerate Prisma client after schema changes
npx prisma migrate diff       # inspect pending migrations
docker compose build          # build image
docker compose up -d          # start stack
docker compose down           # stop stack (never use -v unless explicitly instructed)
docker compose logs -f        # inspect logs
docker exec -it <container>   # exec into running container
```

### Forbidden commands (agent must NOT run these)

```bash
npm run dev                  # not useful; everything runs in Docker
npm run start                # same reason
npx prisma migrate deploy    # never run directly — see Prisma workflow below
```

---

## Prisma Migration Workflow

> **This is the single most common source of repeated mistakes. Read carefully.**
> Inherited from Portcullis — same workflow, different container name.

Prisma migrations must be generated and applied **inside the running container**, not on the host. Migration files must then be copied back into the source tree so they are baked into the next image build.

### Step-by-step

1. Edit `prisma/schema.prisma`.

2. Regenerate the Prisma client on the host (for type-checking):
   ```bash
   npx prisma generate
   ```

3. Start the stack. Note: Fief connects to the **shared Portcullis Postgres** — ensure Portcullis is running first, so `db_network` exists and the Postgres container is up.
   ```bash
   docker compose up -d
   ```

4. Generate the migration **inside the app container**:
   ```bash
   docker exec -it fief_app \
     npx prisma migrate dev --name <descriptive_migration_name>
   ```

5. Copy migration files back to the host:
   ```bash
   docker cp fief_app:/app/prisma/migrations ./prisma/
   ```

6. Verify files are present on the host, then commit them.

7. On the VPS, `docker compose up --build -d` builds a new image. The entrypoint runs `prisma migrate deploy` on startup.

**The agent must propose this workflow whenever a schema change is required, without being reminded.**

---

## Known Gotchas (inherited from Portcullis + Fief-specific)

- **Next.js 16.2 Routing**: Use `proxy.ts` instead of `middleware.ts` for i18n routing and request interception.
- **Prisma 7 Config**: Database connection URLs live in `prisma.config.ts`, not `schema.prisma`.
- **Prisma 7 Runtime**: In Next.js standalone builds, use the `pg` driver adapter (`@prisma/adapter-pg`) — pass the connection string and adapter explicitly to the `PrismaClient` constructor.
- **Next-intl Plugin**: Use `createNextIntlPlugin()` in `next.config.ts` to avoid "Couldn't find next-intl config file" errors in standalone mode.
- **Docker Build Context**: TypeScript errors cause `docker compose build` to fail at `npm run build`. Fix all type errors on the host before building.
- **Prisma Migrations in Docker**: Follow the workflow above exactly. If selective copying of `node_modules` fails during the build, copy the entire `node_modules` into the runner stage.
- **Portcullis must be running first**: Fief has no Postgres of its own. If `db_network` does not exist or the shared Postgres is not up, `docker compose up` will fail. Always start Portcullis before Fief.
- **NameCheap setHosts is destructive**: The `setHosts` command replaces *all* records for a domain. Always fetch the full current record set, apply the change in memory, then push the complete list back. Never call `setHosts` with a partial list or you will delete records you did not intend to touch.
- **NameCheap ClientIp**: The `ClientIp` parameter must match the IP whitelisted in the NameCheap API settings. On the VPS, set `NAMECHEAP_CLIENT_IP` to the VPS's public IP. Locally, always use `NAMECHEAP_SANDBOX=true` to avoid IP whitelist issues entirely.
- **NameCheap API is SLD+TLD only**: The API operates on `lucchesi.io`, not on `filippo.lucchesi.io`. Always split the tenant's subdomain path correctly before making API calls. The SLD is everything except the last two dot-separated parts (TLD may be multi-part, e.g. `co.uk` — handle this carefully or constrain to single-part TLDs for now).
- **Sessions**: Use HTTP-only signed cookies (`iron-session` or equivalent). Never store auth tokens in localStorage or sessionStorage.
- **Admin key is env-only**: The admin key is never written to the database. Comparing it must always be done against `process.env.ADMIN_API_KEY` using a constant-time comparison to avoid timing attacks.

---

## Project Structure

```
fief/
├── AGENTS.md                      # this file — keep it updated
├── README.md                      # human-facing docs — updated each session
├── docker-compose.yml             # fief_app only — no Caddy, no Postgres
├── docker-compose.local.yml       # local overrides if needed
├── Dockerfile
├── .env.example                   # all required env vars, no secrets
├── app/                           # Next.js 16.2 App Router
│   ├── api/
│   │   └── v1/
│   │       ├── records/
│   │       └── admin/
│   ├── [locale]/
│   │   ├── login/
│   │   ├── dashboard/
│   │   └── admin/
│   └── layout.tsx
├── components/
├── lib/
│   ├── dns/
│   │   ├── provider.ts            # DnsProvider interface + DnsRecord type
│   │   ├── namecheap.ts           # NameCheap implementation
│   │   └── index.ts               # getProvider() factory
│   ├── auth.ts                    # key verification, session helpers
│   └── db.ts                      # Prisma client (pg adapter)
├── messages/
│   ├── en.json
│   └── it.json
├── prisma/
│   ├── schema.prisma
│   ├── prisma.config.ts
│   └── migrations/
├── public/
│   └── manifest.json
├── i18n/
│   └── config.ts
├── proxy.ts                       # next-intl + auth interception (NOT middleware.ts)
└── docs/
    ├── decisions/
    └── tasks/
        └── current-task.md
```

---

## Environment Variables

```bash
# Database (shared Portcullis Postgres)
DATABASE_URL=postgresql://fief:password@portcullis_db:5432/fief

# DNS provider
DNS_PROVIDER=namecheap

# NameCheap credentials
NAMECHEAP_API_USER=
NAMECHEAP_API_KEY=
NAMECHEAP_USERNAME=
NAMECHEAP_CLIENT_IP=        # public IP of the VPS (whitelisted in NameCheap account)
NAMECHEAP_SANDBOX=false     # set to true locally

# Auth
ADMIN_API_KEY=              # special key for admin UI and admin API endpoints
SESSION_SECRET=             # long random string for signing session cookies

# App
NEXT_PUBLIC_APP_URL=        # e.g. https://fief.yourdomain.com
```

---

## Deployment

Fief runs under Portcullis. Before deploying for the first time:

1. Ensure Portcullis is running and `caddy_gateway` / `db_network` exist.
2. Create the Fief database and user on the shared Postgres instance:
   ```sql
   CREATE USER fief WITH PASSWORD '...';
   CREATE DATABASE fief OWNER fief;
   ```
3. Register Fief as a service in the Portcullis UI (`fief.yourdomain.com → fief_app:3000`).
4. Sync and deploy:
   ```bash
   rsync -avz --exclude node_modules --exclude .next \
     ./ user@vps-host:/opt/fief/
   ssh user@vps-host "cd /opt/fief && docker compose up --build -d"
   ```

---

## Architecture Decision Records

| # | Decision |
|---|---|
| 001 | DNS records stored at registrar only — Postgres holds tenants and key hashes |
| 002 | Provider abstraction behind DnsProvider interface for future registrar support |
| 003 | NameCheap setHosts is always fetch-patch-push, never partial write |
| 004 | Admin key in .env only — not in DB — to keep admin access out of the tenant model |
| 005 | Prisma migrations generated inside container, committed to source (inherited) |
| 006 | HTTP-only signed cookies for sessions — no localStorage auth |

---

## Current State

> **This section is updated at the end of every session.**

### What exists

- [x] Project scaffolding
- [x] `docker-compose.yml` (app only — no Caddy, no Postgres)
- [x] Dockerfile + entrypoint
- [x] `lib/dns/provider.ts` (DnsProvider interface)
- [x] `lib/dns/namecheap.ts` (NameCheap implementation)
- [x] `lib/dns/index.ts` (getProvider factory)
- [x] `lib/auth.ts` (key verification, session helpers)
- [x] `lib/db.ts` (Prisma client with pg adapter)
- [x] Prisma schema (Tenant model)
- [x] REST API — tenant endpoints
- [x] REST API — admin endpoints
- [x] Web UI — login page (Redesigned with custom branding)
- [x] Web UI — tenant dashboard (Refined dark theme)
- [x] Web UI — admin dashboard (Refined dark theme)
- [x] API Documentation page (New interactive specs)
- [x] Language Switcher (New persistent component)
- [x] i18n setup (next-intl, en + it fully synced)
- [x] PWA manifest + service worker
- [x] Custom branding assets (Logo, Favicon, PWA icons)
- [x] `.env.example`
- [x] ADR stubs in `docs/decisions/`

### Known gotchas

- **Prisma 7 Configuration**: Connection URLs MUST move from `schema.prisma` to `prisma.config.js` (or `.ts`). The `url` property in `datasource` is no longer supported in the schema file. When using `prisma migrate deploy`, the `datasource.url` must be explicitly present in the config file.
- **Next.js 15/16 Async Params**: `params` and `searchParams` in Pages, Layouts, and API route handlers are now Promises and MUST be awaited. Typing them as plain objects will cause build failures.
- **Next.js Root Layout**: A root layout with `<html>` and `<body>` tags is mandatory. In localized apps, ensure `app/[locale]/layout.tsx` satisfies this requirement and that no `page.tsx` exists outside the localized group without a corresponding layout.
- **Prisma Migrate Shadow DB**: `prisma migrate dev` requires `CREATEDB` permissions to create a shadow database. On shared Postgres instances (like Portcullis), use `npx prisma db push` as a workaround to sync the schema.
- **Header Redundancy**: Redundant headers were removed from individual pages as they are now handled globally in the root `layout.tsx` for consistency.
- **Dark Mode Enforcement**: The application is explicitly set to `dark` mode in the `<html>` tag to ensure the new premium aesthetics are consistent across all components.

### Last session summary

Implemented a comprehensive branding overhaul, replacing legacy assets with a custom-generated minimalistic logo and high-fidelity dark-themed UI. Added a dedicated API documentation page with interactive specs and code examples. Introduced a persistent language switcher in the global header and fully synchronized English and Italian localization keys. Updated the README with standalone deployment instructions, a link to [Portcullis](https://github.com/Odiobill/Portcullis), and a note on the extensible provider-agnostic architecture.

---

## End-of-Session Checklist

> The agent performs these steps at the end of every session **without being asked**.

1. **Update "Current State"** — tick completed items, add new ones if scope expanded.
2. **Update "Known gotchas"** — document any non-obvious issue that required more than one attempt. Be specific enough that the next session avoids repeating it.
3. **Update "Last session summary"** — two to five sentences on what was built or changed.
4. **Update `README.md`** — reflect newly implemented features in human-readable language.
5. **Remind the operator** to:
   - Review the diff and commit all changes.
   - Copy any new Prisma migration files from the container if a schema change was made (see [Prisma Migration Workflow](#prisma-migration-workflow)).
   - Sync and deploy to the VPS if the session produced a deployable change.
6. **If `docs/tasks/current-task.md` was used**, archive it to `docs/tasks/YYYY-MM-DD-<slug>.md` and clear the current file.
