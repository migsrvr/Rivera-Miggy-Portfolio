-- Additive correction for existing local installations; retain draft data.
create or replace function public.protect_release_snapshot()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.id <> old.id or new.snapshot is distinct from old.snapshot or new.created_at is distinct from old.created_at then
    raise exception 'Release id, snapshot, and creation time are immutable';
  end if;
  if old.state <> 'building' and new.state <> old.state then
    raise exception 'A completed release cannot change state';
  end if;
  return new;
end;
$$;
create or replace trigger release_snapshot before update on public.releases
for each row execute function public.protect_release_snapshot();


create or replace function public.replace_project_experiences(links jsonb)
returns setof public.project_experiences language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.is_portfolio_owner() then
    raise exception 'Portfolio owner required' using errcode = '42501';
  end if;
  if jsonb_typeof(links) <> 'array' then
    raise exception 'Relationships must be an array';
  end if;
  delete from public.project_experiences where project_id is not null;
  insert into public.project_experiences(project_id, experience_id, sample)
    select r.project_id, r.experience_id, coalesce(r.sample, false)
    from jsonb_to_recordset(links) as r(project_id text, experience_id text, sample boolean);
  return query select * from public.project_experiences order by project_id, experience_id;
end;
$$;
