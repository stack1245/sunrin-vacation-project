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

create table if not exists public.stages (
  id integer primary key,
  slug text unique not null,
  title text not null,
  description text,
  stage_order integer unique not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  constraint stages_id_positive_check check (id > 0),
  constraint stages_slug_not_blank_check check (char_length(btrim(slug)) > 0),
  constraint stages_title_not_blank_check check (char_length(btrim(title)) > 0),
  constraint stages_order_positive_check check (stage_order > 0)
);

create table if not exists public.user_stage_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stage_id integer not null references public.stages (id) on delete cascade,
  status text not null,
  best_clear_time_ms bigint,
  started_at timestamptz,
  cleared_at timestamptz,
  last_played_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_stage_progress_user_stage_key unique (user_id, stage_id),
  constraint user_stage_progress_status_check
    check (status in ('locked', 'unlocked', 'in_progress', 'cleared')),
  constraint user_stage_progress_best_time_check
    check (best_clear_time_ms is null or best_clear_time_ms > 0)
);

create index if not exists user_stage_progress_user_id_idx
  on public.user_stage_progress (user_id);

create index if not exists user_stage_progress_stage_id_idx
  on public.user_stage_progress (stage_id);

insert into public.stages (
  id,
  slug,
  title,
  description,
  stage_order,
  is_published
)
values
  (
    1,
    'abandoned-lab',
    '버려진 실험실',
    '폐쇄된 연구동에 남겨진 기록을 따라 출구를 찾으세요.',
    1,
    true
  ),
  (
    2,
    'prison-break',
    '감옥 탈출',
    '잠긴 감방과 복도를 지나 자유로 향하는 길을 찾으세요.',
    2,
    true
  ),
  (
    3,
    'hundredth-floor',
    '100층 탈출',
    '끝을 알 수 없는 고층 건물의 비밀을 풀고 지상으로 돌아오세요.',
    3,
    true
  )
on conflict (id) do update
set
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  stage_order = excluded.stage_order,
  is_published = excluded.is_published;

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

revoke all on function private.set_updated_at() from public, anon, authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function private.set_updated_at();

drop trigger if exists user_stage_progress_set_updated_at
  on public.user_stage_progress;
create trigger user_stage_progress_set_updated_at
before update on public.user_stage_progress
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

create or replace function private.initialize_user(
  p_user_id uuid,
  p_email text,
  p_metadata jsonb,
  p_created_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nickname, created_at)
  values (
    p_user_id,
    private.profile_nickname(p_user_id, p_email, p_metadata),
    coalesce(p_created_at, now())
  )
  on conflict (id) do nothing;

  insert into public.user_stage_progress (user_id, stage_id, status)
  select
    p_user_id,
    stage.id,
    case
      when stage.stage_order = (
        select min(first_stage.stage_order)
        from public.stages as first_stage
        where first_stage.is_published = true
      )
        then 'unlocked'
      else 'locked'
    end
  from public.stages as stage
  where stage.is_published = true
  on conflict (user_id, stage_id) do nothing;
end;
$$;

revoke all on function private.initialize_user(uuid, text, jsonb, timestamptz)
  from public, anon, authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.initialize_user(
    new.id,
    new.email,
    new.raw_user_meta_data,
    new.created_at
  );

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user()
  from public, anon, authenticated;

drop trigger if exists out_of_bounds_initialize_user on auth.users;
create trigger out_of_bounds_initialize_user
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

create or replace function public.ensure_user_setup()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_metadata jsonb;
  v_created_at timestamptz;
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

  perform private.initialize_user(
    v_user_id,
    v_email,
    v_metadata,
    v_created_at
  );
end;
$$;

revoke all on function public.ensure_user_setup()
  from public, anon, authenticated;
grant execute on function public.ensure_user_setup()
  to authenticated;

