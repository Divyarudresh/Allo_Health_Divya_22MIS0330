# Allo Health — Inventory Reservation System

**Developed by Divya R (22MIS0330)**

A warehouse inventory app where users browse health products, reserve stock for a limited time, and either confirm or release reservations. Stock is tracked per product per warehouse with pessimistic-style locking via database transactions.

---

## Problem understanding (before implementation)

Before writing code, the core constraints were mapped out:

| Requirement | Design choice |
|-------------|---------------|
| Stock must not be oversold | `reservedUnits` on `Inventory`; available = `totalUnits - reservedUnits` |
| Reservations are temporary | `pending` status + `expiresAt` (10 minutes from creation) |
| Expired holds must free stock | Background job marks reservation `released` and decrements `reservedUnits` |
| Confirm vs abandon | User can **confirm** (keeps hold, status → `confirmed`) or **release** (returns units immediately) |
| Multi-warehouse | Unique `(productId, warehouseId)` on `Inventory` |

**Reservation lifecycle**

```
Reserve (POST) → pending + reservedUnits++
       │
       ├─ Confirm (POST) → confirmed (stock stays reserved)
       ├─ Release (POST) → released + reservedUnits--
       └─ Expires (cron) → released + reservedUnits--  (if still pending)
```

This model keeps reads simple (one counter per warehouse line) and avoids race conditions on reserve by wrapping inventory update + reservation insert in a single Prisma transaction.

---

## Tech stack

- **Next.js 16** (App Router) — UI + API routes
- **Prisma** — ORM and schema
- **PostgreSQL** — database (tested with Supabase)
- **Vercel** — deployment + Cron Jobs

---

## Run locally

### Prerequisites

- Node.js 20+
- npm
- A PostgreSQL database (local Docker, Supabase, Neon, etc.)

### 1. Clone and install

```bash
cd allo-inventory
npm install
```

### 2. Environment variables

Copy the example env file and set your database URL:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |

Example (Supabase):

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

> `.env` is gitignored. Never commit real credentials.

### 3. Database schema (migrations)

This project uses **`prisma db push`** to sync the schema to the database (suitable for prototypes and Supabase). For a stricter production workflow, you would switch to `prisma migrate dev` / `prisma migrate deploy`.

```bash
npm run db:push
```

This applies `prisma/schema.prisma` (tables: `Product`, `Warehouse`, `Inventory`, `Reservation`).

### 4. Seed sample data

Seeds **12 health products** across **3 warehouses** (Bangalore, Hyderabad, Mumbai) with inventory rows:

```bash
npm run db:seed
```

The seed script clears existing products/inventory/reservations and repopulates — safe for dev, **do not run against production** without caution.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Dev server | `npm run dev` | Local development |
| Build | `npm run build` | Production build |
| DB push | `npm run db:push` | Sync Prisma schema to DB |
| Seed | `npm run db:seed` | Load sample products & stock |

---

## Expiry mechanism in production

### What happens when a user reserves

1. `POST /api/reservations` runs inside a **transaction**:
   - Checks `availableStock = totalUnits - reservedUnits`
   - Increments `reservedUnits` by `quantity`
   - Creates a `Reservation` with `status: pending` and `expiresAt = now + 10 minutes`

2. The user is redirected to `/reservation/[id]` where they can:
   - **Confirm** — `POST /api/reservations/[id]/confirm` (only if not expired)
   - **Release** — `POST /api/reservations/[id]/release` (manual early return of stock)

### Automatic expiry (production)

Pending reservations past `expiresAt` are cleaned up by a **Vercel Cron Job**, configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/release-expired",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

- **Schedule:** every minute (`*/1 * * * *`)
- **Endpoint:** `GET /api/cron/release-expired`

**Cron handler logic** (`app/api/cron/release-expired/route.ts`):

1. Find all reservations where `status = pending` AND `expiresAt < now`
2. For each, in a transaction:
   - Decrement `reservedUnits` on the matching inventory row
   - Set reservation `status` to `released`
3. Return `{ released: <count> }`

