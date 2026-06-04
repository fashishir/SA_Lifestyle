# SA_Lifestyle

Full-stack e-commerce for a footwear / lifestyle store. Customers browse, add to cart, check out (Cash on Delivery or online), and track their order by tracking ID. Admins manage products, categories, orders, and users from a styled dashboard.

## Stack

- **Frontend:** React 18, Vite, React Router, Recharts, Axios
- **Backend:** Node.js, Express, PostgreSQL (`pg`), JWT auth, Multer uploads
- **Database:** PostgreSQL (schema + seed in `database/`)
- **Deploy:** Railway (Nixpacks) for backend + frontend, Railway Postgres for DB
- **Local dev:** native Postgres **or** Docker Compose

## Repo layout

```
backend/            # Express API
  src/              # routes, controllers, middleware, config
  scripts/          # init-db.js, migrate-cod-tracking.js
frontend/           # React SPA (Vite)
database/           # schema.sql, seed.sql
deploy/             # docker-compose.yml + .env.example
```

---

## Quick start — pick one path

The default Postgres credentials (user `postgres`, password `admin`, db `sa_lifestyle`) match what the backend falls back to when no `.env` is present, so the local path works with **zero config** if your local Postgres matches.

### Path 1 — Local Postgres (Windows / macOS / Linux)

**Prereq:** PostgreSQL 14+ running, with user `postgres` and password `admin`. If your local password is different, create `backend/.env` first (see [Configuration](#configuration) below).

```bash
# From the repo root
cd backend
npm install
npm run db:init         # creates DB if needed, applies schema, loads seed
npm run dev             # http://localhost:5000

# In a second terminal:
cd frontend
npm install
npm run dev             # http://localhost:3000
```

If you want to start clean (drop & recreate all tables):
```bash
npm run db:init:reset
```

If you only want the schema (no seed data):
```bash
npm run db:init:no-seed
```

### Path 2 — Docker (no local Postgres install needed)

**Prereq:** Docker Desktop.

```bash
# From the repo root
cp deploy/.env.example deploy/.env      # optional, edit if you want
cd deploy
docker compose up --build
```

This starts three containers:
- `sa_db` — Postgres 16 (auto-applies `schema.sql` and `seed.sql` on first boot)
- `sa_backend` — Node 20 API on `http://localhost:5000`
- `sa_frontend` — Vite dev server on `http://localhost:3000`

To stop and wipe the DB volume:
```bash
docker compose down -v
```

### Path 3 — Railway Postgres (cloud, no local install)

1. In your Railway project → **New** → **Database** → **PostgreSQL**.
2. Open the Postgres service → **Variables** → copy `DATABASE_URL`.
3. Apply the schema and seed from your local machine, using the cloud URL:
   ```bash
   # PowerShell
   $env:DATABASE_URL = "postgres://user:pass@host:port/railway"
   cd backend
   npm install
   npm run db:init
   ```
4. Create the backend Railway service from this repo (root: `backend`).
5. In that service → **Variables** → set `DATABASE_URL` to the same value. It will override the local defaults automatically — see `backend/src/config/db.js`.
6. Set `JWT_SECRET` to a long random string.

> The same `npm run db:init` works against any reachable Postgres URL — it reads `DATABASE_URL` first and falls back to `DB_*`.

---

## Configuration

`backend/.env` (optional, all values have sensible defaults):

```env
# Either set DATABASE_URL (cloud)...
DATABASE_URL=postgres://user:pass@host:5432/db

# ...or set the individual DB_* vars (local).
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=sa_lifestyle

PORT=5000
NODE_ENV=development
JWT_SECRET=replace-me
CORS_ORIGIN=http://localhost:3000
UPLOAD_DIR=./uploads
```

`frontend/.env` (optional):

```env
VITE_API_URL=https://your-backend.up.railway.app
```

If `VITE_API_URL` is unset, the frontend uses `/api` and relies on Vite's proxy to `http://localhost:5000`.

---

## Database scripts (backend `package.json`)

| Script | What it does |
|---|---|
| `npm run db:init` | Creates the DB if missing, applies `database/schema.sql`, loads `database/seed.sql`. Idempotent (skips seed on duplicate key). |
| `npm run db:init:reset` | Drops every table in the public schema first, then re-applies schema + seed. |
| `npm run db:init:no-seed` | Only applies the schema. |
| `npm run db:migrate:cod` | Adds COD + tracking columns to an **existing** DB. Idempotent; safe to run multiple times. |

---

## Migrations

If you have an existing database that predates the Cash-on-Delivery / tracking-id work, run:

```bash
npm run db:migrate:cod
```

This adds `payment_method`, `payment_status`, `tracking_id`, `phone`, `notes`, and `updated_at` to the `orders` table; installs indexes; creates the `generate_tracking_id()` function and BEFORE-INSERT trigger; and backfills a `SA000001`-style tracking id for any pre-existing orders.

The script is idempotent — every step uses `IF NOT EXISTS` / `CREATE OR REPLACE` so it's safe to run repeatedly.

---

## Features

### Customer
- Browse products by gender / category
- Product detail with sizes & colors
- Cart, checkout, order confirmation
- **Cash on Delivery** (phone number required)
- **Online Payment (SSLCommerz)** — stub UI; integrate when keys are issued
- **Order tracking** at `/track/:trackingId` or `/track` (public, PII-masked)

### Admin
- Modern, live-updating dashboard with 30s polling
- KPI cards with animated count-up + delta vs previous period
- Revenue area chart, order status donut, recent orders, top products
- Product CRUD with image upload
- Order management with status updates, payment method, and tracking id
- User & category management

## API surface (selected)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | – | Create account |
| `POST` | `/api/auth/login` | – | Login, returns JWT |
| `GET`  | `/api/products` | – | List products |
| `POST` | `/api/orders` | user | Create order (COD or online) |
| `GET`  | `/api/orders/track/:trackingId` | **public** | Track order (PII-masked) |
| `GET`  | `/api/admin/dashboard` | admin | Aggregated stats |
| `PUT`  | `/api/admin/orders/:id/status` | admin | Update order status |

## Tracking ID format

`SA` + 6-digit zero-padded order id, e.g. `SA000123`. Auto-generated by a Postgres trigger on insert; the public `/track/:trackingId` endpoint accepts both lowercase and uppercase.

## Security notes

- Never commit real `.env` files. `.env` is git-ignored; ship `.env.example` only.
- The public tracking endpoint deliberately omits phone, full address, and customer email.
- All admin routes go through `authenticate + adminOnly` middleware.
- CORS is restricted to `CORS_ORIGIN` in production; empty value means open (dev only).

## Roadmap

- Real SSLCommerz integration (gateway URL, validation, IPN)
- Email/SMS notifications on status changes
- Reviews & ratings table (replace placeholder `avgRating: 4.5`)
- Inventory management and low-stock alerts
- Customer-side return / exchange flow
