-- Adli Talep Sistemi (Warrant System)
-- warrants tablosu ve storage bucket politikaları

-- Enum tipleri (PostgreSQL)
do $$ begin
  create type warrant_request_type as enum ('Raid', 'Search', 'Surveillance');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type warrant_status_type as enum ('Pending', 'Approved', 'Denied');
exception
  when duplicate_object then null;
end $$;

-- warrants tablosu
create table if not exists public.warrants (
  id uuid default gen_random_uuid() primary key,
  applicant_name text not null,
  department text not null,
  rank text not null,
  target text not null,
  request_type text not null check (request_type in ('Raid', 'Search', 'Surveillance')),
  evidence_urls text[] default '{}',
  reason text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Denied')),
  judge_note text,
  created_at timestamptz default now()
);

alter table public.warrants enable row level security;
drop policy if exists "warrants_insert" on public.warrants;
drop policy if exists "warrants_select" on public.warrants;
drop policy if exists "warrants_update" on public.warrants;
create policy "warrants_insert" on public.warrants for insert to anon, authenticated with check (true);
create policy "warrants_select" on public.warrants for select to anon, authenticated using (true);
create policy "warrants_update" on public.warrants for update to anon, authenticated using (true);

-- warrants storage bucket: Supabase Dashboard > Storage > New bucket > "warrants" (public)
-- Allowed MIME: image/png, image/jpeg, image/jpg, image/webp, image/gif
-- Storage policies - warrants bucket (policy names must be unique per table)
drop policy if exists "warrants_bucket_upload" on storage.objects;
drop policy if exists "warrants_bucket_read" on storage.objects;
create policy "warrants_bucket_upload" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'warrants');
create policy "warrants_bucket_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'warrants');
