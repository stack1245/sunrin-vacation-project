begin;

lock table public.user_stage_saves in share row exclusive mode;

do $$
declare
  v_deleted_stage_one_saves bigint;
begin
  delete from public.user_stage_saves
  where stage_id = 1;

  get diagnostics v_deleted_stage_one_saves = row_count;
  raise notice 'Reset % Stage 1 save row(s) for save version 2.',
    v_deleted_stage_one_saves;
end;
$$;

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
      or p_save_version <> 2
      or octet_length(p_state::text) > 4096
      or not p_state ?& array[
        'version',
        'currentRoom',
        'hasKeycard',
        'entranceUnlocked',
        'archiveClueFound',
        'scienceLabPuzzleSolved',
        'controlRoomSolved',
        'documentStorageUnlocked',
        'confidentialDocumentObtained',
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
          'scienceLabPuzzleSolved',
          'controlRoomSolved',
          'documentStorageUnlocked',
          'confidentialDocumentObtained',
          'escaped'
        ])
      )
      and p_state -> 'version' = '2'::jsonb
      and p_state ->> 'currentRoom' in (
        'outside',
        'entrance',
        'hallway',
        'archive',
        'science-lab',
        'control-room',
        'document-storage'
      )
      and p_state -> 'hasKeycard' in ('true'::jsonb, 'false'::jsonb)
      and p_state -> 'entranceUnlocked' in ('true'::jsonb, 'false'::jsonb)
      and p_state -> 'archiveClueFound' in ('true'::jsonb, 'false'::jsonb)
      and p_state -> 'scienceLabPuzzleSolved' in ('true'::jsonb, 'false'::jsonb)
      and p_state -> 'controlRoomSolved' in ('true'::jsonb, 'false'::jsonb)
      and p_state -> 'documentStorageUnlocked' in ('true'::jsonb, 'false'::jsonb)
      and p_state -> 'confidentialDocumentObtained' in ('true'::jsonb, 'false'::jsonb)
      and p_state -> 'escaped' in ('true'::jsonb, 'false'::jsonb)
      and not (
        p_state -> 'entranceUnlocked' = 'true'::jsonb
        and p_state -> 'hasKeycard' <> 'true'::jsonb
      )
      and not (
        p_state -> 'scienceLabPuzzleSolved' = 'true'::jsonb
        and p_state -> 'archiveClueFound' <> 'true'::jsonb
      )
      and not (
        p_state -> 'controlRoomSolved' = 'true'::jsonb
        and p_state -> 'scienceLabPuzzleSolved' <> 'true'::jsonb
      )
      and not (
        p_state -> 'documentStorageUnlocked' = 'true'::jsonb
        and p_state -> 'controlRoomSolved' <> 'true'::jsonb
      )
      and not (
        p_state -> 'confidentialDocumentObtained' = 'true'::jsonb
        and p_state -> 'documentStorageUnlocked' <> 'true'::jsonb
      )
      and not (
        p_state -> 'escaped' = 'true'::jsonb
        and p_state -> 'confidentialDocumentObtained' <> 'true'::jsonb
      )
  end;
$$;

revoke all on function private.is_valid_stage_one_state(integer, jsonb, integer)
  from public, anon, authenticated;
grant execute on function private.is_valid_stage_one_state(integer, jsonb, integer)
  to service_role;

alter table public.user_stage_saves
  drop constraint if exists user_stage_saves_stage_one_state_check;
alter table public.user_stage_saves
  add constraint user_stage_saves_stage_one_state_check
  check (private.is_valid_stage_one_state(stage_id, state, save_version));

create or replace function private.stage_one_default_state()
returns jsonb
language sql
immutable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'version', 2,
    'currentRoom', 'outside',
    'hasKeycard', false,
    'entranceUnlocked', false,
    'archiveClueFound', false,
    'scienceLabPuzzleSolved', false,
    'controlRoomSolved', false,
    'documentStorageUnlocked', false,
    'confidentialDocumentObtained', false,
    'escaped', false
  );
$$;

revoke all on function private.stage_one_default_state()
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
    2,
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

  if p_save_version is distinct from 2 then
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
    p_state -> 'scienceLabPuzzleSolved' = 'true'::jsonb
    and p_state -> 'archiveClueFound' <> 'true'::jsonb
  ) then
    raise exception 'Stage 1 save state is invalid: archive clue is required.'
      using errcode = '22023';
  end if;

  if (
    p_state -> 'controlRoomSolved' = 'true'::jsonb
    and p_state -> 'scienceLabPuzzleSolved' <> 'true'::jsonb
  ) then
    raise exception 'Stage 1 save state is invalid: science lab puzzle is required.'
      using errcode = '22023';
  end if;

  if (
    p_state -> 'documentStorageUnlocked' = 'true'::jsonb
    and p_state -> 'controlRoomSolved' <> 'true'::jsonb
  ) then
    raise exception 'Stage 1 save state is invalid: control room is required.'
      using errcode = '22023';
  end if;

  if (
    p_state -> 'confidentialDocumentObtained' = 'true'::jsonb
    and p_state -> 'documentStorageUnlocked' <> 'true'::jsonb
  ) then
    raise exception 'Stage 1 save state is invalid: document storage unlock is required.'
      using errcode = '22023';
  end if;

  if (
    p_state -> 'escaped' = 'true'::jsonb
    and p_state -> 'confidentialDocumentObtained' <> 'true'::jsonb
  ) then
    raise exception 'Stage 1 save state is invalid: confidential document is required.'
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
      v_current_state -> 'scienceLabPuzzleSolved' = 'true'::jsonb
      and p_state -> 'scienceLabPuzzleSolved' <> 'true'::jsonb
    )
    or (
      v_current_state -> 'controlRoomSolved' = 'true'::jsonb
      and p_state -> 'controlRoomSolved' <> 'true'::jsonb
    )
    or (
      v_current_state -> 'documentStorageUnlocked' = 'true'::jsonb
      and p_state -> 'documentStorageUnlocked' <> 'true'::jsonb
    )
    or (
      v_current_state -> 'confidentialDocumentObtained' = 'true'::jsonb
      and p_state -> 'confidentialDocumentObtained' <> 'true'::jsonb
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
  to authenticated, service_role;

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

    if v_stage_one_state -> 'confidentialDocumentObtained' <> 'true'::jsonb then
      raise exception 'The confidential document must be obtained before completion.'
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
  to authenticated, service_role;

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
  to authenticated, service_role;

revoke all on function public.get_stage_one_progress()
  from public, anon, authenticated;
grant execute on function public.get_stage_one_progress()
  to authenticated, service_role;

revoke all on function public.start_stage_one()
  from public, anon, authenticated;
grant execute on function public.start_stage_one()
  to authenticated, service_role;

alter table public.user_stage_saves enable row level security;

revoke all privileges on table public.user_stage_saves
  from anon, authenticated;
grant select on table public.user_stage_saves
  to authenticated;

commit;
