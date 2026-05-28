-- Explicit schema and table grants required from May 30, 2026
-- (Supabase: public schema no longer auto-exposed to Data API for new projects)
-- Existing project safe until Oct 30, 2026 — applying now as best practice.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.watchlist TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.processed_news TO anon, authenticated, service_role;

-- Sequences used by gen_random_uuid() default values
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Any future tables created in public schema will inherit these grants automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
