-- Database setup for accounts and sync (see SYNC-SETUP.md).
-- Paste all of this into Supabase → SQL Editor → New query, and click Run. Running it again is harmless.

-- Each person's progress is one row: data (saved item → value) and stamps (saved item → when it last changed,
-- in milliseconds). The site merges by these stamps: for every item, the most recent change wins.
create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  stamps     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Who may use the table at all: only signed-in people ("authenticated"), never anonymous visitors.
-- (Needed when "Automatically expose new tables" is off, which is the safer setting; harmless when it's on.)
revoke all on public.progress from anon;
grant select, insert, update, delete on public.progress to authenticated;

-- Row-level security: everyone can reach only their own row, never anyone else's.
alter table public.progress enable row level security;

drop policy if exists "read own progress" on public.progress;
create policy "read own progress" on public.progress
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "add own progress" on public.progress;
create policy "add own progress" on public.progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "change own progress" on public.progress;
create policy "change own progress" on public.progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "delete own progress" on public.progress;
create policy "delete own progress" on public.progress
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Merge changes from one device into your row, in one step, so two devices saving at the same moment
-- can't undo each other. For each item sent, it's only taken if it's newer than what's stored.
-- Runs as the signed-in person ("security invoker"), so the rules above still apply.
create or replace function public.merge_progress(new_data jsonb, new_stamps jsonb)
returns public.progress
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_row public.progress;
  item text;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  insert into public.progress (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  select * into current_row from public.progress where user_id = auth.uid() for update;

  for item in select jsonb_object_keys(new_stamps) loop
    if coalesce((current_row.stamps ->> item)::bigint, 0) < (new_stamps ->> item)::bigint then
      current_row.data   := current_row.data   || jsonb_build_object(item, new_data -> item);
      current_row.stamps := current_row.stamps || jsonb_build_object(item, new_stamps -> item);
    end if;
  end loop;

  update public.progress
     set data = current_row.data, stamps = current_row.stamps, updated_at = now()
   where user_id = auth.uid()
  returning * into current_row;
  return current_row;
end;
$$;

revoke all on function public.merge_progress(jsonb, jsonb) from public, anon;
grant execute on function public.merge_progress(jsonb, jsonb) to authenticated;

-- "Delete my account": removes the person's login, and with it (on delete cascade) all their progress.
-- It needs to reach the auth.users table, so it runs with the function owner's rights ("security definer"),
-- but it can only ever delete the account of the person calling it.
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Send changes to the person's other open devices straight away (Supabase Realtime).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'progress'
  ) then
    alter publication supabase_realtime add table public.progress;
  end if;
end;
$$;
