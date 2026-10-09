begin;
alter table public.fuel_reports drop constraint if exists fuel_reports_prices_check;
alter table public.fuel_reports add constraint fuel_reports_prices_check
    check (jsonb_typeof(prices) = 'array' and jsonb_array_length(prices) between 1 and 500);

create table if not exists public.fuel_omcs (
    id uuid primary key default gen_random_uuid(),
    name text not null check (length(btrim(name)) between 1 and 60),
    name_key text generated always as (lower(btrim(name))) stored unique,
    logo_url text not null,
    created_at timestamptz not null default now()
);
alter table public.fuel_omcs enable row level security;
revoke all on public.fuel_omcs from anon, authenticated;
grant select, insert, update on public.fuel_omcs to service_role;

-- Public logo reads allow canvas rendering; uploads only use the server key.
-- Immutable filenames preserve the appearance of previously saved reports.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('omc-logos', 'omc-logos', true, 262144, array['image/png'])
on conflict (id) do nothing;
commit;
