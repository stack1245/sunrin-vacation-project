create or replace function private.is_valid_stage_one_state(
  p_stage_id integer,
  p_state jsonb,
  p_save_version integer
)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select case
    when p_stage_id <> 1 then true
    when
      p_state is null
      or jsonb_typeof(p_state) <> 'object'
      or p_save_version <> 1
      or octet_length(p_state::text) > 4096
      or not p_state ?& array[
        'version',
        'currentRoom',
        'hasKeycard',
        'entranceUnlocked',
        'archiveClueFound',
        'chemistryPuzzleSolved',
        'controlRoomSolved',
        'classifiedStorageUnlocked',
        'classifiedDocumentObtained',
        'escaped'
      ]
      then false
    else
      not exists (
        select 1
        from jsonb_object_keys(p_state) as state_key(key)
        where state_key.key <> all (array[
          'version',
          'currentRoom',
          'hasKeycard',
          'entranceUnlocked',
          'archiveClueFound',
          'chemistryPuzzleSolved',
          'controlRoomSolved',
          'classifiedStorageUnlocked',
          'classifiedDocumentObtained',
          'escaped'
        ])
      )
      and p_state -> 'version' = '1'::jsonb
      and p_state ->> 'currentRoom' in (
        'outside',
        'entrance',
        'hallway',
        'archive',
        'chemistry-lab',
        'control-room',
        'classified-storage'
      )
      and p_state -> 'hasKeycard' in ('true'::jsonb, 'false'::jsonb)
      and p_state -> 'entranceUnlocked' in ('true'::jsonb, 'false'::jsonb)
      and p_state -> 'archiveClueFound' in ('true'::jsonb, 'false'::jsonb)
      and p_state -> 'chemistryPuzzleSolved' in ('true'::jsonb, 'false'::jsonb)
      and p_state -> 'controlRoomSolved' in ('true'::jsonb, 'false'::jsonb)
      and p_state -> 'classifiedStorageUnlocked' in ('true'::jsonb, 'false'::jsonb)
      and p_state -> 'classifiedDocumentObtained' in ('true'::jsonb, 'false'::jsonb)
      and p_state -> 'escaped' in ('true'::jsonb, 'false'::jsonb)
      and not (
        p_state -> 'entranceUnlocked' = 'true'::jsonb
        and p_state -> 'hasKeycard' <> 'true'::jsonb
      )
      and not (
        p_state -> 'chemistryPuzzleSolved' = 'true'::jsonb
        and p_state -> 'archiveClueFound' <> 'true'::jsonb
      )
      and not (
        p_state -> 'controlRoomSolved' = 'true'::jsonb
        and p_state -> 'chemistryPuzzleSolved' <> 'true'::jsonb
      )
      and not (
        p_state -> 'classifiedStorageUnlocked' = 'true'::jsonb
        and p_state -> 'controlRoomSolved' <> 'true'::jsonb
      )
      and not (
        p_state -> 'classifiedDocumentObtained' = 'true'::jsonb
        and p_state -> 'classifiedStorageUnlocked' <> 'true'::jsonb
      )
      and not (
        p_state -> 'escaped' = 'true'::jsonb
        and p_state -> 'classifiedDocumentObtained' <> 'true'::jsonb
      )
  end;
$$;

revoke all on function private.is_valid_stage_one_state(integer, jsonb, integer)
  from public, anon, authenticated;

create table if not exists public.user_stage_saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  stage_id integer not null references public.stages (id) on delete cascade,
  state jsonb not null,
  save_version integer not null,
  elapsed_time_ms bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_stage_saves_pkey primary key (user_id, stage_id),
  constraint user_stage_saves_version_positive_check check (save_version > 0),
  constraint user_stage_saves_elapsed_time_check check (
    elapsed_time_ms between 0 and 9007199254740991
  ),
  constraint user_stage_saves_state_size_check
    check (octet_length(state::text) <= 65536),
  constraint user_stage_saves_stage_one_state_check
    check (private.is_valid_stage_one_state(stage_id, state, save_version))
);

create index if not exists user_stage_saves_stage_id_idx
  on public.user_stage_saves (stage_id);

drop trigger if exists user_stage_saves_set_updated_at
  on public.user_stage_saves;
create trigger user_stage_saves_set_updated_at
before update on public.user_stage_saves
for each row
execute function private.set_updated_at();

