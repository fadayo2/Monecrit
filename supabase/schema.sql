-- MonÉcrit V1 — Supabase schema + RLS
-- À exécuter dans Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Sans titre',
  content text not null default '',
  word_count integer not null default 0 check (word_count >= 0),
  character_count integer not null default 0 check (character_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists documents_user_id_idx on public.documents(user_id);
create index if not exists documents_user_updated_idx on public.documents(user_id, updated_at desc);
create index if not exists documents_user_deleted_idx on public.documents(user_id, deleted_at);

alter table public.profiles enable row level security;
alter table public.documents enable row level security;

-- Accès minimal côté client.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.documents from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.documents to authenticated;

-- Supprime les policies si le script est ré-exécuté.
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "documents_select_own" on public.documents;
drop policy if exists "documents_insert_own" on public.documents;
drop policy if exists "documents_update_own" on public.documents;
drop policy if exists "documents_delete_own" on public.documents;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "documents_select_own"
on public.documents for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "documents_insert_own"
on public.documents for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "documents_update_own"
on public.documents for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "documents_delete_own"
on public.documents for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Crée automatiquement le profil à l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute procedure public.handle_new_user();

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
