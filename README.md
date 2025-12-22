# Filament Manager

Beheer je 3D-printer filamentvoorraad eenvoudig en modern.

## 🚀 Koppelen met Supabase (Stappenplan)

1.  Maak een nieuw project aan op [Supabase.com](https://supabase.com).
2.  Ga naar **Project Settings** (tandwiel icoon linksonder).
3.  Klik in het menu op **API**.
4.  Onder het kopje **Project API Settings** vind je:
    *   **Project URL**: Kopieer dit voor `VITE_SUPABASE_URL` (begint met https://...)
    *   **Project API keys**: Kopieer de key met de naam `anon public` voor `VITE_SUPABASE_ANON_KEY`.
5.  Voeg deze waarden toe in je Vercel Dashboard (Settings > Environment Variables).
6.  Ga in Supabase naar de **SQL Editor** en voer het onderstaande script uit.

## 🛠️ Master Database Script (SQL)

Kopieer en voer dit script uit in de Supabase SQL Editor om alle tabellen en rechten in één keer goed te zetten.

```sql
-- 1. PROFIELEN (Voor PRO status)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_pro boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
drop policy if exists "Users view own profile" on public.profiles;
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Admins manage all profiles" on public.profiles;
create policy "Admins manage all profiles" on public.profiles for all using (true); -- Admin check gebeurt in de app of via email list

-- TRIGGER: Maak automatisch profiel aan bij signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, is_pro)
  values (new.id, new.email, false);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
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
drop policy if exists "Users manage own locations" on public.locations;
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
drop policy if exists "Users manage own suppliers" on public.suppliers;
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
drop policy if exists "Users manage own filaments" on public.filaments;
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
drop policy if exists "Users manage own materials" on public.other_materials;
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
drop policy if exists "Users manage own printers" on public.printers;
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
drop policy if exists "Users manage own prints" on public.print_jobs;
create policy "Users manage own prints" on public.print_jobs for all using (auth.uid() = user_id);

-- 8. FEEDBACK & BEHEER
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
drop policy if exists "Everyone can send feedback" on public.feedback;
create policy "Everyone can send feedback" on public.feedback for insert with check (true);
drop policy if exists "Admins can view feedback" on public.feedback;
create policy "Admins can view feedback" on public.feedback for select using (true);

create table if not exists public.deletion_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  reason text,
  created_at timestamptz default now()
);
alter table public.deletion_requests enable row level security;
drop policy if exists "Users can request deletion" on public.deletion_requests;
create policy "Users can request deletion" on public.deletion_requests for insert with check (auth.uid() = user_id);
drop policy if exists "Users view own request" on public.deletion_requests;
create policy "Users view own request" on public.deletion_requests for select using (auth.uid() = user_id);
drop policy if exists "Users cancel own request" on public.deletion_requests;
create policy "Users cancel own request" on public.deletion_requests for delete using (auth.uid() = user_id);

-- 9. SPOEL DATABASE & LOGO
create table if not exists public.spool_weights (id bigint generated by default as identity primary key, name text, weight numeric);
create table if not exists public.brands (id bigint generated by default as identity primary key, name text unique);
create table if not exists public.materials (id bigint generated by default as identity primary key, name text unique);
create table if not exists public.global_settings (key text primary key, value text);

alter table public.spool_weights enable row level security;
alter table public.brands enable row level security;
alter table public.materials enable row level security;
alter table public.global_settings enable row level security;

drop policy if exists "Public read access" on public.spool_weights;
create policy "Public read access" on public.spool_weights for select using (true);
drop policy if exists "Public read access brands" on public.brands;
create policy "Public read access brands" on public.brands for select using (true);
drop policy if exists "Public read access materials" on public.materials;
create policy "Public read access materials" on public.materials for select using (true);
drop policy if exists "Public read access global" on public.global_settings;
create policy "Public read access global" on public.global_settings for select using (true);
```