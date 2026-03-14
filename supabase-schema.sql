-- DOJ Marshals - Belgeler tablosu
-- Supabase Dashboard > SQL Editor'da çalıştırın.

create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null check (category in ('case', 'announcement', 'protocol', 'sop', 'training', 'form')),
  date date not null default current_date,
  file_url text not null,
  file_type text not null check (file_type in ('pdf', 'png')),
  description text,
  created_at timestamptz default now()
);

-- Tablo RLS: Herkes okuyabilsin (belgeler public)
alter table documents enable row level security;
drop policy if exists "documents_public_read" on documents;
drop policy if exists "documents_anon_insert" on documents;
drop policy if exists "documents_anon_update" on documents;
drop policy if exists "documents_anon_delete" on documents;
create policy "documents_public_read" on documents for select using (true);
create policy "documents_anon_insert" on documents for insert with check (true);
create policy "documents_anon_update" on documents for update using (true);
create policy "documents_anon_delete" on documents for delete using (true);

-- Storage bucket oluşturmak için Supabase Dashboard > Storage > New bucket
-- Bucket adı: documents
-- Public: Yes (belgeler herkese açık olacak)
--
-- Storage Policies (Storage > documents > Policies):
-- 1. "Allow public uploads" - INSERT - (bucket_id = 'documents')
-- 2. "Allow public read" - SELECT - (bucket_id = 'documents')
