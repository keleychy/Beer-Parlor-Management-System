-- Migration: 001_create_tables.sql
-- Idempotent migration to create core tables and policies

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'storekeeper', 'attendant');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL,
  password TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT users_email_check CHECK (email ~* '^.+@.+\..+$')
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity_per_crate INTEGER NOT NULL DEFAULT 1,
  last_restocked TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  attendant_id UUID REFERENCES public.users(id),
  attendant_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  quantity_in INTEGER NOT NULL DEFAULT 0,
  quantity_out INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  attendant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  quantity_assigned INTEGER NOT NULL,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('crates', 'bottles')),
  quantity_per_crate INTEGER,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.health_check (
  id SERIAL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'OK',
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.health_check ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Example policies (idempotent creation)
CREATE POLICY IF NOT EXISTS users_select_owner_or_admin ON public.users
  FOR SELECT USING (
    auth.uid() = id::text
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY IF NOT EXISTS users_no_client_insert ON public.users
  FOR INSERT USING (false);

CREATE POLICY IF NOT EXISTS users_update_admin_only ON public.users
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid() AND u.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid() AND u.role = 'admin'));

CREATE POLICY IF NOT EXISTS products_select_authenticated ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS products_write_admin_storekeeper ON public.products
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid() AND u.role IN ('admin','storekeeper')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid() AND u.role IN ('admin','storekeeper')));

CREATE POLICY IF NOT EXISTS sales_select_authenticated ON public.sales
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS sales_insert_attendant_or_admin ON public.sales
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid() AND u.role IN ('admin','attendant')));

CREATE POLICY IF NOT EXISTS inventory_select_authenticated ON public.inventory
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS inventory_write_admin_storekeeper ON public.inventory
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid() AND u.role IN ('admin','storekeeper')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid() AND u.role IN ('admin','storekeeper')));

CREATE POLICY IF NOT EXISTS assignments_select_authenticated ON public.assignments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS assignments_write_admin_storekeeper ON public.assignments
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid() AND u.role IN ('admin','storekeeper')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = auth.uid() AND u.role IN ('admin','storekeeper')));

CREATE POLICY IF NOT EXISTS health_check_select_public ON public.health_check
  FOR SELECT USING (true);

COMMIT;
