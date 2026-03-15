-- server_stats tablosu: Başsavcı ve USMS aktiflik sayaçları
-- Supabase SQL Editor'da çalıştırın.
-- Not: Mevcut tablo varsa silinip yeniden oluşturulur (eski şema uyumsuzsa).

drop table if exists server_stats;

create table server_stats (
  id text primary key default 'default',
  savci_count int not null default 0,
  usms_count int not null default 0,
  updated_at timestamptz default now()
);

-- Varsayılan satır (tek satır)
insert into server_stats (id, savci_count, usms_count) values ('default', 0, 0)
on conflict (id) do nothing;

alter table server_stats enable row level security;
drop policy if exists "server_stats_public_read" on server_stats;
drop policy if exists "server_stats_anon_all" on server_stats;
create policy "server_stats_public_read" on server_stats for select using (true);
create policy "server_stats_anon_all" on server_stats for all using (true);
