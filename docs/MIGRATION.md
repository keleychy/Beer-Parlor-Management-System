Supabase Migration Guide
=======================

This document explains how to run the idempotent migrations and seed the staging Supabase project for the Beer Parlor Management System.

Warning: Run these steps against a staging Supabase project first. The seed script creates Auth users with example passwords.

Prerequisites
- Node 18+ (Node 20 recommended)
- `DATABASE_URL` for the Supabase Postgres (service connection string)
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for seeding (service role key)

1) Install dependencies

```powershell
pnpm install
# or
npm install
```

2) Run migrations locally

```powershell
$env:DATABASE_URL="postgres://<db_user>:<db_pass>@<host>:<port>/<db_name>"
# Run migrations
pnpm run migrate
# or
npm run migrate
```

3) Seed (creates Auth users and sample products)

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://<your-project>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
pnpm run seed
# or
npm run seed
```

4) Verify basic data

Use `psql` or Supabase SQL editor to run checks:

```sql
-- Count products
SELECT COUNT(*) FROM public.products;

-- Check users exist and their roles
SELECT id, email, role, created_at FROM public.users;

-- Check policies are present
SELECT policyname, polcmd, polpermissive FROM pg_policies WHERE schemaname='public';
```

5) Rollback (if needed)

```powershell
$env:DATABASE_URL="postgres://..."
psql $env:DATABASE_URL -f supabase/migrations/001_drop_tables.sql
```

6) CI / GitHub Actions

You can trigger the built-in workflow `Supabase Migrations` from the Actions tab. Add the following repository secrets:

- `DATABASE_URL` (your Supabase Postgres connection string)
- `NEXT_PUBLIC_SUPABASE_URL` (Supabase project URL)
- `SUPABASE_SERVICE_ROLE_KEY` (service role key)

The workflow will run `npm run migrate` and, if secrets are present, `npm run seed`.

Notes
- The migration scripts are idempotent where possible.
- After migrating, validate RLS policies and adjust them to match your Auth/UID mapping approach.
- Rotate service role keys after seeding and provisioning.
