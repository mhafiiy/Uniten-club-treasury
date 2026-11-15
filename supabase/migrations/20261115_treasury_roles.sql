-- REVIEW BEFORE RUNNING. Back up the database and verify transactions columns.
-- Existing permissive policies are removed; this migration is intentionally fail-closed.
create table if not exists public.treasury_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('administrator','club_treasurer','auditor','viewer')),
  club_name text not null default '',
  primary key (user_id, role, club_name),
  constraint scoped_membership check (
    (role = 'administrator' and club_name = '')
    or (role <> 'administrator' and length(trim(club_name)) > 0)
  )
);
create index if not exists treasury_memberships_user_idx on public.treasury_memberships(user_id);
alter table public.treasury_memberships enable row level security;

-- SECURITY DEFINER bypasses membership RLS, preventing recursive policy checks.
create or replace function public.treasury_has_access(p_club text, p_action text)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.treasury_memberships m
    where m.user_id = (select auth.uid())
      and (
        m.role = 'administrator'
        or (m.club_name = p_club and (
          (p_action = 'read' and m.role in ('club_treasurer','auditor','viewer'))
          or (p_action = 'write' and m.role = 'club_treasurer')
          or (p_action = 'export' and m.role in ('club_treasurer','auditor'))
        ))
      )
  );
$$;
revoke all on function public.treasury_has_access(text,text) from public;
grant execute on function public.treasury_has_access(text,text) to authenticated;

drop policy if exists treasury_memberships_read on public.treasury_memberships;
create policy treasury_memberships_read on public.treasury_memberships
for select to authenticated using (
  user_id = (select auth.uid())
  or public.treasury_has_access('', 'read') -- administrators
);
-- No client INSERT/UPDATE/DELETE policy for memberships: provision via trusted admin SQL.

alter table public.transactions enable row level security;
-- Remove ALL prior policies: permissive policies combine with OR.
do $$
declare p record;
begin
  for p in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'transactions'
  loop
    execute format('drop policy %I on public.transactions', p.policyname);
  end loop;
end $$;

create policy treasury_transactions_read on public.transactions
for select to authenticated using (public.treasury_has_access(club_name, 'read'));

create policy treasury_transactions_insert on public.transactions
for insert to authenticated with check (
  public.treasury_has_access(club_name, 'write')
  and lower(user_email) = lower((select auth.jwt() ->> 'email'))
);

create policy treasury_transactions_update on public.transactions
for update to authenticated
using (public.treasury_has_access(club_name, 'write'))
with check (public.treasury_has_access(club_name, 'write'));

create policy treasury_transactions_delete on public.transactions
for delete to authenticated using (public.treasury_has_access(club_name, 'write'));

-- Bootstrap the first administrator from a trusted SQL editor, never from browser code:
-- insert into public.treasury_memberships(user_id, role, club_name)
-- values ('REPLACE_WITH_AUTH_USERS_UUID', 'administrator', '');
-- Then provision other roles with the exact club_name values used in transactions.
