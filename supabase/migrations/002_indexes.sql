-- Migration: 002_indexes.sql
-- Add helpful indexes to improve query performance

BEGIN;

CREATE INDEX IF NOT EXISTS idx_products_name ON public.products (lower(name));
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales (created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_created_at ON public.inventory (created_at);
CREATE INDEX IF NOT EXISTS idx_assignments_attendant_id ON public.assignments (attendant_id);

COMMIT;