create or replace function private.stage_one_default_state()
returns jsonb
language sql
immutable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'version', 1,
    'currentRoom', 'outside',
    'hasKeycard', false,
    'entranceUnlocked', false,
    'archiveClueFound', false,
    'chemistryPuzzleSolved', false,
    'controlRoomSolved', false,
    'classifiedStorageUnlocked', false,
    'classifiedDocumentObtained', false,
    'escaped', false
  );
$$;

revoke all on function private.stage_one_default_state()
  from public, anon, authenticated;

create or replace function private.require_stage_one_access()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_status text;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '42501';
  end if;

  perform public.ensure_user_setup();

  select progress.status
  into v_status
  from public.user_stage_progress as progress
  join public.stages as stage
    on stage.id = progress.stage_id
  where
    progress.user_id = v_user_id
    and progress.stage_id = 1
    and stage.is_published = true;

  if not found then
    raise exception 'Stage 1 progress was not found.'
      using errcode = 'P0002';
  end if;

  if v_status = 'locked' then
    raise exception 'Stage 1 is locked.'
      using errcode = '42501';
  end if;

  return v_user_id;
end;
$$;

revoke all on function private.require_stage_one_access()
  from public, anon, authenticated;

create or replace function private.ensure_stage_one_save(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.user_stage_saves (
    user_id,
    stage_id,
    state,
    save_version,
    elapsed_time_ms
  )
  values (
    p_user_id,
    1,
    private.stage_one_default_state(),
    1,
    0
  )
  on conflict (user_id, stage_id) do nothing;
$$;

revoke all on function private.ensure_stage_one_save(uuid)
  from public, anon, authenticated;

create or replace function private.assert_valid_stage_one_save(
  p_state jsonb,
  p_save_version integer,
  p_elapsed_time_ms bigint
)
returns void
language plpgsql
immutable
security invoker
set search_path = ''
as $$
begin
  if
    p_elapsed_time_ms is null
    or p_elapsed_time_ms < 0
    or p_elapsed_time_ms > 9007199254740991
  then
    raise exception 'Stage 1 elapsed time must be a JavaScript-safe non-negative integer.'
      using errcode = '22023';
  end if;

  if p_save_version is distinct from 1 then
    raise exception 'Unsupported Stage 1 save version.'
      using errcode = '22023';
  end if;

  if (
    p_state -> 'entranceUnlocked' = 'true'::jsonb
    and p_state -> 'hasKeycard' <> 'true'::jsonb
  ) then
    raise exception 'Stage 1 save state is invalid: keycard is required.'
      using errcode = '22023';
  end if;

  if (
    p_state -> 'chemistryPuzzleSolved' = 'true'::jsonb
    and p_state -> 'archiveClueFound' <> 'true'::jsonb
  ) then
    raise exception 'Stage 1 save state is invalid: archive clue is required.'
      using errcode = '22023';
  end if;

  if (
    p_state -> 'controlRoomSolved' = 'true'::jsonb
    and p_state -> 'chemistryPuzzleSolved' <> 'true'::jsonb
  ) then
    raise exception 'Stage 1 save state is invalid: chemistry puzzle is required.'
      using errcode = '22023';
  end if;

  if (
    p_state -> 'classifiedStorageUnlocked' = 'true'::jsonb
    and p_state -> 'controlRoomSolved' <> 'true'::jsonb
  ) then
    raise exception 'Stage 1 save state is invalid: control room is required.'
      using errcode = '22023';
  end if;

  if (
    p_state -> 'classifiedDocumentObtained' = 'true'::jsonb
    and p_state -> 'classifiedStorageUnlocked' <> 'true'::jsonb
  ) then
    raise exception 'Stage 1 save state is invalid: storage unlock is required.'
      using errcode = '22023';
  end if;

  if (
    p_state -> 'escaped' = 'true'::jsonb
    and p_state -> 'classifiedDocumentObtained' <> 'true'::jsonb
  ) then
    raise exception 'Stage 1 save state is invalid: classified document is required.'
      using errcode = '22023';
  end if;

  if not private.is_valid_stage_one_state(1, p_state, p_save_version) then
    raise exception 'Stage 1 save state has an invalid schema or value.'
      using errcode = '22023';
  end if;
end;
$$;

revoke all on function private.assert_valid_stage_one_save(jsonb, integer, bigint)
  from public, anon, authenticated;

create or replace function private.stage_one_progress_payload(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'progress', jsonb_build_object(
      'status', progress.status,
      'bestClearTimeMs', progress.best_clear_time_ms,
      'startedAt', progress.started_at,
      'clearedAt', progress.cleared_at,
      'lastPlayedAt', progress.last_played_at
    ),
    'state', save.state,
    'canContinue', progress.status = 'in_progress',
    'elapsedTimeMs', save.elapsed_time_ms,
    'lastSavedAt', save.updated_at
  )
  from public.user_stage_progress as progress
  join public.user_stage_saves as save
    on save.user_id = progress.user_id
    and save.stage_id = progress.stage_id
  where
    progress.user_id = p_user_id
    and progress.stage_id = 1;
$$;

revoke all on function private.stage_one_progress_payload(uuid)
  from public, anon, authenticated;

create or replace function public.get_stage_one_progress()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  v_user_id := private.require_stage_one_access();
  perform private.ensure_stage_one_save(v_user_id);

  return private.stage_one_progress_payload(v_user_id);
end;
$$;

revoke all on function public.get_stage_one_progress()
  from public, anon, authenticated;
grant execute on function public.get_stage_one_progress()
  to authenticated;

create or replace function public.start_stage_one()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  perform public.start_stage(1);
  v_user_id := (select auth.uid());
  perform private.ensure_stage_one_save(v_user_id);

  return private.stage_one_progress_payload(v_user_id);
end;
$$;

revoke all on function public.start_stage_one()
  from public, anon, authenticated;
grant execute on function public.start_stage_one()
  to authenticated;

create or replace function public.save_stage_one_progress(
  p_state jsonb,
  p_save_version integer,
  p_elapsed_time_ms bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_current_state jsonb;
  v_current_elapsed_time_ms bigint;
begin
  v_user_id := private.require_stage_one_access();
  perform private.assert_valid_stage_one_save(
    p_state,
    p_save_version,
    p_elapsed_time_ms
  );

  perform private.ensure_stage_one_save(v_user_id);

  select
    save.state,
    save.elapsed_time_ms
  into
    v_current_state,
    v_current_elapsed_time_ms
  from public.user_stage_saves as save
  where
    save.user_id = v_user_id
    and save.stage_id = 1
  for update of save;

  if p_elapsed_time_ms < v_current_elapsed_time_ms then
    update public.user_stage_progress
    set last_played_at = now()
    where
      user_id = v_user_id
      and stage_id = 1;

    return;
  end if;

  if
    (
      v_current_state -> 'hasKeycard' = 'true'::jsonb
      and p_state -> 'hasKeycard' <> 'true'::jsonb
    )
    or (
      v_current_state -> 'entranceUnlocked' = 'true'::jsonb
      and p_state -> 'entranceUnlocked' <> 'true'::jsonb
    )
    or (
      v_current_state -> 'archiveClueFound' = 'true'::jsonb
      and p_state -> 'archiveClueFound' <> 'true'::jsonb
    )
    or (
      v_current_state -> 'chemistryPuzzleSolved' = 'true'::jsonb
      and p_state -> 'chemistryPuzzleSolved' <> 'true'::jsonb
    )
    or (
      v_current_state -> 'controlRoomSolved' = 'true'::jsonb
      and p_state -> 'controlRoomSolved' <> 'true'::jsonb
    )
    or (
      v_current_state -> 'classifiedStorageUnlocked' = 'true'::jsonb
      and p_state -> 'classifiedStorageUnlocked' <> 'true'::jsonb
    )
    or (
      v_current_state -> 'classifiedDocumentObtained' = 'true'::jsonb
      and p_state -> 'classifiedDocumentObtained' <> 'true'::jsonb
    )
    or (
      v_current_state -> 'escaped' = 'true'::jsonb
      and p_state -> 'escaped' <> 'true'::jsonb
    )
  then
    raise exception 'Stage 1 save state cannot regress.'
      using errcode = '22023';
  end if;

  update public.user_stage_saves
  set
    state = p_state,
    save_version = p_save_version,
    elapsed_time_ms = p_elapsed_time_ms
  where
    user_id = v_user_id
    and stage_id = 1;

  update public.user_stage_progress
  set last_played_at = now()
  where
    user_id = v_user_id
    and stage_id = 1;
end;
$$;

revoke all on function public.save_stage_one_progress(jsonb, integer, bigint)
  from public, anon, authenticated;
grant execute on function public.save_stage_one_progress(jsonb, integer, bigint)
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
  v_effective_clear_time_ms bigint := p_clear_time_ms;
  v_stage_one_state jsonb;
  v_stage_one_save_version integer;
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

  if p_stage_id = 1 then
    select
      save.state,
      save.save_version,
      save.elapsed_time_ms
    into
      v_stage_one_state,
      v_stage_one_save_version,
      v_effective_clear_time_ms
    from public.user_stage_saves as save
    where
      save.user_id = v_user_id
      and save.stage_id = 1
    for update of save;

    if not found then
      raise exception 'Stage 1 save state was not found.'
        using errcode = 'P0002';
    end if;

    perform private.assert_valid_stage_one_save(
      v_stage_one_state,
      v_stage_one_save_version,
      v_effective_clear_time_ms
    );

    if v_stage_one_state -> 'classifiedDocumentObtained' <> 'true'::jsonb then
      raise exception 'The classified document must be obtained before completion.'
        using errcode = '55000';
    end if;

    if v_stage_one_state -> 'escaped' <> 'true'::jsonb then
      raise exception 'The Stage 1 escape must be completed.'
        using errcode = '55000';
    end if;

    if v_effective_clear_time_ms <= 0 then
      raise exception 'A positive elapsed time is required for Stage 1 completion.'
        using errcode = '22023';
    end if;
  end if;

  update public.user_stage_progress
  set
    status = 'cleared',
    best_clear_time_ms = case
      when best_clear_time_ms is null
        or v_effective_clear_time_ms < best_clear_time_ms
        then v_effective_clear_time_ms
      else best_clear_time_ms
    end,
    started_at = coalesce(started_at, now()),
    cleared_at = coalesce(cleared_at, now()),
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

create or replace function public.complete_stage_one()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_elapsed_time_ms bigint;
  v_stage_two_unlocked boolean := false;
begin
  v_user_id := private.require_stage_one_access();
  perform private.ensure_stage_one_save(v_user_id);

  select save.elapsed_time_ms
  into v_elapsed_time_ms
  from public.user_stage_saves as save
  where
    save.user_id = v_user_id
    and save.stage_id = 1;

  if v_elapsed_time_ms <= 0 then
    raise exception 'A positive elapsed time is required for Stage 1 completion.'
      using errcode = '22023';
  end if;

  perform public.complete_stage(1, v_elapsed_time_ms);

  select progress.status <> 'locked'
  into v_stage_two_unlocked
  from public.user_stage_progress as progress
  where
    progress.user_id = v_user_id
    and progress.stage_id = (
      select next_stage.id
      from public.stages as next_stage
      where
        next_stage.is_published = true
        and next_stage.stage_order > (
          select stage_one.stage_order
          from public.stages as stage_one
          where stage_one.id = 1
        )
      order by next_stage.stage_order
      limit 1
    );

  return private.stage_one_progress_payload(v_user_id)
    || jsonb_build_object(
      'stageTwoUnlocked', coalesce(v_stage_two_unlocked, false)
    );
end;
$$;

revoke all on function public.complete_stage_one()
  from public, anon, authenticated;
grant execute on function public.complete_stage_one()
  to authenticated;

alter table public.user_stage_saves enable row level security;

drop policy if exists "Users can read their own stage saves"
  on public.user_stage_saves;
create policy "Users can read their own stage saves"
on public.user_stage_saves
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);

drop policy if exists "Users can insert their own accessible stage saves"
  on public.user_stage_saves;
create policy "Users can insert their own accessible stage saves"
on public.user_stage_saves
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and exists (
    select 1
    from public.user_stage_progress as progress
    where
      progress.user_id = (select auth.uid())
      and progress.stage_id = user_stage_saves.stage_id
      and progress.status <> 'locked'
  )
);

drop policy if exists "Users can update their own accessible stage saves"
  on public.user_stage_saves;
create policy "Users can update their own accessible stage saves"
on public.user_stage_saves
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and exists (
    select 1
    from public.user_stage_progress as progress
    where
      progress.user_id = (select auth.uid())
      and progress.stage_id = user_stage_saves.stage_id
      and progress.status <> 'locked'
  )
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and exists (
    select 1
    from public.user_stage_progress as progress
    where
      progress.user_id = (select auth.uid())
      and progress.stage_id = user_stage_saves.stage_id
      and progress.status <> 'locked'
  )
);

revoke all privileges on table public.user_stage_saves
  from anon, authenticated;
grant select on table public.user_stage_saves
  to authenticated;
