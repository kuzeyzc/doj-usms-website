# Supabase Kurulum Rehberi

Siteyi tam CMS olarak kullanmak (belgeler, galeri, kurallar, SSS, başvurular, genel ayarlar) için Supabase kurulumu yapın.

## 1. Supabase Projesi Oluşturma

1. [supabase.com](https://supabase.com) adresine gidin
2. Yeni proje oluşturun
3. **Settings → API** bölümünden `Project URL` ve `anon public` key değerlerini kopyalayın

## 2. .env Dosyası

Proje kökünde `.env` dosyası oluşturun:

```
VITE_SUPABASE_URL=https://lrmghwlkruccbinolhnx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_ADMIN_PASSWORD=guclu_sifreniz

# Discord Webhook (başvuru bildirimi - isteğe bağlı)
VITE_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

## 3. Veritabanı Tabloları

**Sırayla** şu dosyaları SQL Editor'da çalıştırın:
1. `supabase-schema.sql` (belgeler tablosu)
2. `supabase-cms-schema.sql` (CMS tabloları)
3. `supabase-form-schema.sql` (dinamik form: form_config, form_scenario_questions, applications güncellemesi)

## 4. Storage Bucket

**documents** bucket (belgeler için):
1. Bucket adı: `documents`
2. Public: Evet
3. Allowed MIME types: Boş veya `application/pdf, image/png, image/jpeg`

**gallery** bucket (galeri için):
1. Bucket adı: `gallery`
2. Public: Evet
3. Allowed MIME types: Boş veya `image/*`

**warrants** bucket (Adli Talep delil görselleri için):
1. Bucket adı: `warrants`
2. Public: Evet
3. Allowed MIME types: `image/png`, `image/jpeg`, `image/jpg`, `image/webp`, `image/gif`

### Storage Policies (Önemli!)

Bucket oluşturduktan sonra **Storage → documents → Policies** bölümüne gidin ve şu politikaları ekleyin:

**Policy 1 - Yükleme:**
- Policy name: `Allow public uploads`
- Allowed operation: `INSERT`
- Target roles: `anon`
- Policy definition: `true` (veya boş bırakın)

**Policy 2 - Okuma:**
- Policy name: `Allow public read`
- Allowed operation: `SELECT`
- Target roles: `anon`
- Policy definition: `true`

Alternatif: **New policy** → **For full customization** → aşağıdaki SQL:

```sql
-- Yükleme izni
create policy "Allow public uploads" on storage.objects
for insert to anon with check (bucket_id = 'documents');

-- Okuma izni
create policy "Allow public read" on storage.objects
for select to anon using (bucket_id = 'documents');

-- Gallery bucket için aynı politikaları bucket_id = 'gallery' ile tekrarlayın
create policy "Allow gallery uploads" on storage.objects
for insert to anon with check (bucket_id = 'gallery');
create policy "Allow gallery read" on storage.objects
for select to anon using (bucket_id = 'gallery');
```

## 5. CMS Şeması ve Örnek Veriler

1. `supabase-cms-schema.sql` dosyasındaki SQL'i çalıştırın.
2. **İsteğe bağlı:** `supabase-seed-data.sql` dosyasını çalıştırarak Kurallar, SSS ve Hakkımızda sayfalarına profesyonel örnek metinler ekleyin (tablolar boşsa).

Bu dosyalar şunları oluşturur:
- site_settings (genel ayarlar, hero, misyon, hızlı erişim, footer)
- chain_of_command (komuta zinciri)
- rules + rule_items (kurallar)
- faq_items (SSS)
- gallery_items (galeri)
- applications (başvurular)

## 6. Admin Paneli Erişimi

- URL: `/admin`
- Şifre: `.env` dosyasındaki `VITE_ADMIN_PASSWORD` değeri (varsayılan: `doj2026`)
- Modüller: Dashboard, Genel Ayarlar, Komuta Zinciri, Belgeler, Kurallar, SSS, Galeri, Başvurular, **Form Editörü**

## Genel Ayarlar (Site Metinleri)

**Genel Ayarlar** (`/admin/settings`) sekmesinden şunları düzenleyebilirsiniz:
- **Hero**: Badge, slogan, alt yazı
- **Misyon**: "Misyonumuz Federal Hukuk Uygulama" ve paragraflar
- **Hızlı Erişim**: Başlık ve alt yazı
- **Footer**: İletişim başlığı, Discord etiketi, **Discord link metni** (ekranda görünen) ve **Discord link URL** (tıklanınca gidilen adres)

Mevcut kurulumlar için `supabase-site-config-migration.sql` dosyasını çalıştırarak quickLinks ve footer ayarlarını ekleyin.

## Form Editörü ve Discord Webhook

**Form Editörü** (`/admin/form-editor`):
- Kişisel bilgiler (İsim, Yaş, Discord, Hex ID) alanlarını açıp kapatın
- Deneyim & Motivasyon bölümünün başlık ve açıklamalarını düzenleyin
- Senaryo soruları ekleyin, silin veya sıralayın (silinen soruların eski cevapları arşivde korunur)

**Discord Webhook**: Belge, başvuru ve adli talep bildirimleri Discord'a gönderilir. Discord API tarayıcıdan doğrudan çağrılamaz (CORS), bu yüzden sunucu tarafı proxy kullanılır.

**Vercel ile deploy:** Proje Vercel'e deploy edildiğinde `api/discord-webhook.ts` otomatik olarak çalışır. Ek ayar gerekmez.

**Alternatif - Supabase Edge Function:** Vercel kullanmıyorsanız:
   ```bash
   supabase functions deploy discord-webhook-proxy
   ```

**İsteğe bağlı - Webhook URL'lerini özelleştirin:**
- **Vercel:** Dashboard → Project → Settings → Environment Variables → `DISCORD_WEBHOOK_DOCUMENTS`, `DISCORD_WEBHOOK_APPLICATIONS` vb.
- **Supabase:** Dashboard → Edge Functions → discord-webhook-proxy → Secrets:
   - `DISCORD_WEBHOOK_DOCUMENTS` – Belge bildirimleri (varsayılan: DOJ Belge kanalı)
   - `DISCORD_WEBHOOK_APPLICATIONS` – Yeni başvurular
   - `DISCORD_WEBHOOK_APPLICATIONS_APPROVED` – Başvuru onay bildirimi
   - `DISCORD_WEBHOOK_WARRANTS` – Adli talep bildirimleri

   Varsayılan webhook URL'leri kodda tanımlıdır; farklı kanallar için bu secret'ları ayarlayın.

## Sorun Giderme: "Dosya yükleme başarısız" / HTTP 400

1. **Storage → documents bucket → Configuration** bölümüne gidin
2. **Allowed MIME types** alanını kontrol edin:
   - Boşsa tüm türlere izin verir
   - Doluysa `application/pdf`, `image/png`, `image/jpeg` ekleyin
3. **Storage Policies**'in doğru olduğundan emin olun (yukarıdaki SQL ile)
4. Bucket'ı silip yeniden oluşturmayı deneyin (Public + boş MIME kısıtlaması ile)

## Supabase Olmadan Kullanım (Fallback)

Supabase yapılandırılmazsa:

- Belgeler `public/documents.json` dosyasından okunur
- Dosyalar `public/documents/` klasörüne koyulur
- Admin paneli devre dışı kalır (yeni belge eklenemez)
