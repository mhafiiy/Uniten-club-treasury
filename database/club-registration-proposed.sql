-- Proposed migration; review and test before applying.
begin;
create unique index clubs_normalized_name_unique on public.clubs (lower(btrim(name)));
alter table public.clubs add constraint clubs_registration_fields_valid check (
  name = btrim(name) and category = btrim(category)
  and char_length(name) between 1 and 160
  and char_length(category) between 1 and 80
  and lower(name) not in ('energy, economics & environmental student club','persatuan silat seni gayong')
) not valid;
create policy treasury_clubs_admin_insert on public.clubs for insert to authenticated
with check ((select auth.uid()) is not null and (select private.is_treasury_admin()));
grant insert (name, category) on public.clubs to authenticated;
create function private.audit_club_registration() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not coalesce(private.is_treasury_admin(), false) then
    raise exception 'Administrator required' using errcode = '42501';
  end if;
  insert into public.audit_log(table_name,row_id,action,new_data,user_id)
  values ('clubs',new.id,'INSERT',to_jsonb(new),auth.uid());
  return new;
end;
$$;
revoke all on function private.audit_club_registration() from public, anon, authenticated;
create trigger clubs_audit_registration after insert on public.clubs
for each row execute function private.audit_club_registration();
commit;
