-- Release hardening: indexes and events access
create index if not exists events_club_id_idx on public.events(club_id);
create index if not exists transactions_updated_by_idx on public.transactions(updated_by);
create index if not exists transactions_voided_by_idx on public.transactions(voided_by);

revoke all on table public.events from anon;
revoke insert, update, delete, truncate on table public.events from authenticated;
grant select on table public.events to authenticated;

drop policy if exists treasury_events_admin_read on public.events;
create policy treasury_events_admin_read
on public.events for select
to authenticated
using ((select private.is_treasury_admin()));
