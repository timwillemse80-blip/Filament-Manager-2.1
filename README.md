
# Filament Manager

Beheer je 3D-printer filamentvoorraad eenvoudig en modern.

## 🚀 Koppelen met Supabase (Stappenplan)

1.  Maak een nieuw project aan op [Supabase.com](https://supabase.com).
2.  Ga naar **Project Settings** > **API**.
3.  Kopieer de `Project URL` en de `anon public` key.
4.  Voeg deze toe in je omgeving of in `services/supabase.ts`.
5.  Ga in Supabase naar de **SQL Editor** en voer het onderstaande script uit.

## 🛠️ Master Database Script (SQL)

Voer dit script uit om alle tabellen, views en beveiliging in te stellen.

```sql
-- 1. PROFIELEN (Voor Pro status en instellingen)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_pro boolean default false,
  showcase_name text,
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  auth.jwt() ->> 'email' = 'timwillemse@hotmail.com'
);
create policy "Admins can update all profiles" on public.profiles for update using (
  auth.jwt() ->> 'email' = 'timwillemse@hotmail.com'
);

-- Automatisch profiel maken bij registratie
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. LOCATIES
create table if not exists public.locations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);
alter table public.locations enable row level security;
create policy "Users manage own locations" on public.locations for all using (auth.uid() = user_id);

-- 3. LEVERANCIERS
create table if not exists public.suppliers (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  website text,
  created_at timestamptz default now()
);
alter table public.suppliers enable row level security;
create policy "Users manage own suppliers" on public.suppliers for all using (auth.uid() = user_id);

-- 4. FILAMENTEN
create table if not exists public.filaments (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  brand text not null,
  material text not null,
  "colorName" text,
  "colorHex" text,
  "weightTotal" numeric default 1000,
  "weightRemaining" numeric default 1000,
  "tempNozzle" numeric,
  "tempBed" numeric,
  price numeric,
  notes text,
  "purchaseDate" timestamptz default now(),
  "locationId" uuid references public.locations(id) on delete set null,
  "supplierId" uuid references public.suppliers(id) on delete set null,
  "shopUrl" text,
  "shortId" text
);
alter table public.filaments enable row level security;
create policy "Users manage own filaments" on public.filaments for all using (auth.uid() = user_id);

-- 5. OVERIGE MATERIALEN
create table if not exists public.other_materials (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  quantity numeric default 0,
  unit text,
  "minStock" numeric default 0,
  price numeric,
  "locationId" uuid references public.locations(id) on delete set null,
  "supplierId" uuid references public.suppliers(id) on delete set null,
  "shopUrl" text,
  notes text,
  "purchaseDate" timestamptz default now(),
  image text
);
alter table public.other_materials enable row level security;
create policy "Users manage own materials" on public.other_materials for all using (auth.uid() = user_id);

-- 6. PRINTERS
create table if not exists public.printers (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  brand text,
  model text,
  "hasAMS" boolean default false,
  "amsCount" smallint default 0,
  "amsSlots" jsonb default '[]'::jsonb,
  "powerWatts" numeric default 300,
  "purchasePrice" numeric default 0,
  "lifespanHours" numeric default 20000,
  "ipAddress" text,
  "apiKey" text,
  "webcamUrl" text
);
alter table public.printers enable row level security;
create policy "Users manage own printers" on public.printers for all using (auth.uid() = user_id);

-- 7. PRINT LOGBOEK
create table if not exists public.print_jobs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  date timestamptz default now(),
  "printTime" text,
  "totalWeight" numeric,
  "calculatedCost" numeric,
  status text,
  "printerId" uuid references public.printers(id) on delete set null,
  "assemblyTime" numeric default 0,
  "costBreakdown" jsonb,
  "usedFilaments" jsonb,
  "usedOtherMaterials" jsonb
);
alter table public.print_jobs enable row level security;
create policy "Users manage own prints" on public.print_jobs for all using (auth.uid() = user_id);

-- 8. FEEDBACK & VERZOEKEN
create table if not exists public.feedback (
  id bigint generated by default as identity primary key,
  created_at timestamptz default now(),
  message text not null,
  rating smallint,
  user_id uuid references auth.users(id) on delete cascade,
  "is_read" boolean default false,
  platform text,
  user_agent text
);
alter table public.feedback enable row level security;
create policy "Everyone can insert feedback" on public.feedback for insert with check (true);
create policy "Admins can manage feedback" on public.feedback for all using (
  auth.jwt() ->> 'email' = 'timwillemse@hotmail.com'
);

create table if not exists public.deletion_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  reason text,
  created_at timestamptz default now()
);
alter table public.deletion_requests enable row level security;
create policy "Users can request deletion" on public.deletion_requests for insert with check (auth.uid() = user_id);
create policy "Admins can view requests" on public.deletion_requests for select using (
  auth.jwt() ->> 'email' = 'timwillemse@hotmail.com'
);

-- 9. ADMIN VIEW: Gebruikers Statistieken (LIVE)
-- We verwijderen de view eerst omdat PostgreSQL niet toestaat kolommen te hernoemen met CREATE OR REPLACE VIEW
drop view if exists public.admin_user_stats;

create view public.admin_user_stats as
select 
  p.id,
  u.email,
  p.is_pro,
  u.created_at,
  (select count(*) from public.filaments f where f.user_id = p.id) as filament_count,
  (select count(*) from public.print_jobs pj where pj.user_id = p.id) as print_count
from public.profiles p
join auth.users u on u.id = p.id;

-- Geef toegang tot de view voor de admin
alter view public.admin_user_stats owner to postgres;
grant select on public.admin_user_stats to authenticated;

-- 10. GLOBALE INSTELLINGEN (Voor logo etc)
create table if not exists public.global_settings (
  key text primary key,
  value text
);
alter table public.global_settings enable row level security;
create policy "Public can view settings" on public.global_settings for select using (true);
create policy "Admins manage settings" on public.global_settings for all using (
  auth.jwt() ->> 'email' = 'timwillemse@hotmail.com'
);

-- 11. SPOEL GEWICHTEN & PRESETS
create table if not exists public.spool_weights (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  weight numeric not null
);
alter table public.spool_weights enable row level security;
create policy "Public view spool weights" on public.spool_weights for select using (true);
create policy "Admins manage spool weights" on public.spool_weights for all using (
  auth.jwt() ->> 'email' = 'timwillemse@hotmail.com'
);

create table if not exists public.brands (id uuid default gen_random_uuid() primary key, name text unique not null);
alter table public.brands enable row level security;
create policy "Public view brands" on public.brands for select using (true);
create policy "Admins manage brands" on public.brands for all using (auth.jwt() ->> 'email' = 'timwillemse@hotmail.com');

create table if not exists public.materials (id uuid default gen_random_uuid() primary key, name text unique not null);
alter table public.materials enable row level security;
create policy "Public view materials" on public.materials for select using (true);
create policy "Admins manage materials" on public.materials for all using (auth.jwt() ->> 'email' = 'timwillemse@hotmail.com');
```
