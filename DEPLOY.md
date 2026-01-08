# Misledi Dashboard - Yayına Alma (Deploy) Rehberi

Bu proje **Next.js (App Router)** ve **Prisma (PostgreSQL)** kullanılarak geliştirilmiştir. Projenin çalışabilmesi için yükleyeceğiniz sunucuda **Node.js** desteği olması şarttır.

Sadece HTML yükler gibi FTP'den atarak çalışmaz.

Aşağıda en popüler iki yöntem için adımlar bulunmaktadır.

---

## ⚠️ ÖNEMLİ: Veritabanı
Projeniz şu an bilgisayarınızdaki (Local) veritabanına bağlıdır. Sunucuya attığınızda siteniz bu veritabanına **erişemez**.

1. Hostinginizde bir **PostgreSQL** veritabanı oluşturun (veya Supabase/Neon gibi bulut hizmeti kullanın).
2. Size verilen bağlantı adresini (Connection String) bir kenara not edin.
   - Örnek: `postgres://kullanici:sifre@sunucu-adresi:5432/veritabani_adi`

---

## YÖNTEM 1: Vercel (En Kolay ve Ücretsiz)
*Next.js'in yaratıcısı Vercel, bu projeyi yayınlamanın en sorunsuz yoludur.*

1. Projenizi bir **GitHub** hesabına yükleyin (Push edin).
2. [Vercel.com](https://vercel.com) adresine gidin ve GitHub ile giriş yapın.
3. **"Add New Project"** butonuna basın ve GitHub'daki "misledi" projenizi seçin.
4. **Environment Variables** bölümüne şunları ekleyin:
   - `DATABASE_URL`: (Yukarıda oluşturduğunuz veritabanı adresi)
   - `ENCRYPTION_KEY`: (Lokaldeki .env dosyanızda yazan uzun şifreleme anahtarı)
5. **Deploy** butonuna basın.
6. Bitti! Vercel size otomatik bir alan adı (`misledi.vercel.app`) verecektir. Kendi alan adınızı da bağlayabilirsiniz.

---

## YÖNTEM 2: cPanel / Hosting (Node.js Destekli)
*Eğer kendi hostinginizi kullanacaksanız, hosting panelinizde "Node.js App" veya "Setup Node.js App" menüsü olduğundan emin olun.*

### 1. Hazırlık (Lokal Bilgisayarınızda)
1. Terminali açın ve projeyi derleyin:
   ```bash
   npm run build
   ```
2. Derleme bitince şu dosyaları/klasörleri seçip bir **ZIP** yapın:
   - `.next` (Klasör - Gizli olabilir)
   - `public` (Klasör)
   - `prisma` (Klasör - Veritabanı şeması için önemli)
   - `package.json`
   - `next.config.js`
   - `scripts` (Klasör - API anahtarlarını yüklemek isterseniz)

### 2. Yükleme (Hosting Panelinde)
1. Hostinginizin Dosya Yöneticisine (File Manager) gidin.
2. `public_html/misledi` gibi bir klasör oluşturun ve ZIP'i içine atıp açın.
3. Hosting panelinde **"Setup Node.js App"** menüsüne girin.
4. **Create Application**:
   - **Node.js Version:** 18 veya 20 seçin.
   - **Application Mode:** Production.
   - **Application Root:** Dosyaları attığınız klasör (`public_html/misledi`).
   - **Application URL:** Sitenizin adresi.
   - **Startup File:** `node_modules/next/dist/bin/next` (Burası hostinge göre değişebilir, genellikle boşa `npm start` komutu girilir).
5. **Create** butonuna basın.

### 3. Bağımlılıkları Yükleme
1. Node.js App sayfasında **"Run NPM Install"** butonunu göreceksiniz. Tıklayın. (Bu işlem `package.json` içindeki kütüphaneleri sunucuya kurar).

### 4. Ortam Değişkenleri (Environment Variables)
1. Yine aynı sayfada "Environment Variables" bölümü olmalı. Ekle:
   - `DATABASE_URL`: (Veritabanı bağlantı adresi)
   - `ENCRYPTION_KEY`: (Şifreleme anahtarınız)
   - `HOSTNAME`: 0.0.0.0
   - `PORT`: (Hostingin atadığı port, otomatik olabilir)

### 5. Veritabanını Güncelleme (Migration)
Sunucu terminaline (SSH) erişiminiz varsa şu komutu çalıştırın:
```bash
npx prisma migrate deploy
```
Eğer SSH yoksa, bilgisayarınızdan `.env` dosyasındaki `DATABASE_URL`'i sunucu veritabanı adresiyle değiştirip:
```bash
npx prisma migrate deploy
```
çalıştırarak yapıyı uzaktan kurabilirsiniz.

### 6. Uygulamayı Başlat
Hosting panelinden **"Restart Application"** butonuna basın.

---

## Hangisini Seçmeliyim?
- **Teknik bilginiz azsa:** Kesinlikle **YÖNTEM 1 (Vercel)** seçin. 2 dakika sürer ve veritabanı (Supabase/Neon) dışında ayar gerektirmez.
- **Hostinginizde Node.js yoksa:** Hostinginiz sadece PHP destekliyorsa bu projeyi **çalıştıramazsınız**. Vercel kullanmalısınız.
