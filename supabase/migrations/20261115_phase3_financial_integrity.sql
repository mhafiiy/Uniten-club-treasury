-- Phase 3: financial integrity
alter table public.transactions
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references auth.users(id),
  add column if not exists void_reason text;

alter table public.transactions
  drop constraint if exists transactions_amount_positive,
  add constraint transactions_amount_positive check (amount > 0);

alter table public.transactions
  drop constraint if exists transactions_amount_scale,
  add constraint transactions_amount_scale check (amount = round(amount, 2));

alter table public.transactions
  drop constraint if exists transactions_void_fields_consistent,
  add constraint transactions_void_fields_consistent check (
    (voided_at is null and voided_by is null and void_reason is null)
    or
    (voided_at is not null and voided_by is not null and length(trim(void_reason)) > 0)
  );

create or replace function private.stamp_transaction_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
    new.updated_by := (select auth.uid());
  end if;
  return new;
end;
$$;
revoke all on function private.stamp_transaction_change() from public, anon, authenticated;
drop trigger if exists transactions_stamp_update on public.transactions;
create trigger transactions_stamp_update before update on public.transactions
for each row execute function private.stamp_transaction_change();

create or replace function private.audit_transaction_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.audit_log(table_name,row_id,action,old_data,new_data,user_id)
  values ('transactions',coalesce(new.id,old.id),tg_op,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end,
    (select auth.uid()));
  return coalesce(new,old);
end;
$$;
revoke all on function private.audit_transaction_change() from public, anon, authenticated;
drop trigger if exists transactions_audit_log on public.transactions;
create trigger transactions_audit_log after insert or update or delete on public.transactions
for each row execute function private.audit_transaction_change();

drop policy if exists treasury_transactions_delete on public.transactions;
revoke delete on table public.transactions from authenticated;

drop policy if exists treasury_transactions_update on public.transactions;
create policy treasury_transactions_update on public.transactions for update to authenticated
using ((select private.can_access_club(club_name, true)))
with check (
  (select private.can_access_club(club_name, true))
  and amount > 0 and amount = round(amount,2)
  and (voided_at is null or (voided_by = (select auth.uid()) and length(trim(void_reason)) > 0))
);

drop policy if exists treasury_transactions_insert on public.transactions;
create policy treasury_transactions_insert on public.transactions for insert to authenticated
with check (
  (select private.can_access_club(club_name, true))
  and lower(user_email) = lower(((select auth.jwt()) ->> 'email'))
  and amount > 0 and amount = round(amount,2)
  and voided_at is null and voided_by is null and void_reason is null
);


-- Once voided, a transaction cannot be edited or unvoided.
create or replace function private.enforce_transaction_immutability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.voided_at is not null then
    raise exception 'Voided transactions are immutable';
  end if;

  if new.id <> old.id
     or new.created_at is distinct from old.created_at
     or new.user_email is distinct from old.user_email then
    raise exception 'Transaction identity and original recorder are immutable';
  end if;

  if old.voided_at is null and new.voided_at is not null then
    if new.voided_by is distinct from (select auth.uid())
       or new.void_reason is null
       or length(trim(new.void_reason)) = 0 then
      raise exception 'Voiding requires the current user and a reason';
    end if;
  elsif new.voided_at is distinct from old.voided_at
     or new.voided_by is distinct from old.voided_by
     or new.void_reason is distinct from old.void_reason then
    raise exception 'Void metadata can only be set once';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_transaction_immutability() from public, anon, authenticated;

drop trigger if exists transactions_enforce_immutability on public.transactions;
create trigger transactions_enforce_immutability
before update on public.transactions
for each row execute function private.enforce_transaction_immutability();
