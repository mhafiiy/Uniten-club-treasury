-- Phase 2 preparation: safe to review/apply before access enforcement.
-- This aligns with the existing public.members/public.clubs model.

alter type public.user_role add value if not exists 'viewer';

create unique index if not exists clubs_name_unique_idx
  on public.clubs (name);

insert into public.clubs (name, category)
select distinct t.club_name, 'Treasury'
from public.transactions t
where t.club_name is not null
  and length(trim(t.club_name)) > 0
on conflict (name) do nothing;

create index if not exists members_user_id_idx on public.members (user_id);
create index if not exists members_club_id_idx on public.members (club_id);

-- Harden existing SECURITY DEFINER helpers against mutable search_path.
alter function public.get_user_role(uuid) set search_path = 'public', 'auth';
alter function public.enforce_uniten_emails() set search_path = 'public', 'auth';
alter function public.process_audit_log() set search_path = 'public', 'auth';

-- Trigger/event-trigger helpers should not be callable through the Data API.
revoke execute on function public.enforce_uniten_emails() from public, anon, authenticated;
revoke execute on function public.process_audit_log() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- get_user_role is used by RLS on members; authenticated callers may use it,
-- but anonymous callers should not.
revoke execute on function public.get_user_role(uuid) from public, anon;
grant execute on function public.get_user_role(uuid) to authenticated;

-- Reduce broad table privileges. RLS remains the row-level boundary.
revoke all on table public.audit_log from anon;
revoke insert, update, delete, truncate on table public.audit_log from authenticated;

revoke all on table public.members from anon;
revoke insert, update, delete, truncate on table public.members from authenticated;

revoke all on table public.transactions from anon;
revoke all on table public.clubs from anon;
grant select on table public.clubs to authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;
grant select on table public.members to authenticated;
