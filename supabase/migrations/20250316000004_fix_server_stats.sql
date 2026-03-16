-- server_stats hatasını düzelt (sadece bu dosyayı çalıştırın)
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
