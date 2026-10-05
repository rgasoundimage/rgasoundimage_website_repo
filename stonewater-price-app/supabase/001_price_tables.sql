-- RGA price app, built on the shared catalogue tables (brands, categories,
-- products). Two groupings live side by side:
--   * products.category_id  -> product TYPE (Commercial Speakers, Professional
--                              Subwoofer...). Carries the barcode prefix.
--   * products.price_group_id -> the price-list grouping from the Excel sheets
--                              (Commercial -> In Ceiling Speakers, PRO AUDIO ->
--                              HD Series...). Used only by the price app.
--
-- Adds: price_groups, products.price_group_id, products.sort_order,
-- unique (brand_id, model_number), product_prices, the price_product_details /
-- price_catalog views, price_save_product(jsonb), and a parent-prefix fallback
-- in generate_upc(). Applied as a Supabase migration; safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- price_groups: the Excel sheet's heading + group, per brand.
-- heading '' = no heading (all Kasper groups).
-- ---------------------------------------------------------------------------
create table if not exists public.price_groups (
  id         bigint generated always as identity primary key,
  brand_id   uuid not null references public.brands (id) on delete cascade,
  heading    text not null default '',
  name       text not null check (btrim(name) <> ''),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, heading, name)
);

drop trigger if exists trg_price_groups_upd on public.price_groups;
create trigger trg_price_groups_upd before update on public.price_groups
  for each row execute function public.set_updated_at();

alter table public.price_groups enable row level security;

-- ---------------------------------------------------------------------------
-- products: price-list group, display order, one model per brand
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists price_group_id bigint references public.price_groups (id) on delete set null,
  add column if not exists sort_order integer not null default 0;

create index if not exists idx_products_price_group on public.products (price_group_id);
create unique index if not exists products_brand_model_key
  on public.products (brand_id, model_number);

-- ---------------------------------------------------------------------------
-- product_prices: one row per product per price list. Holds ONLY the numbers
-- that were typed into the Excel sheets; everything else is derived below.
--
--   list_id     brand slug         inputs used
--   praveen     stonewater-audio   list_price, dist_incl_tax
--   distdealer  stonewater-audio   dist_cost, list_price
--   kasper      kasper             mrp
-- ---------------------------------------------------------------------------
create table if not exists public.product_prices (
  id            bigint generated always as identity primary key,
  product_id    uuid not null references public.products (id) on delete cascade,
  list_id       text not null check (list_id in ('praveen', 'distdealer', 'kasper')),
  list_price    numeric(12, 2) check (list_price > 0),     -- pre-tax list price
  dist_cost     numeric(12, 2) check (dist_cost > 0),      -- pre-tax distributor price
  dist_incl_tax numeric(12, 2) check (dist_incl_tax > 0),  -- distributor price incl. 18% GST
  mrp           numeric(12, 2) check (mrp > 0),            -- MRP incl. tax
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (product_id, list_id)
);

drop trigger if exists trg_product_prices_upd on public.product_prices;
create trigger trg_product_prices_upd before update on public.product_prices
  for each row execute function public.set_updated_at();

-- A Kasper product can only have a Kasper price row, and vice versa.
create or replace function public.product_prices_check_brand()
returns trigger language plpgsql set search_path = '' as $$
declare b text;
begin
  select br.slug into b
  from public.products p join public.brands br on br.id = p.brand_id
  where p.id = new.product_id;
  if b is null or (new.list_id = 'kasper') <> (b = 'kasper') then
    raise exception 'Price list "%" does not belong to brand "%"', new.list_id, coalesce(b, '(none)');
  end if;
  return new;
end $$;

drop trigger if exists trg_product_prices_brand on public.product_prices;
create trigger trg_product_prices_brand before insert or update on public.product_prices
  for each row execute function public.product_prices_check_brand();

alter table public.product_prices enable row level security;

