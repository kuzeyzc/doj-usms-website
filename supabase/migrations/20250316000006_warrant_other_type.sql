-- Talep türüne "Other" (Diğer) ekleme ve request_type_other sütunu
-- Önce request_type_other sütununu ekle (varsa atla)
alter table public.warrants add column if not exists request_type_other text;

-- request_type check constraint'ini güncelle (isim farklı olabilir)
do $$
declare
  conname text;
begin
  for conname in
    select c.conname from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    where t.relname = 'warrants' and c.contype = 'c'
    and pg_get_constraintdef(c.oid) like '%request_type%'
  loop
    execute format('alter table public.warrants drop constraint if exists %I', conname);
  end loop;
  alter table public.warrants add constraint warrants_request_type_check
    check (request_type in ('Raid', 'Search', 'Surveillance', 'Other'));
end $$;
