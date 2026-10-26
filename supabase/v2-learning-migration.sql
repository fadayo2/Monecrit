-- MonÉcrit V2 — apprentissage et progression
-- Ces ALTER TABLE peuvent être exécutés sur une base V1 existante.
alter table public.documents add column if not exists level text not null default 'A1';
alter table public.documents add column if not exists prompt text not null default '';
alter table public.documents add column if not exists target_words integer not null default 70;
alter table public.documents add column if not exists writing_mode text not null default 'free';
alter table public.documents add column if not exists score jsonb;
alter table public.documents add column if not exists last_analyzed_at timestamptz;
alter table public.documents add column if not exists exam_duration_minutes integer;
alter table public.documents add column if not exists exam_started_at timestamptz;

create table if not exists public.writing_mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  category text not null default 'Autre',
  original text not null default '',
  correction text not null default '',
  explanation text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.writing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  level text not null default 'A1',
  words_written integer not null default 0,
  overall_score integer,
  created_at timestamptz not null default now()
);

create index if not exists writing_mistakes_user_idx on public.writing_mistakes(user_id, created_at desc);
create index if not exists writing_sessions_user_idx on public.writing_sessions(user_id, created_at desc);

alter table public.writing_mistakes enable row level security;
alter table public.writing_sessions enable row level security;

revoke all on table public.writing_mistakes from anon, authenticated;
revoke all on table public.writing_sessions from anon, authenticated;
grant select, insert, delete on table public.writing_mistakes to authenticated;
grant select, insert, delete on table public.writing_sessions to authenticated;

drop policy if exists "writing_mistakes_select_own" on public.writing_mistakes;
drop policy if exists "writing_mistakes_insert_own" on public.writing_mistakes;
drop policy if exists "writing_mistakes_delete_own" on public.writing_mistakes;
drop policy if exists "writing_sessions_select_own" on public.writing_sessions;
drop policy if exists "writing_sessions_insert_own" on public.writing_sessions;
drop policy if exists "writing_sessions_delete_own" on public.writing_sessions;

create policy "writing_mistakes_select_own" on public.writing_mistakes for select to authenticated using ((select auth.uid()) = user_id);
create policy "writing_mistakes_insert_own" on public.writing_mistakes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "writing_mistakes_delete_own" on public.writing_mistakes for delete to authenticated using ((select auth.uid()) = user_id);
create policy "writing_sessions_select_own" on public.writing_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "writing_sessions_insert_own" on public.writing_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "writing_sessions_delete_own" on public.writing_sessions for delete to authenticated using ((select auth.uid()) = user_id);