-- ---------------------------------------------------------------------------
-- price_product_details: a product flattened to what the price app shows.
-- category/subcategory are the price-list heading/group (not the type).
-- ---------------------------------------------------------------------------
create or replace view public.price_product_details with (security_invoker = true) as
select p.id, b.slug as brand,
       coalesce(g.heading, '') as category,
       coalesce(g.name, '') as subcategory,
       coalesce(p.model_number, p.name) as model,
       coalesce(p.short_description, '') as description,
       p.sort_order, p.status::text as status,
       p.category_id as type_id, p.updated_at
from public.products p
join public.brands b on b.id = p.brand_id
left join public.price_groups g on g.id = p.price_group_id;

-- ---------------------------------------------------------------------------
-- price_catalog: every price the app shows, keyed exactly as app.js expects.
-- Active products only. Formulas are copied cell-for-cell from the Excel
-- sheets (wef 01-04-2026). round(x, -1) on numeric rounds half away from
-- zero, same as Excel ROUND.
-- ---------------------------------------------------------------------------
create or replace view public.price_catalog with (security_invoker = true) as
with
praveen as (
  -- Sheet "Praveen Price List": E = list_price, H = dist_incl_tax
  select pr.product_id, pr.list_id, jsonb_strip_nulls(jsonb_build_object(
      'listPrice',    a.lp,
      'dealer',       round(a.lp * 0.7, 2),                       -- =E*0.7
      'subdealer',    round(a.lp * 0.8, -1),                      -- =ROUND(E*0.8,-1)
      'distInclTax',  a.h,
      'msrp',         a.m,                                        -- =ROUND(E*1.18,-1)
      'msrp35',       round(a.m * 0.65, -1),
      'msrp30',       round(a.m * 0.7, -1),
      'msrp20',       b.m20,
      'msrp15',       round(a.m * 0.85, -1),
      'dealerMargin', round((b.m20 - a.h) / nullif(b.m20, 0), 2), -- =(L-H)/L
      'msrpMargin',   round((a.m - a.h) / nullif(a.m, 0), 2)      -- =(I-H)/I
    )) as prices
  from public.product_prices pr
  cross join lateral (select pr.list_price as lp, pr.dist_incl_tax as h,
                             round(pr.list_price * 1.18, -1) as m) a
  cross join lateral (select round(a.m * 0.8, -1) as m20) b
  where pr.list_id = 'praveen'
),
distdealer as (
  -- Sheet "Stonewater_Dist_Dealer_price": D = dist_cost, E = list_price
  select pr.product_id, pr.list_id, jsonb_strip_nulls(jsonb_build_object(
      'distCost',            a.dc,
      'listPrice',           a.lp,
      'dealer',              round(a.dl, 2),                            -- =E-(E*0.3)
      'subdealer',           a.sd,                                      -- =ROUND(E*0.8,-1)
      'distInclTax',         round(a.dc * 1.18, 2),                     -- =D*1.18
      'msrp',                a.m,                                       -- =ROUND(E+(E*0.18),-1)
      'msrp30',              round(a.m * 0.7, -1),
      'msrp20',              round(a.m * 0.8, -1),
      'dealerDistMargin',    round((a.dl - a.dc) / nullif(a.dl, 0), 2), -- =(F-D)/F
      'subdealerDistMargin', round((a.sd - a.dc) / nullif(a.sd, 0), 2)  -- =(G-D)/G
    )) as prices
  from public.product_prices pr
  cross join lateral (select pr.dist_cost as dc, pr.list_price as lp,
                             pr.list_price - pr.list_price * 0.3 as dl,
                             round(pr.list_price * 0.8, -1) as sd,
                             round(pr.list_price + pr.list_price * 0.18, -1) as m) a
  where pr.list_id = 'distdealer'
),
kasper as (
  -- Sheet "Products": G = mrp
  select pr.product_id, pr.list_id, jsonb_strip_nulls(jsonb_build_object(
      'distRga',      a.dr,                                    -- =ROUND(G*0.55/1.18,0)
      'distInclTax',  round(a.g * 0.55, 0),
      'dealer',       a.e,                                     -- =ROUND(F*0.8,0)
      'listPlusTax',  a.f,                                     -- =ROUND(G/1.18,0)
      'mrp',          a.g,
      'dealerMargin', round((a.f - a.e) / nullif(a.e, 0), 2),  -- =(F-E)/E
      'distMargin',   round((a.f - a.dr) / nullif(a.dr, 0), 2) -- =(F-D)/D
    )) as prices
  from public.product_prices pr
  cross join lateral (select pr.mrp as g,
                             round(pr.mrp * 0.55 / 1.18, 0) as dr,
                             round(pr.mrp / 1.18, 0) as f,
                             round(round(pr.mrp / 1.18, 0) * 0.8, 0) as e) a
  where pr.list_id = 'kasper'
),
calc as (
  select * from praveen
  union all select * from distdealer
  union all select * from kasper
)
select d.id as product_id, d.brand, d.category, d.subcategory, d.model,
       d.description, d.sort_order, c.list_id, c.prices
