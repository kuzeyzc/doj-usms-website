-- DOJ Marshals CMS - Tam Veritabanı Şeması
-- Supabase Dashboard > SQL Editor'da çalıştırın.

-- 1. Genel Ayarlar (key-value)
create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Varsayılan ayarlar
insert into site_settings (key, value) values
  ('general', '{"siteName":"U.S. MARSHALS","slogan":"Justice. Integrity. Service.","heroBadge":"United States Marshals Service","heroSubtitle":"United States Marshals Service, San Andreas Bölgesi''nin en köklü federal yasa uygulama birimidir.","aboutTitle":"TARİHÇE & MİSYON","aboutP1":"U.S. Marshals Service, 1789''da kurulan Amerika Birleşik Devletleri''nin en eski federal yasa uygulama ajansıdır.","aboutP2":"Birimiz, profesyonellik, disiplin ve adalet ilkeleri doğrultusunda faaliyet gösterir.","aboutP3":"Department of Justice (Adalet Bakanlığı) bünyesinde faaliyet gösteren birimiz, federal hukuk uygulamasının temel direğidir.","footerDesc":"District of San Andreas. Adalet, Dürüstlük ve Hizmet ilkeleriyle görev yapan federal yasa uygulama birimi.","footerCopyright":"© 2026 U.S. Marshals Service — District of San Andreas | FiveM Roleplay"}'),
  ('values', '{"justice":{"title":"Dürüstlük","text":"Görevlerimizi en yüksek etik standartlarda ve şeffaflıkla yerine getiririz. Her kararımız hesap verebilir olmalıdır."},"integrity":{"title":"Sadakat","text":"Birime, yasalara ve adalet ilkelerine bağlılık temel taahhütümüzdür. Federal hukukun uygulanmasında taviz vermeyiz."},"service":{"title":"Cesaret & Tarafsızlık","text":"Zorlu koşullarda kararlılık ve cesaret sergileriz. Tüm işlemlerimizde tarafsızlık ve objektiflik esastır."}}'),
  ('mission', '{"label":"Misyonumuz","title":"Federal Hukuk Uygulama","p1":"San Andreas genelinde adaleti tesis etmek ve federal yasaları tavizsiz uygulamak.","p2":"Birim olarak, yüksek standartlarda profesyonellik, adalet ve toplum güvenliği ilkeleriyle hareket ediyoruz.","p3":"Kadromuza katılmak, sadece bir unvan değil; bir sorumluluk ve onurdur."}'),
  ('quickLinks', '{"title":"Hızlı Erişim","subtitle":"İhtiyacınız Olan Her Şey"}'),
  ('footer', '{"contactTitle":"İletişim","discordLabel":"Discord Sunucusu","discordText":"discord.gg/usmarshals","discordUrl":"https://discord.gg/usmarshals"}')
on conflict (key) do nothing;

alter table site_settings enable row level security;
drop policy if exists "site_settings_public_read" on site_settings;
drop policy if exists "site_settings_anon_all" on site_settings;
create policy "site_settings_public_read" on site_settings for select using (true);
create policy "site_settings_anon_all" on site_settings for all using (true);

-- 2. Komuta Zinciri
create table if not exists chain_of_command (
  id uuid default gen_random_uuid() primary key,
  rank text not null,
  name text default '—',
  description text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table chain_of_command enable row level security;
drop policy if exists "chain_public_read" on chain_of_command;
drop policy if exists "chain_anon_all" on chain_of_command;
create policy "chain_public_read" on chain_of_command for select using (true);
create policy "chain_anon_all" on chain_of_command for all using (true);

-- 3. Kurallar (kategori + maddeler)
create table if not exists rules (
  id uuid default gen_random_uuid() primary key,
  category text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists rule_items (
  id uuid default gen_random_uuid() primary key,
  rule_id uuid references rules(id) on delete cascade,
  item_id text not null,
  content text not null,
  sort_order int default 0
);

alter table rules enable row level security;
alter table rule_items enable row level security;
drop policy if exists "rules_public_read" on rules;
drop policy if exists "rules_anon_all" on rules;
drop policy if exists "rule_items_public_read" on rule_items;
drop policy if exists "rule_items_anon_all" on rule_items;
create policy "rules_public_read" on rules for select using (true);
create policy "rules_anon_all" on rules for all using (true);
create policy "rule_items_public_read" on rule_items for select using (true);
create policy "rule_items_anon_all" on rule_items for all using (true);

-- 4. SSS
create table if not exists faq_items (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  answer text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table faq_items enable row level security;
drop policy if exists "faq_public_read" on faq_items;
drop policy if exists "faq_anon_all" on faq_items;
create policy "faq_public_read" on faq_items for select using (true);
create policy "faq_anon_all" on faq_items for all using (true);

-- 5. Galeri
create table if not exists gallery_items (
  id uuid default gen_random_uuid() primary key,
  image_url text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table gallery_items enable row level security;
drop policy if exists "gallery_public_read" on gallery_items;
drop policy if exists "gallery_anon_all" on gallery_items;
create policy "gallery_public_read" on gallery_items for select using (true);
create policy "gallery_anon_all" on gallery_items for all using (true);

-- 6. Başvurular
create table if not exists applications (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  discord text not null,
  fivem_id text not null,
  age text not null,
  experience text,
  reason text not null,
  scenario text not null,
  created_at timestamptz default now()
);

alter table applications enable row level security;
drop policy if exists "applications_anon_insert" on applications;
drop policy if exists "applications_anon_select" on applications;
create policy "applications_anon_insert" on applications for insert with check (true);
create policy "applications_anon_select" on applications for select using (true);

-- 7. Documents tablosu zaten mevcut (supabase-schema.sql)
-- Storage: documents (mevcut), gallery (yeni bucket)
--
-- Gallery bucket: Storage > New bucket > "gallery", Public: Yes
-- Policies: Allow public uploads (insert), Allow public read (select)
-- Bucket "gallery" oluşturun, public, MIME: image/*
