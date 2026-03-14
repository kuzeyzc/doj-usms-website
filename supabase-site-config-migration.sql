-- Mevcut kurulumlar için: quickLinks ve footer ayarlarını ekle
-- Supabase SQL Editor'da çalıştırın (supabase-cms-schema.sql zaten çalıştırıldıysa).

insert into site_settings (key, value) values
  ('quickLinks', '{"title":"Hızlı Erişim","subtitle":"İhtiyacınız Olan Her Şey"}'),
  ('footer', '{"contactTitle":"İletişim","discordLabel":"Discord Sunucusu","discordText":"discord.gg/usmarshals","discordUrl":"https://discord.gg/usmarshals"}')
on conflict (key) do nothing;