from calc c
join public.price_product_details d on d.id = c.product_id
where d.status = 'active' and c.prices <> '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- Helpers for price_save_product
-- ---------------------------------------------------------------------------
create or replace function public.price_slugify(t text)
returns text language sql immutable set search_path = '' as $$
  select trim(both '-' from regexp_replace(lower(t), '[^a-z0-9]+', '-', 'g'))
$$;

-- Find a brand's price group by heading + name (case-insensitive), or create
-- it at the end of the brand's groups.
create or replace function public.price_group(p_brand uuid, p_heading text, p_name text)
returns bigint language plpgsql set search_path = '' as $$
declare v_id bigint;
begin
  select id into v_id from public.price_groups
  where brand_id = p_brand and lower(heading) = lower(p_heading) and lower(name) = lower(p_name)
  limit 1;
  if v_id is null then
    insert into public.price_groups (brand_id, heading, name, sort_order)
    values (p_brand, p_heading, p_name,
            (select coalesce(max(sort_order), 0) + 10 from public.price_groups where brand_id = p_brand))
    returning id into v_id;
  end if;
  return v_id;
end $$;

-- ---------------------------------------------------------------------------
-- price_save_product: create or update one product and its price rows in a
-- single transaction. Used by the admin screen and by the import.
--
-- p = { id?, brand (slug), model, description?, status?, sort_order?,
--       type_id? (categories.id; required for a new product),
--       category? (price-list heading), subcategory? (price-list group),
--       prices: { <list_id>: { list_price?, dist_cost?, dist_incl_tax?, mrp? } | null } }
-- A null list removes the product from that price list. On update, an
-- omitted type_id keeps the product's current type.
-- ---------------------------------------------------------------------------
create or replace function public.price_save_product(p jsonb)
returns uuid language plpgsql set search_path = '' as $$
declare
  v_brand_id uuid; v_brand_slug text;
  v_heading text := coalesce(btrim(p->>'category'), '');
  v_group text := nullif(btrim(p->>'subcategory'), '');
  v_model text := nullif(btrim(p->>'model'), '');
  v_type uuid := nullif(p->>'type_id', '')::uuid;
  v_status public.product_status := coalesce(nullif(p->>'status', ''), 'active')::public.product_status;
  v_group_id bigint; v_id uuid;
  v_sort int; v_base text; v_slug text; n int := 1;
  l record;
