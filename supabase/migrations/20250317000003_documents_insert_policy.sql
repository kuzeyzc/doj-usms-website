-- documents tablosu + documents storage bucket RLS politikaları
-- "Sitede Yayınla" özelliği için gerekli (PNG yükleme + veritabanı kaydı)

-- ========== 1. public.documents TABLOSU ==========
drop policy if exists "documents_select" on public.documents;
drop policy if exists "documents_all" on public.documents;
drop policy if exists "documents_insert" on public.documents;
drop policy if exists "documents_update" on public.documents;
drop policy if exists "documents_delete" on public.documents;
drop policy if exists "documents_public_read" on public.documents;
drop policy if exists "documents_anon_insert" on public.documents;
drop policy if exists "documents_anon_update" on public.documents;
drop policy if exists "documents_anon_delete" on public.documents;

create policy "documents_select" on public.documents
  for select to anon, authenticated using (true);

create policy "documents_insert" on public.documents
  for insert to anon, authenticated with check (true);

create policy "documents_update" on public.documents
  for update to anon, authenticated using (true) with check (true);

create policy "documents_delete" on public.documents
  for delete to anon, authenticated using (true);

-- ========== 2. storage.objects - documents BUCKET (PNG/PDF yükleme) ==========
drop policy if exists "documents_bucket_insert" on storage.objects;
drop policy if exists "documents_bucket_select" on storage.objects;
drop policy if exists "Allow public uploads" on storage.objects;
drop policy if exists "Allow public read" on storage.objects;

create policy "documents_bucket_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'documents');

create policy "documents_bucket_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'documents');
