-- Blog posts table for DOJ Marshals blog section
create table if not exists public.blog_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null default 'announcement',
  image_url text,
  content text not null default '',
  excerpt text,
  author text default 'USMS',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.blog_posts enable row level security;
drop policy if exists "blog_posts_select" on public.blog_posts;
drop policy if exists "blog_posts_all" on public.blog_posts;
create policy "blog_posts_select" on public.blog_posts for select to anon, authenticated using (true);
create policy "blog_posts_all" on public.blog_posts for all to anon, authenticated using (true);
