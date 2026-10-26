-- One MVCC statement freezes the draft across entries, relationships and assets.
create function public.portfolio_draft()
returns jsonb language sql stable security invoker set search_path = ''
as $$
  select jsonb_build_object(
    'entries', coalesce((select jsonb_agg(to_jsonb(e) order by e.position,e.collection,e.id) from public.content_entries e), '[]'::jsonb),
    'relationships', coalesce((select jsonb_agg(jsonb_build_object('project_id',p.project_id,'experience_id',p.experience_id,'sample',p.sample) order by p.project_id,p.experience_id) from public.project_experiences p), '[]'::jsonb),
    'assets', coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc,a.id) from public.assets a), '[]'::jsonb)
  );
$$;
revoke all on function public.portfolio_draft() from public, anon;
grant execute on function public.portfolio_draft() to authenticated, service_role;
