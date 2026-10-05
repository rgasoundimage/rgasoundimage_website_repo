-- Test-only copy of the catalogue tables that already exist in the Supabase
-- project (as of 2026-10-05), so supabase/001_price_tables.sql and
-- 002_seed.sql can be rehearsed against the same structure in PGlite.
-- Not applied to Supabase.
create role anon; create role authenticated; create role service_role;

create type public.product_status as enum ('draft', 'active', 'discontinued', 'archived');
create type public.variant_status as enum ('active', 'discontinued');
create type public.identifier_type as enum ('EAN13', 'EAN8', 'UPCA', 'UPCE', 'GTIN14', 'INTERNAL');

create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique,
  website text, logo_url text,
  is_authorized boolean default false, is_active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz not null default now()
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name varchar not null, slug varchar not null unique,
  parent_id uuid references public.categories (id) on delete set null,
  description text, is_active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz not null default now()
);
create table public.category_barcode_prefix (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null unique references public.categories (id) on delete cascade,
  prefix char(1) not null unique,
  created_at timestamptz default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name varchar not null, slug varchar not null unique,
  brand_id uuid references public.brands (id) on delete restrict,
  category_id uuid not null references public.categories (id) on delete restrict,
  model_number varchar, short_description text, long_description text, primary_image_url text,
  status public.product_status not null default 'active',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  sku_code varchar not null unique, variant_name varchar,
  status public.variant_status not null default 'active',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.variant_identifiers (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.variants (id) on delete cascade,
  id_type public.identifier_type not null, value varchar not null,
  symbology varchar, is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id_type, value)
);
create trigger trg_brands_upd before update on public.brands for each row execute function public.set_updated_at();
create trigger trg_categories_upd before update on public.categories for each row execute function public.set_updated_at();
create trigger trg_products_upd before update on public.products for each row execute function public.set_updated_at();
create trigger trg_variants_upd before update on public.variants for each row execute function public.set_updated_at();

-- NOTE: upc_sequence does NOT exist in the live project (generate_upc() fails
-- there for that reason). It is created here only so the prefix logic can be
-- tested.
create sequence public.upc_sequence;

create function public.is_valid_upc(upc text) returns boolean language plpgsql as $$
declare sum_odd int := 0; sum_even int := 0; i int; digit int; total int;
begin
  if upc !~ '^[0-9]{12}$' then return false; end if;
  for i in 1..11 loop
    digit := cast(substring(upc, i, 1) as int);
    if (i % 2) = 1 then sum_odd := sum_odd + digit; else sum_even := sum_even + digit; end if;
  end loop;
  total := (sum_odd * 3) + sum_even;
  return (10 - (total % 10)) % 10 = cast(substring(upc, 12, 1) as int);
end $$;

-- The live generate_upc() as it was before 001 (exact category match only).
create function public.generate_upc(p_product_id uuid) returns text language plpgsql as $$
declare v_prefix char(1); v_base text; sum_odd int := 0; sum_even int := 0;
        i int; digit int; total int; check_digit int;
begin
  select cbp.prefix into v_prefix from public.products p
  join public.category_barcode_prefix cbp on p.category_id = cbp.category_id
  where p.id = p_product_id;
  if v_prefix is null then raise exception 'No barcode prefix found for product %', p_product_id; end if;
  v_base := v_prefix || lpad(nextval('public.upc_sequence')::text, 10, '0');
  for i in 1..11 loop
    digit := cast(substring(v_base, i, 1) as int);
    if (i % 2) = 1 then sum_odd := sum_odd + digit; else sum_even := sum_even + digit; end if;
  end loop;
  total := (sum_odd * 3) + sum_even;
  check_digit := (10 - (total % 10)) % 10;
  return v_base || check_digit;
end $$;
