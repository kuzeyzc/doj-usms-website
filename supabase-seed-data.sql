-- DOJ Marshals - Profesyonel Örnek Veriler (Seed)
-- Supabase SQL Editor'da çalıştırın. Tablolar boşsa bu veriler eklenecektir.

-- 1. Kurallar (sadece tablo boşsa)
INSERT INTO rules (category, sort_order)
SELECT * FROM (VALUES
  ('Genel Disiplin', 0),
  ('Kıyafet Yönetmeliği', 1),
  ('Silah Kullanımı', 2)
) AS v(category, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM rules LIMIT 1);

INSERT INTO rule_items (rule_id, item_id, content, sort_order)
SELECT r.id, v.item_id, v.content, v.ord
FROM rules r
JOIN (VALUES
  ('Genel Disiplin', '1.1', 'Operasyon sırasında telsiz disiplini esastır. Gereksiz konuşmalardan kaçınılmalıdır.', 0),
  ('Kıyafet Yönetmeliği', '2.1', 'Saha operasyonlarında standart US Marshal yeleği ve ekipman seti zorunludur.', 1),
  ('Silah Kullanımı', '3.1', 'Ateşli silah kullanımı sadece can güvenliği tehdidi altında ve kademeli güç kullanımı prosedürüne (Use of Force Continuum) uygun olmalıdır.', 2)
) AS v(cat, item_id, content, ord) ON r.category = v.cat
WHERE NOT EXISTS (SELECT 1 FROM rule_items LIMIT 1);

-- 2. SSS (sadece tablo boşsa)
INSERT INTO faq_items (question, answer, sort_order)
SELECT * FROM (VALUES
  ('Başvuru süreci ne kadar sürer?', 'Başvurunuz incelendikten sonra 48 saat içinde Discord üzerinden dönüş sağlanır.', 0),
  ('Deneyim şart mı?', 'Temel FiveM RP bilgisi şarttır, ancak özel eğitimler akademi birimimiz tarafından verilir.', 1),
  ('US Marshal olmak için ne kadar deneyim gerekiyor?', 'Sunucuda en az 2 haftalık aktif roleplay deneyimi gereklidir. Daha önce başka sunucularda deneyiminiz varsa bu bir avantajdır ancak zorunlu değildir.', 2),
  ('Eğitim süreci nasıl işliyor?', 'Kabul edilen adaylar bir haftalık temel eğitim programından geçer. Bu süre zarfında operasyon prosedürleri, iletişim protokolleri ve taktik eğitim verilir.', 3),
  ('Haftalık minimum aktivite gereksinimi var mı?', 'Evet, tüm ajanların haftada minimum 10 saat aktif görev yapması beklenir. Uzun süreli devamsızlıklarda izin formu doldurulmalıdır.', 4)
) AS v(question, answer, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM faq_items LIMIT 1);

-- 3. Misyon & Değerler (site_settings güncellemesi)
UPDATE site_settings SET value = jsonb_set(
  jsonb_set(value, '{title}', '"Federal Hukuk Uygulama"'),
  '{p1}', '"San Andreas genelinde adaleti tesis etmek ve federal yasaları tavizsiz uygulamak."'
) WHERE key = 'mission';

UPDATE site_settings SET value = '{
  "justice": {"title": "Dürüstlük", "text": "Görevlerimizi en yüksek etik standartlarda ve şeffaflıkla yerine getiririz. Her kararımız hesap verebilir olmalıdır."},
  "integrity": {"title": "Sadakat", "text": "Birime, yasalara ve adalet ilkelerine bağlılık temel taahhütümüzdür. Federal hukukun uygulanmasında taviz vermeyiz."},
  "service": {"title": "Cesaret & Tarafsızlık", "text": "Zorlu koşullarda kararlılık ve cesaret sergileriz. Tüm işlemlerimizde tarafsızlık ve objektiflik esastır."}
}'::jsonb WHERE key = 'values';