create or replace function public.start_stage(p_stage_id integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_metadata jsonb;
  v_user_created_at timestamptz;
  v_current_status text;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if p_stage_id is null or p_stage_id <= 0 then
    raise exception 'A valid stage is required.'
      using errcode = '22023';
  end if;

  select
    auth_user.email,
    auth_user.raw_user_meta_data,
    auth_user.created_at
  into
    v_email,
    v_metadata,
    v_user_created_at
  from auth.users as auth_user
  where auth_user.id = v_user_id;

  if not found then
    raise exception 'Authenticated user was not found.'
      using errcode = '42501';
  end if;

  perform private.initialize_user(
    v_user_id,
    v_email,
    v_metadata,
    v_user_created_at
  );

  select progress.status
  into v_current_status
  from public.user_stage_progress as progress
  join public.stages as stage
    on stage.id = progress.stage_id
  where
    progress.user_id = v_user_id
    and progress.stage_id = p_stage_id
    and stage.is_published = true
  for update of progress;

  if not found then
    raise exception 'Stage progress was not found.'
      using errcode = 'P0002';
  end if;

  if v_current_status = 'locked' then
    raise exception 'The stage is locked.'
      using errcode = '42501';
  end if;

  update public.user_stage_progress
  set
    status = case
      when status = 'unlocked' then 'in_progress'
      else status
    end,
    started_at = coalesce(started_at, now()),
    last_played_at = now()
  where
    user_id = v_user_id
    and stage_id = p_stage_id;
end;
$$;

revoke all on function public.start_stage(integer)
  from public, anon, authenticated;
grant execute on function public.start_stage(integer)
  to authenticated;

create or replace function public.complete_stage(
  p_stage_id integer,
  p_clear_time_ms bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_metadata jsonb;
  v_user_created_at timestamptz;
  v_stage_order integer;
  v_current_status text;
  v_next_stage_id integer;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  if p_stage_id is null or p_clear_time_ms is null or p_clear_time_ms <= 0 then
    raise exception 'A valid stage and positive clear time are required.'
      using errcode = '22023';
  end if;

  select
    auth_user.email,
    auth_user.raw_user_meta_data,
    auth_user.created_at
  into
    v_email,
    v_metadata,
    v_user_created_at
  from auth.users as auth_user
  where auth_user.id = v_user_id;

  if not found then
    raise exception 'Authenticated user was not found.'
      using errcode = '42501';
  end if;

  perform private.initialize_user(
    v_user_id,
    v_email,
    v_metadata,
    v_user_created_at
  );

  select
    stage.stage_order,
    progress.status
  into
    v_stage_order,
    v_current_status
  from public.user_stage_progress as progress
  join public.stages as stage
    on stage.id = progress.stage_id
  where
    progress.user_id = v_user_id
    and progress.stage_id = p_stage_id
    and stage.is_published = true
  for update of progress;

  if not found then
    raise exception 'Stage progress was not found.'
      using errcode = 'P0002';
  end if;

  if v_current_status = 'locked' then
    raise exception 'The stage is locked.'
      using errcode = '42501';
  end if;

  if v_current_status = 'unlocked' then
    raise exception 'The stage must be started before it can be completed.'
      using errcode = '55000';
  end if;

  update public.user_stage_progress
  set
    status = 'cleared',
    best_clear_time_ms = case
      when best_clear_time_ms is null
        or p_clear_time_ms < best_clear_time_ms
        then p_clear_time_ms
      else best_clear_time_ms
    end,
    started_at = coalesce(started_at, now()),
    cleared_at = now(),
    last_played_at = now()
  where
    user_id = v_user_id
    and stage_id = p_stage_id;

  select next_stage.id
  into v_next_stage_id
  from public.stages as next_stage
  where
    next_stage.is_published = true
    and next_stage.stage_order > v_stage_order
  order by next_stage.stage_order
  limit 1;

  if v_next_stage_id is not null then
    update public.user_stage_progress
    set status = case
      when status = 'locked' then 'unlocked'
      else status
    end
    where
      user_id = v_user_id
      and stage_id = v_next_stage_id;
  end if;
end;
$$;

revoke all on function public.complete_stage(integer, bigint)
  from public, anon, authenticated;
grant execute on function public.complete_stage(integer, bigint)
  to authenticated;

do $$
declare
  existing_user record;
begin
  for existing_user in
    select
      auth_user.id,
      auth_user.email,
      auth_user.raw_user_meta_data,
      auth_user.created_at
    from auth.users as auth_user
  loop
    perform private.initialize_user(
      existing_user.id,
      existing_user.email,
      existing_user.raw_user_meta_data,
      existing_user.created_at
    );
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.stages enable row level security;
alter table public.user_stage_progress enable row level security;

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

drop policy if exists "Authenticated users can read published stages"
  on public.stages;
create policy "Authenticated users can read published stages"
on public.stages
for select
to authenticated
using (
  (select auth.uid()) is not null
  and is_published = true
);

drop policy if exists "Users can read their own stage progress"
  on public.user_stage_progress;
create policy "Users can read their own stage progress"
on public.user_stage_progress
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);

drop policy if exists "Users can insert their own initial stage progress"
  on public.user_stage_progress;
create policy "Users can insert their own initial stage progress"
on public.user_stage_progress
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and stage_id in (
    select published_stage.id
    from public.stages as published_stage
    where published_stage.is_published = true
  )
  and best_clear_time_ms is null
  and started_at is null
  and cleared_at is null
  and last_played_at is null
  and status = case
    when stage_id = (
      select first_stage.id
      from public.stages as first_stage
      where first_stage.is_published = true
      order by first_stage.stage_order
      limit 1
    )
      then 'unlocked'
    else 'locked'
  end
);

drop policy if exists "Users can update their own stage progress"
  on public.user_stage_progress;
create policy "Users can update their own stage progress"
on public.user_stage_progress
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);

revoke all privileges on table public.profiles from anon, authenticated;
revoke all privileges on table public.stages from anon, authenticated;
revoke all privileges on table public.user_stage_progress
  from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (nickname) on table public.profiles to authenticated;
grant select on table public.stages to authenticated;
grant select, insert on table public.user_stage_progress to authenticated;
