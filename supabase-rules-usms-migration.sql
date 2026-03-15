-- USMS Kuralları Migration
-- rules tablosuna title ve content sütunları eklenir, varsayılan veriler işlenir.
-- Supabase Dashboard > SQL Editor'da çalıştırın.

-- 1. Sütunları ekle (varsa atla)
ALTER TABLE rules ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE rules ADD COLUMN IF NOT EXISTS content text;

-- 2. Mevcut category'yi title'a kopyala (eski veriler için)
UPDATE rules SET title = category WHERE title IS NULL AND category IS NOT NULL;

-- 3. Varsayılan USMS kurallarını ekle (sadece henüz yoksa)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rules WHERE title = '1 - USMS Nedir?') THEN
    INSERT INTO rules (category, title, content, sort_order) VALUES
    ('usms_intro', '1 - USMS Nedir?', 'United States Marshals Service, ABD''de federal mahkemelerin ve federal adalet sisteminin uygulayıcı gücüdür. Federal mahkeme emirlerini yerine getirir ve ülke çapında operasyonlar yürütür. Federal seviyede kaçak suçluları yakalayan ve yüksek riskli operasyonlar yapan elit adalet birimidir.', 0),
    ('usms_duties', '2 - USMS''in Ana Görevleri', 'Kaçak suçluları yakalama (Fugitive Operations):
a. Federal veya eyalet tarafından aranan suçluları yakalamak.
b. High-risk arrest operasyonları.

Tanık Koruma Programı:
a. Önemli davalardaki tanıkları korur.
b. Kimlik değişimi ve güvenli yaşam sağlar.

Mahkeme Güvenliği:
a. Federal mahkemeleri korur.
b. Hakimleri ve savcıları korur.

Mahkum Taşıma:
a. Federal mahkumların hapishane, mahkeme ve başka eyaletler arasında transferini sağlar.

Özel Operasyonlar:
a. Kaçak çocuk vakaları.
b. Organize suç operasyonları.
c. Federal görev destekleri.', 1),
    ('usms_roleplay', '3 - USMS Nasıl Rol Yapmalıdır', 'USMS elit federal birim gibi oynanır. Tipik görevler şunlardır:

High Risk Warrant: Ağır suçlu yakalama operasyonu

Fugitive Task Force: Kaçak suçlu avı

Witness Protection: Tanık koruma

Prisoner Transport: Mahkum taşıma

Federal Investigation Support: FBI veya DOJ ile ortak operasyon

Court Security: Mahkemenin koruması', 2),
    ('usms_ranks', '4 - USMS İçindeki Tipik Rütbeler', 'Director (Birim Başkanı - Chief)

Chief Deputy (Denetleyici - Supervisor / Teğmen)

Supervisory Deputy Marshal (Kıdemli Denetleyici - Deputy Marshal / Çavuş)

Deputy Marshal (Saha Sorumlusu - Memur Şefi)

Special Deputy (Kıdemli Saha Personeli - Kıdemli Marshal)

Task Force Officer (Operasyon Personeli - Marshal)

Recruit / Trainee (Aday Personel - Cadet)', 3),
    ('usms_ic', '5 - USMS IC Kuralları', 'Genel İlkeler: Disiplin, Emir komuta zinciri ve Üst rütbeye saygı esastır.

Operasyon Kuralları:
a. Tek başına baskın (raid) yapılamaz.
b. Tüm operasyonlar planlı olmalıdır.

Güç Kullanımı:
a. Ölümcül güç sadece son çare olarak ve gerektiğinde kullanılır.

Gizlilik:
a. Federal operasyonlar her zaman gizli tutulur.', 4);
  END IF;
END $$;
