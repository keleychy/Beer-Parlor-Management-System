-- Rollback for 001_create_tables: drop the core tables and type (use with caution)

BEGIN;

DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.health_check CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    DROP TYPE user_role;
  END IF;
END$$;

COMMIT;
