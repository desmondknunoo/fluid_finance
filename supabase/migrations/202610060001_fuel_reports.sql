-- Separate report storage in the existing Fluid Finance Supabase project.
-- Each immutable edition stores all suppliers atomically in a single insert.
begin;
create table if not exists public.fuel_reports (
    id uuid primary key default gen_random_uuid(),
    report_date date not null,
    prices jsonb not null check (jsonb_typeof(prices) = 'array' and jsonb_array_length(prices) between 1 and 20),
    created_at timestamptz not null default now()
);
create index if not exists fuel_reports_date_idx on public.fuel_reports (report_date desc, created_at desc);
alter table public.fuel_reports enable row level security;
-- Only the Pages Function may access reports after checking the fixed login.
revoke all on public.fuel_reports from anon, authenticated;
grant select, insert on public.fuel_reports to service_role;
commit;
