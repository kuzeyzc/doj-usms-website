-- Çoklu sayfa belge desteği: file_urls jsonb sütunu
-- Supabase SQL Editor'da çalıştırın.

alter table documents add column if not exists file_urls jsonb default null;

-- file_urls: ["url1", "url2", "url3"] - birden fazla sayfa/görsel
-- file_url: ilk sayfa (geriye dönük uyumluluk için)
