-- Blog slug: başlıktan URL dostu slug
alter table public.blog_posts add column if not exists slug text;

-- Mevcut kayıtlar için slug üret (Türkçe karakter desteği)
with base as (
  select
    id,
    title,
    created_at,
    coalesce(
      nullif(
        regexp_replace(
          regexp_replace(
            lower(translate(
              regexp_replace(trim(title), '\s+', '-', 'g'),
              'çğıöşüÇĞİÖŞÜ',
              'cgiiosuCGIIOSU'
            )),
            '[^a-z0-9-]',
            '',
            'g'
          ),
          '-+',
          '-',
          'g'
        ),
        ''
      ),
      'blog'
    ) as base_slug
  from public.blog_posts
),
numbered as (
  select id, base_slug,
    row_number() over (partition by base_slug order by created_at) as rn
  from base
)
update public.blog_posts bp
set slug = n.base_slug || case when n.rn > 1 then '-' || n.rn else '' end
from numbered n
where bp.id = n.id;

alter table public.blog_posts alter column slug set not null;
create unique index if not exists blog_posts_slug_key on public.blog_posts(slug);
