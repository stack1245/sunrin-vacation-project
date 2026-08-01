create extension if not exists pg_cron;

create schema if not exists private;

revoke all on schema private
  from public, anon, authenticated, service_role;

create or replace function private.cleanup_unconfirmed_auth_users(
  max_age interval default interval '24 hours'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate record;
  deleted_in_iteration integer;
  deleted_total integer := 0;
begin
  if max_age is null or max_age <= interval '0 seconds' then
    raise exception 'max_age must be a positive interval.'
      using errcode = '22023';
  end if;

  for candidate in
    select auth_user.id
    from auth.users as auth_user
    where
      auth_user.email is not null
      and auth_user.email_confirmed_at is null
      and auth_user.created_at < now() - max_age
      and auth_user.last_sign_in_at is null
    order by auth_user.created_at
    for update skip locked
  loop
    begin
      delete from auth.users as auth_user
      where
        auth_user.id = candidate.id
        and auth_user.email is not null
        and auth_user.email_confirmed_at is null
        and auth_user.created_at < now() - max_age
        and auth_user.last_sign_in_at is null;

      get diagnostics deleted_in_iteration = row_count;
      deleted_total := deleted_total + deleted_in_iteration;
    exception
      when foreign_key_violation then
        raise warning
          'Skipped unconfirmed auth user % because dependent data prevents deletion.',
          candidate.id;
    end;
  end loop;

  return deleted_total;
end;
$$;

comment on function private.cleanup_unconfirmed_auth_users(interval) is
  'Deletes email users that remain unconfirmed and have never signed in beyond the configured retention interval.';

revoke all on function private.cleanup_unconfirmed_auth_users(interval)
  from public, anon, authenticated, service_role;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select scheduled_job.jobid
    from cron.job as scheduled_job
    where scheduled_job.jobname = 'cleanup-unconfirmed-auth-users'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;

  perform cron.schedule(
    'cleanup-unconfirmed-auth-users',
    '*/10 * * * *',
    $command$
      select private.cleanup_unconfirmed_auth_users(interval '24 hours');
    $command$
  );
end;
$$;
