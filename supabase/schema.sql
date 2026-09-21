-- Run this once in Supabase Dashboard -> SQL Editor.
create table if not exists public.space_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  version bigint not null default 1 check (version >= 1),
  updated_at timestamptz not null default now()
);

alter table public.space_snapshots enable row level security;
alter table public.space_snapshots replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'space_snapshots'
  ) then
    alter publication supabase_realtime add table public.space_snapshots;
  end if;
end $$;

drop policy if exists "Users read their Space snapshot" on public.space_snapshots;
create policy "Users read their Space snapshot"
  on public.space_snapshots for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users create their Space snapshot" on public.space_snapshots;
create policy "Users create their Space snapshot"
  on public.space_snapshots for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their Space snapshot" on public.space_snapshots;
create policy "Users update their Space snapshot"
  on public.space_snapshots for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