begin
  select id, slug into v_brand_id, v_brand_slug from public.brands where slug = p->>'brand';
  if v_brand_id is null then raise exception 'Unknown brand "%"', p->>'brand'; end if;
  if v_model is null then raise exception 'Model number is required'; end if;
  if v_group is null then raise exception 'Price-list group is required'; end if;
  if v_type is null and p->>'id' is null then raise exception 'Product type is required'; end if;
  if v_type is not null and not exists (select 1 from public.categories where id = v_type) then
    raise exception 'Unknown product type';
  end if;

  v_group_id := public.price_group(v_brand_id, v_heading, v_group);

  v_sort := nullif(p->>'sort_order', '')::int;
  if v_sort is null and p->>'id' is null then
    -- new product: end of its group, else end of the brand
    select max(sort_order) + 1 into v_sort from public.products where price_group_id = v_group_id;
    if v_sort is null then
      select coalesce(max(sort_order), 0) + 10 into v_sort from public.products where brand_id = v_brand_id;
    end if;
  end if;

  if p->>'id' is null then
    v_base := public.price_slugify(v_brand_slug || '-' || v_model);
    v_slug := v_base;
    while exists (select 1 from public.products where slug = v_slug) loop
      n := n + 1; v_slug := v_base || '-' || n;
    end loop;
    insert into public.products (name, slug, brand_id, category_id, price_group_id, model_number,
                                 short_description, status, sort_order)
    values (v_model, v_slug, v_brand_id, v_type, v_group_id, v_model,
            nullif(btrim(p->>'description'), ''), v_status, v_sort)
    returning id into v_id;
  else
    update public.products set
      name = v_model, model_number = v_model,
      category_id = coalesce(v_type, category_id),
      price_group_id = v_group_id,
      short_description = nullif(btrim(p->>'description'), ''),
      status = v_status,
      sort_order = coalesce(v_sort, sort_order)
    where id = (p->>'id')::uuid and brand_id = v_brand_id
    returning id into v_id;
    if v_id is null then raise exception 'Product not found'; end if;
  end if;

  for l in select key, value from jsonb_each(coalesce(p->'prices', '{}'::jsonb)) loop
    if jsonb_typeof(l.value) = 'null' then
      delete from public.product_prices where product_id = v_id and list_id = l.key;
    else
      insert into public.product_prices (product_id, list_id, list_price, dist_cost, dist_incl_tax, mrp)
      values (v_id, l.key,
              (l.value->>'list_price')::numeric, (l.value->>'dist_cost')::numeric,
              (l.value->>'dist_incl_tax')::numeric, (l.value->>'mrp')::numeric)
      on conflict (product_id, list_id) do update set
        list_price = excluded.list_price, dist_cost = excluded.dist_cost,
        dist_incl_tax = excluded.dist_incl_tax, mrp = excluded.mrp;
    end if;
  end loop;

  return v_id;
end $$;

-- ---------------------------------------------------------------------------
-- generate_upc: unchanged, except that a product in a sub-category (e.g.
-- Commercial Speakers -> In-Ceiling Speakers) now falls back to its parent's
-- barcode prefix. Previously those products had no prefix at all.
-- ---------------------------------------------------------------------------
create or replace function public.generate_upc(p_product_id uuid)
returns text language plpgsql as $function$
declare
  v_prefix char(1);
  v_base text;
  sum_odd int := 0;
  sum_even int := 0;
  i int;
  digit int;
  total int;
  check_digit int;
begin
  -- 1. Get prefix from category, else from its parent category
  select coalesce(own.prefix, par.prefix) into v_prefix
  from public.products p
  join public.categories c on c.id = p.category_id
  left join public.category_barcode_prefix own on own.category_id = c.id
  left join public.category_barcode_prefix par on par.category_id = c.parent_id
  where p.id = p_product_id;

  if v_prefix is null then
    raise exception 'No barcode prefix found for product %', p_product_id;
  end if;

  -- 2. Build first 11 digits (1 prefix + 10 sequence digits)
  v_base := v_prefix || lpad(nextval('public.upc_sequence')::text, 10, '0');

  -- 3. Calculate check digit
  for i in 1..11 loop
    digit := cast(substring(v_base, i, 1) as int);

    if (i % 2) = 1 then
      sum_odd := sum_odd + digit;
    else
      sum_even := sum_even + digit;
    end if;
  end loop;

  total := (sum_odd * 3) + sum_even;
  check_digit := (10 - (total % 10)) % 10;

  return v_base || check_digit;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Access: only the server (service-role key, used by the Netlify functions).
-- RLS is on with no policies; views run as the caller; the new functions are
-- not callable by anon/authenticated.
-- ---------------------------------------------------------------------------
revoke all on public.price_product_details, public.price_catalog from anon, authenticated;
revoke execute on function public.price_save_product(jsonb), public.price_group(uuid, text, text),
  public.price_slugify(text), public.product_prices_check_brand() from public, anon, authenticated;
grant execute on function public.price_save_product(jsonb), public.price_group(uuid, text, text),
  public.price_slugify(text) to service_role;

commit;
