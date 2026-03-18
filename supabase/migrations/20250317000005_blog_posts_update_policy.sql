-- blog_posts UPDATE RLS politikasını düzeltir
-- "for all" ile tek policy bazen UPDATE'te WITH CHECK eksikliğine yol açabiliyor
-- Ayrı UPDATE policy ile USING + WITH CHECK açıkça tanımlanıyor

drop policy if exists "blog_posts_select" on public.blog_posts;
drop policy if exists "blog_posts_all" on public.blog_posts;
drop policy if exists "blog_posts_insert" on public.blog_posts;
drop policy if exists "blog_posts_update" on public.blog_posts;
drop policy if exists "blog_posts_delete" on public.blog_posts;

-- SELECT: herkes okuyabilir
create policy "blog_posts_select" on public.blog_posts
  for select to anon, authenticated using (true);

-- INSERT: herkes ekleyebilir
create policy "blog_posts_insert" on public.blog_posts
  for insert to anon, authenticated with check (true);

-- UPDATE: herkes güncelleyebilir (USING + WITH CHECK açık)
create policy "blog_posts_update" on public.blog_posts
  for update to anon, authenticated
  using (true)
  with check (true);

-- DELETE: herkes silebilir
create policy "blog_posts_delete" on public.blog_posts
  for delete to anon, authenticated using (true);
