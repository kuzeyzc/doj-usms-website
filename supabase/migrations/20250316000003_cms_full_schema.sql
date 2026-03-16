-- DOJ Marshals CMS - Tam Veritabanı Şeması
-- Admin panelindeki boş verileri düzeltmek için bu migration'ı çalıştırın.
-- Supabase Dashboard > SQL Editor'da çalıştırın.

-- 1. site_settings (Genel ayarlar, hero, misyon, footer)
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz default now()
);

insert into public.site_settings (key, value) values
  ('general', '{"siteName":"U.S. MARSHALS","slogan":"Justice. Integrity. Service.","heroBadge":"United States Marshals Service","heroSubtitle":"United States Marshals Service, San Andreas Bölgesi''nin en köklü federal yasa uygulama birimidir.","aboutTitle":"TARİHÇE & MİSYON","aboutP1":"U.S. Marshals Service, 1789''da kurulan Amerika Birleşik Devletleri''nin en eski federal yasa uygulama ajansıdır.","aboutP2":"Birimiz, profesyonellik, disiplin ve adalet ilkeleri doğrultusunda faaliyet gösterir.","aboutP3":"Department of Justice (Adalet Bakanlığı) bünyesinde faaliyet gösteren birimiz, federal hukuk uygulamasının temel direğidir.","footerDesc":"District of San Andreas. Adalet, Dürüstlük ve Hizmet ilkeleriyle görev yapan federal yasa uygulama birimi.","footerCopyright":"© 2026 U.S. Marshals Service — District of San Andreas | FiveM Roleplay"}'),
  ('values', '{"justice":{"title":"Dürüstlük","text":"Görevlerimizi en yüksek etik standartlarda ve şeffaflıkla yerine getiririz."},"integrity":{"title":"Sadakat","text":"Birime, yasalara ve adalet ilkelerine bağlılık temel taahhütümüzüdür."},"service":{"title":"Cesaret & Tarafsızlık","text":"Zorlu koşullarda kararlılık ve cesaret sergileriz."}}'),
  ('mission', '{"label":"Misyonumuz","title":"Federal Hukuk Uygulama","p1":"San Andreas genelinde adaleti tesis etmek ve federal yasaları tavizsiz uygulamak.","p2":"Birim olarak, yüksek standartlarda profesyonellik, adalet ve toplum güvenliği ilkeleriyle hareket ediyoruz.","p3":"Kadromuza katılmak, sadece bir unvan değil; bir sorumluluk ve onurdur."}'),
  ('quickLinks', '{"title":"Hızlı Erişim","subtitle":"İhtiyacınız Olan Her Şey"}'),
  ('footer', '{"contactTitle":"İletişim","discordLabel":"Discord Sunucusu","discordText":"discord.gg/usmarshals","discordUrl":"https://discord.gg/usmarshals"}'),
  ('heroStats', '{"agents_count":42,"operations_count":1847,"founded_year":1789}')
on conflict (key) do nothing;

alter table public.site_settings enable row level security;
drop policy if exists "site_settings_select" on public.site_settings;
drop policy if exists "site_settings_all" on public.site_settings;
create policy "site_settings_select" on public.site_settings for select to anon, authenticated using (true);
create policy "site_settings_all" on public.site_settings for all to anon, authenticated using (true);

-- 2. form_config (Başvuru formu ayarları)
create table if not exists public.form_config (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz default now()
);

insert into public.form_config (key, value) values
  ('personal', '{"name":{"enabled":true,"label":"İsim","placeholder":"Oyun içi isminiz"},"age":{"enabled":true,"label":"Yaş","placeholder":"18+"},"discord":{"enabled":true,"label":"Discord Adı","placeholder":""},"discordId":{"enabled":true,"label":"Discord Kullanıcı ID","placeholder":""},"hexId":{"enabled":true,"label":"Hex ID","placeholder":"Steam/FiveM ID"}}'),
  ('experience', '{"title":"Deneyim & Motivasyon","reasonLabel":"Neden US Marshal Olmak İstiyorsunuz?","reasonPlaceholder":"Motivasyonunuzu açıklayın...","experienceLabel":"RP Deneyimi","experienceOptions":["Başlangıç (0-6 ay)","Orta (6-12 ay)","Deneyimli (1-2 yıl)","Uzman (2+ yıl)"]}')
on conflict (key) do nothing;

alter table public.form_config enable row level security;
drop policy if exists "form_config_select" on public.form_config;
drop policy if exists "form_config_all" on public.form_config;
create policy "form_config_select" on public.form_config for select to anon, authenticated using (true);
create policy "form_config_all" on public.form_config for all to anon, authenticated using (true);

