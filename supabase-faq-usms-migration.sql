-- USMS SSS (Sıkça Sorulan Sorular) Migration
-- faq_items tablosuna varsayılan profesyonel içerik eklenir.
-- Supabase Dashboard > SQL Editor'da çalıştırın.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM faq_items WHERE question = 'USMS tam olarak hangi yetkilere sahiptir?') THEN
    INSERT INTO faq_items (question, answer, sort_order) VALUES
    (
      'USMS tam olarak hangi yetkilere sahiptir?',
      'United States Marshals Service, federal mahkemelerin yürütme organıdır. Federal seviyede aranan kaçakları yakalama, tanık koruma operasyonlarını yönetme, mahkeme güvenliğini sağlama ve yüksek riskli federal mahkum transferlerini gerçekleştirme yetkisine sahiptir.',
      0
    ),
    (
      'USMS personeli ile yerel polis (LSPD) arasındaki fark nedir?',
      'LSPD yerel asayiş ve trafikle ilgilenirken, USMS doğrudan federal yargıya bağlıdır. Bizim odak noktamız mahkeme emirleri, kaçak federal suçlular ve adalet sisteminin güvenliğidir. Yerel polisin yetkisini aşan federal durumlarda devreye gireriz.',
      1
    ),
    (
      'USMS bünyesine katılmak için şartlar nelerdir?',
      'Adayların öncelikle disiplin yönetmeliğine ve emir-komuta zincirine mutlak sadakat göstermesi gerekir. Hukuk bilgisi, operasyonel kabiliyet ve profesyonel rol yapma yeteneği öncelikli kriterlerimizdir. Başvurular site üzerinden veya mülakat yoluyla alınmaktadır.',
      2
    ),
    (
      'Tanık Koruma Programı (WITSEC) nasıl işler?',
      'Önemli davalarda hayatı tehlikede olan tanıklar, USMS koruması altına alınır. Bu süreçte tanıkların güvenliği, kimlik gizliliği ve güvenli yaşam alanlarının tesisi tamamen bizim sorumluluğumuzdadır. Operasyon gizliliği esastır.',
      3
    ),
    (
      'Federal bir operasyona sivil olarak müdahale edebilir miyim?',
      'Hayır. Federal operasyonlar gizlidir ve sivil müdahalesi hem operasyon güvenliğini tehlikeye atar hem de ciddi hukuki yaptırımlara yol açar. Operasyon alanlarında personelin talimatlarına uymak zorunludur.',
      4
    ),
    (
      'Rütbe sistemi ve terfi süreci nasıldır?',
      'Rütbe yapımız Recruit (Cadet) seviyesinden başlar ve Director (Chief) seviyesine kadar uzanır. Terfiler; personelin operasyonel başarısı, disiplini, raporlama kalitesi ve birim içindeki liyakatine göre liderlik kadrosu tarafından belirlenir.',
      5
    );
  END IF;
END $$;
