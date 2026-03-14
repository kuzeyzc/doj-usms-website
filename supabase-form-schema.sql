-- Dinamik Başvuru Formu Şeması
-- supabase-cms-schema.sql sonrasında çalıştırın.

-- 1. Form Konfigürasyonu (kişisel alanlar, deneyim bölümü)
create table if not exists form_config (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz default now()
);

insert into form_config (key, value) values
  ('personal', '{"name":{"enabled":true,"label":"İsim","placeholder":"Oyun içi isminiz"},"age":{"enabled":true,"label":"Yaş","placeholder":"18+"},"discord":{"enabled":true,"label":"Discord Adı","placeholder":"kullanıcı#0000"},"hexId":{"enabled":true,"label":"Hex ID","placeholder":"Steam/FiveM ID"}}'),
  ('experience', '{"title":"Deneyim & Motivasyon","reasonLabel":"Neden US Marshal Olmak İstiyorsunuz?","reasonPlaceholder":"Motivasyonunuzu açıklayın...","experienceLabel":"RP Deneyimi","experienceOptions":["Başlangıç (0-6 ay)","Orta (6-12 ay)","Deneyimli (1-2 yıl)","Uzman (2+ yıl)"]}')
on conflict (key) do nothing;

alter table form_config enable row level security;
drop policy if exists "form_config_public_read" on form_config;
drop policy if exists "form_config_anon_all" on form_config;
create policy "form_config_public_read" on form_config for select using (true);
create policy "form_config_anon_all" on form_config for all using (true);

-- 2. Senaryo Soruları (soft delete - deleted_at ile arşiv korunur)
create table if not exists form_scenario_questions (
  id uuid default gen_random_uuid() primary key,
  question_text text not null,
  min_chars int default 50,
  sort_order int default 0,
  deleted_at timestamptz default null,
  created_at timestamptz default now()
);

alter table form_scenario_questions enable row level security;
drop policy if exists "scenario_public_read" on form_scenario_questions;
drop policy if exists "scenario_anon_insert" on form_scenario_questions;
drop policy if exists "scenario_anon_update" on form_scenario_questions;
create policy "scenario_public_read" on form_scenario_questions for select using (deleted_at is null);
create policy "scenario_anon_insert" on form_scenario_questions for insert with check (true);
create policy "scenario_anon_update" on form_scenario_questions for update using (true);

-- Varsayılan senaryo sorusu
insert into form_scenario_questions (question_text, min_chars, sort_order)
select 'Bir tutuklama operasyonu sırasında şüpheli ateşli silah çekiyor. Bu durumda ne yaparsınız?', 100, 0
where not exists (select 1 from form_scenario_questions limit 1);

-- 3. Applications tablosunu güncelle (status + scenario_answers jsonb)
alter table applications add column if not exists status text default 'pending' check (status in ('pending','approved','rejected'));
alter table applications add column if not exists scenario_answers jsonb default '{}';
alter table applications alter column scenario drop not null;

-- Eski scenario sütununu koru (migration), yeni başvurular scenario_answers kullanacak
-- scenario_answers: { "question_id": "cevap", ... } - silinen soruların cevapları da burada kalır
drop policy if exists "applications_anon_update" on applications;
create policy "applications_anon_update" on applications for update using (true);