-- 3. chain_of_command
create table if not exists public.chain_of_command (
  id uuid default gen_random_uuid() primary key,
  rank text not null,
  name text default '—',
  description text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.chain_of_command enable row level security;
drop policy if exists "chain_select" on public.chain_of_command;
drop policy if exists "chain_all" on public.chain_of_command;
create policy "chain_select" on public.chain_of_command for select to anon, authenticated using (true);
create policy "chain_all" on public.chain_of_command for all to anon, authenticated using (true);

-- 4. rules + rule_items
create table if not exists public.rules (
  id uuid default gen_random_uuid() primary key,
  category text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.rule_items (
  id uuid default gen_random_uuid() primary key,
  rule_id uuid references public.rules(id) on delete cascade,
  item_id text not null,
  content text not null,
  sort_order int default 0
);

alter table public.rules enable row level security;
alter table public.rule_items enable row level security;
drop policy if exists "rules_select" on public.rules;
drop policy if exists "rules_all" on public.rules;
drop policy if exists "rule_items_select" on public.rule_items;
drop policy if exists "rule_items_all" on public.rule_items;
create policy "rules_select" on public.rules for select to anon, authenticated using (true);
create policy "rules_all" on public.rules for all to anon, authenticated using (true);
create policy "rule_items_select" on public.rule_items for select to anon, authenticated using (true);
create policy "rule_items_all" on public.rule_items for all to anon, authenticated using (true);

-- 5. faq_items
create table if not exists public.faq_items (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  answer text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.faq_items enable row level security;
drop policy if exists "faq_select" on public.faq_items;
drop policy if exists "faq_all" on public.faq_items;
create policy "faq_select" on public.faq_items for select to anon, authenticated using (true);
create policy "faq_all" on public.faq_items for all to anon, authenticated using (true);

-- 6. gallery_items
create table if not exists public.gallery_items (
  id uuid default gen_random_uuid() primary key,
  image_url text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.gallery_items enable row level security;
drop policy if exists "gallery_select" on public.gallery_items;
drop policy if exists "gallery_all" on public.gallery_items;
create policy "gallery_select" on public.gallery_items for select to anon, authenticated using (true);
create policy "gallery_all" on public.gallery_items for all to anon, authenticated using (true);

-- 7. applications (eğer yoksa oluştur)
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  discord text not null,
  discord_id text,
  fivem_id text not null,
  age text not null,
  experience text,
  reason text not null,
  scenario text,
  scenario_answers jsonb default '{}',
  status text default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

-- Eski tablolar için eksik sütunları ekle
alter table public.applications add column if not exists discord_id text;
alter table public.applications add column if not exists scenario_answers jsonb default '{}';
alter table public.applications add column if not exists status text default 'pending';
alter table public.applications alter column scenario drop not null;

alter table public.applications enable row level security;
drop policy if exists "applications_insert" on public.applications;
drop policy if exists "applications_select" on public.applications;
drop policy if exists "applications_update" on public.applications;
create policy "applications_insert" on public.applications for insert to anon, authenticated with check (true);
create policy "applications_select" on public.applications for select to anon, authenticated using (true);
create policy "applications_update" on public.applications for update to anon, authenticated using (true);

-- 8. form_scenario_questions
create table if not exists public.form_scenario_questions (
  id uuid default gen_random_uuid() primary key,
  question_text text not null,
  min_chars int default 50,
  sort_order int default 0,
  deleted_at timestamptz default null,
  created_at timestamptz default now()
);

insert into public.form_scenario_questions (question_text, min_chars, sort_order)
select 'Bir tutuklama operasyonu sırasında şüpheli ateşli silah çekiyor. Bu durumda ne yaparsınız?', 100, 0
where not exists (select 1 from public.form_scenario_questions limit 1);

alter table public.form_scenario_questions enable row level security;
drop policy if exists "scenario_select" on public.form_scenario_questions;
drop policy if exists "scenario_insert" on public.form_scenario_questions;
drop policy if exists "scenario_update" on public.form_scenario_questions;
create policy "scenario_select" on public.form_scenario_questions for select to anon, authenticated using (true);
create policy "scenario_insert" on public.form_scenario_questions for insert to anon, authenticated with check (true);
create policy "scenario_update" on public.form_scenario_questions for update to anon, authenticated using (true);

-- 9. documents
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null check (category in ('case', 'announcement', 'protocol', 'sop', 'training', 'form')),
  date date not null default current_date,
  file_url text not null,
  file_type text not null check (file_type in ('pdf', 'png')),
  description text,
  created_at timestamptz default now()
);

alter table public.documents enable row level security;
drop policy if exists "documents_select" on public.documents;
drop policy if exists "documents_all" on public.documents;
create policy "documents_select" on public.documents for select to anon, authenticated using (true);
create policy "documents_all" on public.documents for all to anon, authenticated using (true);

-- 10. server_stats (id text primary key - tek satır formatı, supabase-server-stats ile uyumlu)
drop table if exists public.server_stats cascade;
create table public.server_stats (
  id text primary key default 'default',
  savci_count int not null default 0,
  usms_count int not null default 0,
  updated_at timestamptz default now()
);

insert into public.server_stats (id, savci_count, usms_count) values ('default', 1, 17)
on conflict (id) do nothing;

alter table public.server_stats enable row level security;
drop policy if exists "server_stats_select" on public.server_stats;
create policy "server_stats_select" on public.server_stats for select to anon, authenticated using (true);
