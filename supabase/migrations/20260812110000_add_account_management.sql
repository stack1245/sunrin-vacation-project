-- 계정 정보는 보존하고 로그인한 사용자의 게임 데이터만 초기화할 수 있게 한다.
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_nickname_length_check
    check (char_length(nickname) between 2 and 24),
  constraint profiles_nickname_trimmed_check
    check (nickname = btrim(nickname))
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at()
  from public, anon, authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function private.set_updated_at();

create or replace function private.profile_nickname(
  p_user_id uuid,
  p_email text,
  p_metadata jsonb
)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_nickname text;
begin
  v_nickname := coalesce(
    nullif(btrim(p_metadata ->> 'nickname'), ''),
    nullif(btrim(p_metadata ->> 'display_name'), ''),
    nullif(btrim(p_metadata ->> 'username'), ''),
    nullif(btrim(split_part(coalesce(p_email, ''), '@', 1)), '')
  );

  v_nickname := left(coalesce(v_nickname, ''), 24);

  if char_length(v_nickname) < 2 then
    v_nickname := 'user_' || left(replace(p_user_id::text, '-', ''), 8);
  end if;

  return v_nickname;
end;
$$;

revoke all on function private.profile_nickname(uuid, text, jsonb)
  from public, anon, authenticated;

create or replace function public.ensure_my_profile()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_metadata jsonb;
  v_created_at timestamptz;
  v_nickname text;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  select
    auth_user.email,
    auth_user.raw_user_meta_data,
    auth_user.created_at
  into
    v_email,
    v_metadata,
    v_created_at
  from auth.users as auth_user
  where auth_user.id = v_user_id;

  if not found then
    raise exception 'Authenticated user was not found.'
      using errcode = '42501';
  end if;

  insert into public.profiles (id, nickname, created_at)
  values (
    v_user_id,
    private.profile_nickname(v_user_id, v_email, v_metadata),
    coalesce(v_created_at, now())
  )
  on conflict (id) do nothing;

  select profile.nickname
  into v_nickname
  from public.profiles as profile
  where profile.id = v_user_id;

  return v_nickname;
end;
$$;

revoke all on function public.ensure_my_profile()
  from public, anon, authenticated;
grant execute on function public.ensure_my_profile()
  to authenticated;

create or replace function public.reset_my_game_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  perform public.ensure_my_profile();

  if to_regclass('public.user_stage_saves') is not null then
    execute 'delete from public.user_stage_saves where user_id = $1'
      using v_user_id;
  end if;

  if to_regclass('public.user_stage_progress') is not null then
    execute 'delete from public.user_stage_progress where user_id = $1'
      using v_user_id;
  end if;

  if to_regprocedure('public.ensure_user_setup()') is not null then
    execute 'select public.ensure_user_setup()';
  end if;
end;
$$;

revoke all on function public.reset_my_game_data()
  from public, anon, authenticated;
grant execute on function public.reset_my_game_data()
  to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);

revoke all privileges on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (nickname) on table public.profiles to authenticated;
