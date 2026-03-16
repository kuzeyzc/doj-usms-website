-- Personel Yönetim Sistemi: ranks + profiles
-- Rütbe tabanlı, rozet numaralı, tek seferlik aktivasyonlu sistem

-- 1. ranks tablosu
create table if not exists public.ranks (
  id uuid default gen_random_uuid() primary key,
  rank_name text not null unique,
  badge_prefix smallint not null check (badge_prefix >= 1 and badge_prefix <= 9),
  is_admin boolean not null default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 2. profiles tablosu (auth.users ile 1:1)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  ic_name text,
  badge_number text,
  rank_id uuid references public.ranks(id) on delete restrict,
  is_registered boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Mevcut profiles tablosuna eksik sütunları ekle (tablo başka migration'dan gelmişse)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='badge_number') then
    alter table public.profiles add column badge_number text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='ic_name') then
    alter table public.profiles add column ic_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='rank_id') then
    alter table public.profiles add column rank_id uuid references public.ranks(id) on delete restrict;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='is_registered') then
    alter table public.profiles add column is_registered boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='updated_at') then
    alter table public.profiles add column updated_at timestamptz default now();
  end if;
end $$;

-- badge_format constraint (yoksa ekle)
alter table public.profiles drop constraint if exists badge_format;
alter table public.profiles add constraint badge_format check (badge_number is null or badge_number ~ '^[0-9]{3}$');

-- Rozet numarası benzersizliği (null hariç)
create unique index if not exists profiles_badge_number_unique on public.profiles (badge_number) where badge_number is not null;

-- 3. Varsayılan rütbeler
insert into public.ranks (rank_name, badge_prefix, is_admin, sort_order) values
  ('Başsavcı', 1, true, 0),
  ('Chief Marshal', 2, true, 1),
  ('Admin', 3, true, 2),
  ('Supervisory Deputy', 4, false, 3),
  ('Senior Deputy', 5, false, 4),
  ('Deputy Marshal', 6, false, 5)
on conflict (rank_name) do nothing;

-- 4. auth.users oluşturulduğunda otomatik profile ekleme (trigger için gerekli: rank_id)
-- Not: Admin panelinden kullanıcı oluşturulurken profile da oluşturulacak (Edge Function veya app logic)

-- 5. RLS politikaları

-- ranks: Herkes okuyabilir, sadece admin rütbeli personel yazabilir
alter table public.ranks enable row level security;

drop policy if exists "ranks_select_all" on public.ranks;
create policy "ranks_select_all" on public.ranks for select to authenticated using (true);

drop policy if exists "ranks_admin_all" on public.ranks;
create policy "ranks_admin_all" on public.ranks for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.ranks r on r.id = p.rank_id
      where p.id = auth.uid() and r.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      join public.ranks r on r.id = p.rank_id
      where p.id = auth.uid() and r.is_admin = true
    )
  );

-- profiles: Kendi profilini okuyabilir; admin tüm profilleri okuyup yönetebilir
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.ranks r on r.id = p.rank_id
      where p.id = auth.uid() and r.is_admin = true
    )
  );

-- Kendi profilini güncelleyebilir (sadece kayıt aktivasyonu: ic_name, badge_number, is_registered)
-- Sadece is_registered = false iken güncelleme yapılabilir (tek seferlik)
drop policy if exists "profiles_update_own_activation" on public.profiles;
create policy "profiles_update_own_activation" on public.profiles for update to authenticated
  using (id = auth.uid() and is_registered = false)
  with check (id = auth.uid());

-- Admin tüm profilleri güncelleyebilir (rank değişimi vb.)
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.ranks r on r.id = p.rank_id
      where p.id = auth.uid() and r.is_admin = true
    )
  );

-- Sadece admin insert yapabilir (yeni personel oluşturma - Edge Function veya service role ile)
drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin" on public.profiles for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      join public.ranks r on r.id = p.rank_id
      where p.id = auth.uid() and r.is_admin = true
    )
  );

-- 6. updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 7. Mevcut badge numaralarını kontrol eden fonksiyon (aktivasyon formunda kullanım)
create or replace function public.is_badge_available(p_badge text)
returns boolean as $$
begin
  return not exists (select 1 from public.profiles where badge_number = p_badge);
end;
$$ language plpgsql security definer;

-- RPC çağrısı için izin
grant execute on function public.is_badge_available(text) to authenticated;

-- 8. Rütbe prefix'ine göre geçerli rozet aralığı
-- badge_prefix 5 ise: 500-599 geçerli
