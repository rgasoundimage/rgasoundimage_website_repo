-- Stonewater MSRP becomes the price you type in (2026-10-07).
--
-- Before: List price was typed and MSRP = ROUND(List × 1.18, -1).
-- After:  MSRP is typed. When a product's MSRP is saved with a new value, its
--         List price is recalculated as MSRP ÷ 1.18 rounded UP to the next ₹10
--         (e.g. 4,600 ÷ 1.18 = 3,898.3 → 3,900). Dealer, Sub-dealer etc. keep
--         following List price, exactly as before.
--
-- Existing prices do not change: every row's current MSRP is stored as-is and
-- its List price is kept until that product's MSRP is edited.
-- Applies to both Stonewater lists (praveen, distdealer). Kasper is unchanged.
-- Run after 001 and 002. Safe to re-run.

begin;

alter table public.product_prices
  add column if not exists msrp numeric(12, 2) check (msrp > 0);   -- typed MSRP (Stonewater lists)

-- Freeze today's MSRP for every Stonewater row (same formula the view used).
update public.product_prices
set msrp = round(list_price * 1.18, -1)
where list_id in ('praveen', 'distdealer') and msrp is null and list_price is not null;

-- List price from MSRP: ÷ 1.18, rounded up to the next ₹10.
create or replace function public.price_list_from_msrp(p_msrp numeric)
returns numeric language sql immutable set search_path = '' as $$
  select ceil(p_msrp / 1.18 / 10) * 10
$$;

-- price_catalog: MSRP is the stored one when present, else calculated as before.
create or replace view public.price_catalog with (security_invoker = true) as
with
praveen as (
  -- Sheet "Praveen Price List": E = list_price, H = dist_incl_tax, I = msrp
  select pr.product_id, pr.list_id, jsonb_strip_nulls(jsonb_build_object(
      'listPrice',    a.lp,
      'dealer',       round(a.lp * 0.7, 2),                       -- =E*0.7
      'subdealer',    round(a.lp * 0.8, -1),                      -- =ROUND(E*0.8,-1)
      'distInclTax',  a.h,
      'msrp',         a.m,
      'msrp35',       round(a.m * 0.65, -1),
      'msrp30',       round(a.m * 0.7, -1),
      'msrp20',       b.m20,
      'msrp15',       round(a.m * 0.85, -1),
      'dealerMargin', round((b.m20 - a.h) / nullif(b.m20, 0), 2), -- =(L-H)/L
      'msrpMargin',   round((a.m - a.h) / nullif(a.m, 0), 2)      -- =(I-H)/I
    )) as prices
  from public.product_prices pr
  cross join lateral (select pr.list_price as lp, pr.dist_incl_tax as h,
                             coalesce(pr.msrp, round(pr.list_price * 1.18, -1)) as m) a
  cross join lateral (select round(a.m * 0.8, -1) as m20) b
  where pr.list_id = 'praveen'
),
distdealer as (
  -- Sheet "Stonewater_Dist_Dealer_price": D = dist_cost, E = list_price, I = msrp
  select pr.product_id, pr.list_id, jsonb_strip_nulls(jsonb_build_object(
      'distCost',            a.dc,
      'listPrice',           a.lp,
      'dealer',              round(a.dl, 2),                            -- =E-(E*0.3)
      'subdealer',           a.sd,                                      -- =ROUND(E*0.8,-1)
      'distInclTax',         round(a.dc * 1.18, 2),                     -- =D*1.18
      'msrp',                a.m,
      'msrp30',              round(a.m * 0.7, -1),
      'msrp20',              round(a.m * 0.8, -1),
      'dealerDistMargin',    round((a.dl - a.dc) / nullif(a.dl, 0), 2), -- =(F-D)/F
      'subdealerDistMargin', round((a.sd - a.dc) / nullif(a.sd, 0), 2)  -- =(G-D)/G
    )) as prices
  from public.product_prices pr
  cross join lateral (select pr.dist_cost as dc, pr.list_price as lp,
                             pr.list_price - pr.list_price * 0.3 as dl,
                             round(pr.list_price * 0.8, -1) as sd,
                             coalesce(pr.msrp, round(pr.list_price + pr.list_price * 0.18, -1)) as m) a
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

-- price_save_product: as in 001, plus MSRP handling for the Stonewater lists.
-- A price list's object may now carry "msrp". When it does and it differs from
-- the stored MSRP (or the row is new), list_price is recalculated from it and
-- any list_price sent is ignored. When the MSRP is unchanged, the stored
-- list_price is kept, so editing only the distributor price changes nothing
-- else. Without "msrp" (e.g. the 002 import), list_price is used as sent and
-- the MSRP falls back to the calculated one.
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
  v_msrp numeric; v_list numeric; o_msrp numeric; o_list numeric; o_found boolean;
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
      v_msrp := (l.value->>'msrp')::numeric;
      v_list := (l.value->>'list_price')::numeric;
      if v_msrp is not null then
        select true, msrp, list_price into o_found, o_msrp, o_list
        from public.product_prices where product_id = v_id and list_id = l.key;
        v_list := case when o_found and o_msrp = v_msrp and o_list is not null
                       then o_list                                  -- MSRP unchanged: keep List price
                       else public.price_list_from_msrp(v_msrp) end;
        o_found := null;
      end if;
      insert into public.product_prices (product_id, list_id, list_price, dist_cost, dist_incl_tax, mrp, msrp)
      values (v_id, l.key, v_list, (l.value->>'dist_cost')::numeric,
              (l.value->>'dist_incl_tax')::numeric, (l.value->>'mrp')::numeric, v_msrp)
      on conflict (product_id, list_id) do update set
        list_price = excluded.list_price, dist_cost = excluded.dist_cost,
        dist_incl_tax = excluded.dist_incl_tax, mrp = excluded.mrp, msrp = excluded.msrp;
    end if;
  end loop;

  return v_id;
end $$;

revoke execute on function public.price_list_from_msrp(numeric) from public, anon, authenticated;
grant execute on function public.price_list_from_msrp(numeric) to service_role;

commit;