```mermaid
sequenceDiagram
  participant User
  participant API
  participant DB
  participant Cron as Vercel Cron (1 min)

  User->>API: POST /api/reservations
  API->>DB: reservedUnits++, status=pending, expiresAt=+10m
  Note over User: User does nothing for 10+ minutes
  Cron->>API: GET /api/cron/release-expired
  API->>DB: reservedUnits--, status=released
```

### Deploying cron on Vercel

1. Deploy the app to Vercel (cron config is read from `vercel.json` at project root).
2. Ensure `DATABASE_URL` is set in **Vercel → Project → Environment Variables**.
3. Cron runs only on **production** deployments (not on every preview by default on all plans — check your Vercel plan docs).

### Testing expiry locally

Cron does not run automatically in `npm run dev`. To simulate production expiry:

```bash
curl http://localhost:3000/api/cron/release-expired
```

Or hit that URL in the browser after creating a pending reservation whose `expiresAt` is in the past (you can temporarily shorten the 10-minute window in code for testing).

### Confirm after expiry

`POST /api/reservations/[id]/confirm` returns **410** if `expiresAt < now`, so expired holds cannot be confirmed even if the cron has not run yet. Until cron runs, `reservedUnits` may still include expired pending rows — the cron is what eventually frees that stock.

---

## API overview

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/products` | List inventory with availability |
| `POST` | `/api/reservations` | Create reservation `{ productId, warehouseId, quantity }` |
| `GET` | `/api/reservations/[id]` | Reservation details |
| `POST` | `/api/reservations/[id]/confirm` | Confirm pending reservation |
| `POST` | `/api/reservations/[id]/release` | Manually release stock |
| `GET` | `/api/cron/release-expired` | Release all expired pending reservations |

---

## Trade-offs and future improvements

### Decisions made (and why)

| Choice | Trade-off |
|--------|-----------|
| **`reservedUnits` counter** instead of summing pending rows | Faster availability checks; cron/manual release must stay in sync |
| **`db push` vs migrations** | Faster iteration for assignment/demo; less migration history in git |
| **10-minute TTL hardcoded** | Simple; would move to env/config in production |
| **Cron every 1 minute** | Stock freed within ~1 min after expiry; more invocations than a 5-min schedule |
| **Sequential cron loop** | Easy to read; under high load, batch update or job queue would scale better |
| **No auth on cron route** | Relies on Vercel cron + obscurity; should add `CRON_SECRET` header check |
| **Client-side UI (`useState` + `fetch`)** | No React Query wiring yet despite dependency being installed |
| **Duplicate `src/app` folder** | Legacy copy; active app lives under root `app/` — would delete `src/app` to avoid confusion |

### With more time, I would

1. **Secure cron** — verify `Authorization: Bearer ${CRON_SECRET}` (Vercel sends this when configured).
2. **Prisma migrations** — replace `db push` with versioned migrations for production.
3. **Idempotent cron** — use advisory locks or `UPDATE … RETURNING` in one query to avoid double-release if cron overlaps.
4. **Optimistic UI** — refresh product list after reserve/release; use TanStack Query.
5. **Admin panel** — adjust `totalUnits`, view reservation audit log.
6. **Integration tests** — reserve → expire → assert `availableStock` restored.
7. **Confirmed reservations** — define whether `confirmed` should eventually decrement `totalUnits` (sale) vs stay as reserved forever.

---

## Project structure

```
allo-inventory/
├── app/
│   ├── api/              # REST routes (products, reservations, cron)
│   ├── components/       # Header, ProductCard, StockBadge
│   ├── reservation/[id] # Reservation detail page
│   ├── layout.tsx
│   └── page.tsx          # Product catalog
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── vercel.json           # Cron schedule
└── .env.example
```

---

## Suggested git history (for reviewers)

A clear commit narrative helps reviewers see intent before code:

1. `chore: init Next.js + Prisma schema for inventory/reservations`
2. `feat: reserve API with transactional stock hold`
3. `feat: confirm and release reservation endpoints`
4. `feat: cron job to release expired pending reservations`
5. `feat: product catalog UI and reservation detail page`
6. `chore: seed health products across warehouses`
7. `docs: README with setup, expiry, and trade-offs`

---

## License

Academic / assignment project — Allo Health inventory challenge.
