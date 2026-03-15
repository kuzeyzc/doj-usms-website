-- Discord alanını "Discord ID" olarak güncelle (etiketleme için sayısal ID gerekli)
-- Supabase Dashboard > SQL Editor'da çalıştırın.

UPDATE form_config
SET value = jsonb_set(
  jsonb_set(value, '{personal,discord,label}', '"Discord ID"'),
  '{personal,discord,placeholder}',
  '"Discord''da sağ tık > ID''yi Kopyala (17-19 haneli sayı)"'
)
WHERE key = 'personal'
  AND value->'personal'->'discord' IS NOT NULL;
