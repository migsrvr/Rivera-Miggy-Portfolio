create table public.portfolio_owners (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.portfolio_owners enable row level security;
revoke all on public.portfolio_owners from anon, authenticated;

create function public.is_portfolio_owner()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.portfolio_owners where user_id = (select auth.uid()));
$$;
revoke all on function public.is_portfolio_owner() from public, anon;
grant execute on function public.is_portfolio_owner() to authenticated;

create table public.content_entries (
  collection text not null check (collection in ('profile', 'projects', 'experiences', 'credentials', 'community', 'gallery')),
  id text not null check (length(id) <= 80 and id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  position integer not null default 0,
  visible boolean not null default true,
  sample boolean not null default false,
  archived boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (collection, id),
  check (collection <> 'profile' or id = 'profile')
);

create table public.project_experiences (
  project_id text not null,
  experience_id text not null,
  sample boolean not null default false,
  project_collection text generated always as ('projects'::text) stored,
  experience_collection text generated always as ('experiences'::text) stored,
  primary key (project_id, experience_id),
  foreign key (project_collection, project_id) references public.content_entries(collection, id) on delete cascade,
  foreign key (experience_collection, experience_id) references public.content_entries(collection, id) on delete cascade
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique check (storage_path <> '' and storage_path !~ '(^/|(^|/)\.\.(/|$))'),
  original_name text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  size bigint not null check (size > 0 and size <= case when mime_type = 'application/pdf' then 20971520 else 10485760 end),
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.releases (
  id uuid primary key default gen_random_uuid(),
  state text not null default 'building' check (state in ('building', 'ready', 'failed')),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  error text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create function public.protect_content_identity()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.collection <> old.collection or new.id <> old.id then
    raise exception 'Entry collection and id are immutable';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger content_identity before update on public.content_entries
for each row execute function public.protect_content_identity();

create function public.protect_release_snapshot()
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
create trigger release_snapshot before update on public.releases
for each row execute function public.protect_release_snapshot();

alter table public.content_entries enable row level security;
alter table public.project_experiences enable row level security;
alter table public.assets enable row level security;
alter table public.releases enable row level security;

revoke all on public.content_entries, public.project_experiences, public.assets, public.releases from anon, authenticated;
grant select, insert, update on public.content_entries, public.assets, public.releases to authenticated;
grant select, insert, update, delete on public.project_experiences to authenticated;
grant all on public.portfolio_owners, public.content_entries, public.project_experiences, public.assets, public.releases to service_role;

create policy owner_content_select on public.content_entries for select to authenticated using ((select public.is_portfolio_owner()));
create policy owner_content_insert on public.content_entries for insert to authenticated with check ((select public.is_portfolio_owner()));
create policy owner_content_update on public.content_entries for update to authenticated using ((select public.is_portfolio_owner())) with check ((select public.is_portfolio_owner()));
create policy owner_links on public.project_experiences for all to authenticated using ((select public.is_portfolio_owner())) with check ((select public.is_portfolio_owner()));
create policy owner_assets_select on public.assets for select to authenticated using ((select public.is_portfolio_owner()));
create policy owner_assets_insert on public.assets for insert to authenticated with check ((select public.is_portfolio_owner()));
create policy owner_assets_update on public.assets for update to authenticated using ((select public.is_portfolio_owner())) with check ((select public.is_portfolio_owner()));
create policy owner_releases_select on public.releases for select to authenticated using ((select public.is_portfolio_owner()));
create policy owner_releases_insert on public.releases for insert to authenticated with check ((select public.is_portfolio_owner()));
create policy owner_releases_update on public.releases for update to authenticated using ((select public.is_portfolio_owner())) with check ((select public.is_portfolio_owner()));

-- Replacing the set in one RPC transaction preserves the old links on failure.
create function public.replace_project_experiences(links jsonb)
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
revoke all on function public.replace_project_experiences(jsonb) from public, anon;
grant execute on function public.replace_project_experiences(jsonb) to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-originals', 'portfolio-originals', false, 20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

create policy portfolio_originals_owner on storage.objects for all to authenticated
using (bucket_id = 'portfolio-originals' and (select public.is_portfolio_owner()))
with check (bucket_id = 'portfolio-originals' and (select public.is_portfolio_owner()));
