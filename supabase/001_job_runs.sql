-- Applied to RGA_backend (uyzlunpeydclrzqksxle) on 2026-10-06 as migration
-- create_job_runs_with_weekly_purge. Kept here for reference.

-- One row per scheduled-job run (currently the daily keep-alive check).
create table public.job_runs (
  id          bigint generated always as identity primary key,
  job_name    text        not null,
  ran_at      timestamptz not null default now(),
  status      text        not null check (status in ('success', 'failure')),
  http_status integer,
  error       text
);

create index job_runs_ran_at_idx on public.job_runs (ran_at);

-- Server-only: written by the Netlify function with the service role key.
alter table public.job_runs enable row level security;
revoke all on public.job_runs from anon, authenticated;

-- Readable view in IST, matching the Date / Time / Result layout.
create view public.job_runs_ist with (security_invoker = true) as
select
  job_name                                                  as "Job",
  to_char(ran_at at time zone 'Asia/Kolkata', 'DD Mon YYYY') as "Date",
  to_char(ran_at at time zone 'Asia/Kolkata', 'HH12:MI AM') as "Time (IST)",
  case when status = 'success'
       then 'Success (HTTP ' || coalesce(http_status::text, '?') || ')'
       else 'Failure (HTTP ' || coalesce(http_status::text, '?') || ')'
            || coalesce(': ' || error, '')
  end                                                       as "Result",
  ran_at
from public.job_runs
order by ran_at desc;

revoke all on public.job_runs_ist from anon, authenticated;

-- Weekly purge: every Sunday 00:00 UTC (5:30 AM IST, before the 7:00 AM run),
-- drop rows older than 7 days.
create extension if not exists pg_cron;

select cron.schedule(
  'purge-job-runs-weekly',
  '0 0 * * 0',
  $$delete from public.job_runs where ran_at < now() - interval '7 days'$$
);
