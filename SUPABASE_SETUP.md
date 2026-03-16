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

**Discord Webhook**: `.env` dosyasına `VITE_DISCORD_WEBHOOK_URL` ekleyerek başvuruların Discord kanalına embed olarak gönderilmesini sağlayın. Webhook URL'si: Discord sunucunuzda kanal ayarları → Entegrasyonlar → Webhook oluştur.

## Sorun Giderme: "Dosya yükleme başarısız" / HTTP 400

1. **Storage → documents bucket → Configuration** bölümüne gidin
2. **Allowed MIME types** alanını kontrol edin:
   - Boşsa tüm türlere izin verir
   - Doluysa `application/pdf`, `image/png`, `image/jpeg` ekleyin
3. **Storage Policies**'in doğru olduğundan emin olun (yukarıdaki SQL ile)
4. Bucket'ı silip yeniden oluşturmayı deneyin (Public + boş MIME kısıtlaması ile)

## 7. Personel Yönetim Sistemi (ranks + profiles)

### Migration

Sırayla şu migration dosyalarını SQL Editor'da çalıştırın:

1. `supabase/migrations/20250316000007_personnel_system.sql` – Bu migration:
- `ranks` tablosu (rütbe adı, rozet prefix, is_admin)
- `profiles` tablosu (auth.users ile 1:1, ic_name, badge_number, rank_id, is_registered)
- RLS politikaları (sadece admin rütbeli personel ranks/profiles yönetebilir)
- Varsayılan rütbeler: Başsavcı, Chief Marshal, Admin, Supervisory Deputy, Senior Deputy, Deputy Marshal

2. `supabase/migrations/20250316000008_create_profile_rpc.sql` – Manuel personel ekleme için RPC fonksiyonu (Edge Function olmadan kullanım)

3. `supabase/migrations/20250316000009_ranks_rpc.sql` – Rütbe ekleme/düzenleme/silme için RPC fonksiyonları (admin panelinde rütbe yönetimi için)

### İlk Admin Hesabı (Bootstrap)

1. **Supabase Dashboard** → **Authentication** → **Users** → **Add user**
2. Email ve şifre ile yeni kullanıcı oluşturun
3. Oluşturulan kullanıcının **UUID**'sini kopyalayın
4. **SQL Editor**'da şu sorguyu çalıştırın (UUID'yi değiştirin):

```sql
-- ÖNEMLİ: UUID mutlaka tek tırnak içinde olmalı! Örn: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
insert into public.profiles (id, rank_id, is_registered)
values (
  'BURAYA-UUID-YAPIŞTIR',  -- Kendi UUID'nizi tırnakların İÇİNE yapıştırın: 'b5c95c93-c323-4688-963d-a39c3f5781e0'
  (select id from public.ranks where is_admin = true order by sort_order limit 1),
  true
);
```

5. Bu kullanıcı artık admin paneline giriş yapabilir ve yeni personel oluşturabilir.

### Personel Oluşturma (2 Yöntem)

**Yöntem A – Manuel (Edge Function olmadan):**

1. **Supabase Dashboard** → **Authentication** → **Users** → **Add user** (e-posta + şifre)
2. Oluşturulan kullanıcının **UUID**'sini kopyalayın
3. Admin paneli → **Personel Oluştur** → "Manuel Ekleme" bölümüne UUID ve rütbe girip **Profil Oluştur** butonuna tıklayın
4. `supabase/migrations/20250316000008_create_profile_rpc.sql` migration'ını çalıştırdığınızdan emin olun

**Yöntem B – Edge Function (tek adımda e-posta + şifre + rütbe):**

1. **Supabase CLI** kurun: `npm i -g supabase`
2. Proje kökünde: `supabase login` ve `supabase link`
3. Edge Function deploy: `supabase functions deploy create-personnel`
4. Bu yöntemle admin panelinden doğrudan e-posta, şifre ve rütbe ile personel oluşturabilirsiniz

### Supabase Auth Ayarları

**Authentication** → **Providers** → **Email**:
- **Enable Email provider** – Açık olmalı
- **Enable email signups** – Açık olmalı (kapalıysa "Email logins are disabled" hatası alırsınız)
- **Confirm email** – İsteğe bağlı kapatın (admin oluşturulan kullanıcılar hemen giriş yapabilsin)

**"Email logins are disabled" hatası:** Bu hata genelde "Enable email signups" kapalı olduğunda görülür. Hem yeni kayıt hem de mevcut kullanıcı girişi için bu ayarın açık olması gerekir.

## Supabase Olmadan Kullanım (Fallback)

Supabase yapılandırılmazsa:

- Belgeler `public/documents.json` dosyasından okunur
- Dosyalar `public/documents/` klasörüne koyulur
- Admin paneli devre dışı kalır (yeni belge eklenemez)
