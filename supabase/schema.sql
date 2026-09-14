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
