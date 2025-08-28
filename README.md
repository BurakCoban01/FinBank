# FinBank (FinTrack) Uygulaması

Bu proje, kişisel bankacılık ve finans yönetimi için geliştirilmiş, backend olarak .NET 8 kullanılan, frontend olarak React (TypeScript) ve veritabanı olarak da PostgreSQL kullanılan bir web uygulamasıdır.

## Teknolojiler

- **Backend:** ASP.NET Core 8 (C#)
- **Frontend:** React 18 (TypeScript)
- **Veritabanı:** PostgreSQL
- **UI:** Material-UI (MUI)

---

## Kurulum ve Başlatma

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js ve npm](https://nodejs.org/en/)
- [PostgreSQL](https://www.postgresql.org/download/)

### Backend Kurulumu (`FinTrack.API`)

1.  **Backend klasörüne gidin:**
    ```bash
    cd FinTrack.API
    ```

2.  **.NET User Secrets'ı yapılandırın:**
    `appsettings.json` dosyasındaki boş alanları kendi yerel yapılandırmanıza göre doldurun. Aşağıdaki komutları kendi bilgilerinizle güncelleyerek çalıştırın:
    ```bash
    dotnet user-secrets set "ConnectionStrings:PostgreSQLConnection" "Host=localhost;Port=5432;Database=FinTrackDb;Username=YOUR_USERNAME;Password=YOUR_PASSWORD"
    dotnet user-secrets set "ApiKeys:Finnhub" "YOUR_FINNHUB_API_KEY"
    dotnet user-secrets set "ApiKeys:TwelveData" "YOUR_TWELVEDATA_API_KEY"
    dotnet user-secrets set "Jwt:Key" "YOUR_VERY_STRONG_AND_SECRET_JWT_KEY_AT_LEAST_16_CHARS"
    ```

3.  **Veritabanı Migration'larını uygulayın:**
    ```bash
    dotnet ef database update
    ```

4.  **Backend'i çalıştırın:**
    ```bash
    dotnet run
    ```
    API artık `https://localhost:7146` ve `http://localhost:5031` adreslerinde çalışıyor olacaktır.

### Frontend Kurulumu (`fintrack-client`)

1.  **Frontend klasörüne gidin:**
    ```bash
    cd fintrack-client
    ```

2.  **Gerekli paketleri yükleyin:**
    ```bash
    npm install
    ```

3.  **Frontend'i çalıştırın:**
    ```bash
    npm start
    ```
    Uygulama tarayıcınızda `http://localhost:3000` adresinde açılacaktır.

---

## 1. Projeye Genel Bakış

FinBank, kullanıcıların kişisel bankacılık ve finans ürünlerine erişmesine ve demo olarak gerçekleştirilmesine olanak tanıyan kapsamlı bir web uygulamasıdır. Kullanıcılar bu sistem üzerinde Hesaplar oluşturabilir, hesaplarındaki varlıkları görüntüleyebilir, hesaplar arası transferler gerçekleştirebilir. Aynı zamanda EFT/havale işlemleri aracılığıyla sistemde yer alan kullanıcılar arasında da varlık gönderimi ve alımı yapılabilmektedir. İşlemler sayfasında gelir-gider, havale gönderim-alım, hesaplar arası transfer ve yatırım alım-satım gibi işlemler görüntülenebilmektedir. Kredi sayfası aracılığıyla ihtiyaç, taşıt veya konut kredisi gibi ürünlerin oranları ve vadeleri görülebilmekte ve aynı zamanda kredi çekme işlemi gerçekleştirilebilmekte ve kredilerin detaylı ödeme planına ulaşılabilmektedir. Mevduat sayfasında ise Merkez Bankası'nın güncel faiz oranları verisi çekilerek ona göre belirlenen mevduat oranları görüntülenebilmekte ve çeşitli vadelerde mevduat hesabı açılabilmektedir. Yatırım sayfasında ise kullanıcılar takip etmek istediği varlıkları(hisse senedi, döviz kurları, emtia, kriptopara) arama ekranıyla gerçek fiyat verilerine(varlık türüne göre çeşitli API sağlayıcılarına yönlendirilmekte) ulaşabilmekte ve takip listelerine kalıcı olarak ekleyebilmektedir, aynı zamanda bu sayfada demo alım/satım işlemleri yapılabilmekte ve kullanıcının sahip olduğu varlıklar portföyde liste olarak ve pasta grafiği olarak da dağılımı gösterilmektedir.

Proje, modern bir teknoloji yığını üzerine inşa edilmiştir ve backend ile frontend arasında net bir ayrım bulunan bir mimariye sahiptir.

## 2. Backend Mimarisi (FinTrack.API)

Backend, klasik bir Katmanlı Mimari (Layered Architecture) ve Dependency Injection prensiplerini takip eder.

### 2.1. Ana Katmanlar ve Klasörler

- **`Controllers/`**: API endpoint'lerini tanımlar. Gelen HTTP isteklerini alır, ilgili servisleri çağırır ve HTTP yanıtlarını döndürür.
- **`Services/`**: Tüm iş mantığının bulunduğu katmandır. Veritabanı işlemleri, harici API çağrıları ve karmaşık hesaplamalar burada yapılır.
- **`Data/`**: Veritabanı ile ilgili tüm yapıları içerir.
  - **`AppDbContext.cs`**: Entity Framework Core context sınıfıdır. Veritabanı tablolarını (`DbSet`) ve ilişkilerini tanımlar.
- **`Models/`**: Veritabanı tablolarına karşılık gelen C# sınıflarını (POCO - Plain Old C# Object) içerir. Bunlar EF Core tarafından kullanılan entity'lerdir.
- **`DTOs/`**: (Data Transfer Objects) API ve frontend arasında veri taşımak için kullanılan sınıflardır. Modellerden farklı olarak, sadece arayüzün ihtiyaç duyduğu verileri içerirler.
- **`Mappings/`**: `AutoMapper` profillerini içerir. `Model` nesneleri ile `DTO` nesneleri arasındaki dönüşümleri otomatikleştirir.
- **`Program.cs`**: Uygulamanın başlangıç noktasıdır. Servislerin (Dependency Injection), middleware'lerin (Authentication, CORS vb.) ve diğer konfigürasyonların ayarlandığı yerdir.

### 2.2. Veritabanı Modelleri (`Models/`)

- **`User.cs`**: Kullanıcı bilgilerini (ID, username, şifre hash'i, ad, soyad) tutar.
- **`Account.cs`**: Kullanıcının banka, nakit, yatırım gibi hesaplarını tutar. Bakiye, para birimi, hesap türü gibi bilgileri içerir.
- **`Transaction.cs`**: Tüm finansal işlemleri (gelir, gider, transfer vb.) temsil eder. Tutar, tarih, açıklama, kategori ve işlem türü gibi alanları vardır.
- **`Category.cs`**: Gelir/gider işlemleri için kullanıcı tanımlı kategorileri (Maaş, Fatura, Alışveriş vb.) tutar.
- **`Loan.cs`**: Kullanıcının kredi hesaplarını (anapara, faiz oranı, vade vb.) yönetir.
- **`TimeDeposit.cs`**: Kullanıcının vadeli mevduat hesaplarını yönetir.
- **`MarketAsset.cs`**: Piyasadan çekilen varlıkları (hisse senedi, döviz, kripto para) temsil eder.
- **`UserAsset.cs`**: Bir kullanıcının sahip olduğu yatırım varlıklarını (portföy pozisyonları) tutar. Miktar, ortalama maliyet gibi bilgileri içerir.
- **`UserTrackedAssets.cs`**: Bir kullanıcının takip listesine eklediği varlıkları tutar.

### 2.3. Anahtar Servisler ve İşlevleri (`Services/`)

- **`UserService.cs`**: Kullanıcı kaydı ve girişi (JWT token oluşturma) işlemlerini yönetir.
- **`TransactionService.cs`**: Gelir/gider gibi standart işlemlerin oluşturulması, güncellenmesi ve silinmesinden sorumludur.
- **`TransferService.cs`**: Hesaplar arası ve kullanıcılar arası (EFT/Havale) para transferi mantığını içerir.
- **`PortfolioService.cs`**: Kullanıcının yatırım portföyünü analiz eder, toplam değer, kar/zarar gibi özet bilgileri hesaplar.
- **`MarketDataService.cs`**: `Finnhub` ve `TwelveData` gibi harici finans API'lerinden anlık piyasa verilerini (fiyat, sembol arama) çeker.
- **`LoanService.cs` / `TimeDepositService.cs`**: Kredi ve mevduat hesaplarının oluşturulması ve yönetilmesiyle ilgili iş mantığını barındırır.

---

## 3. Frontend Mimarisi (fintrack-client)

Frontend, modern React prensipleri üzerine kurulmuştur ve bileşen tabanlı bir yapıya sahiptir.

### 3.1. Ana Klasörler

- **`pages/`**: Uygulamadaki her bir sayfaya karşılık gelen ana bileşenleri içerir (örn: `Dashboard.tsx`, `InvestmentsPage.tsx`, `Login.tsx`).
- **`components/`**: Birden çok sayfada yeniden kullanılabilen daha küçük arayüz bileşenlerini barındırır (örn: `Layout.tsx`, `PrivateRoute.tsx`).
- **`services/`**: Backend API'si ile iletişimi yöneten fonksiyonları içerir. Her bir işlevsel alan için ayrı bir servis dosyası bulunur (örn: `transaction.service.ts`).
- **`types/`**: TypeScript tiplerini ve arayüzlerini tanımlar. Backend DTO'larına karşılık gelen `interface`'ler burada bulunur ve veri tutarlılığını sağlar.
- **`hooks/`**: Özel React hook'larını içerir. Örneğin, `useAuth.tsx` kullanıcı oturum durumunu yönetir.
- **`App.tsx`**: Uygulamanın ana giriş noktasıdır. React Router kullanılarak sayfa yönlendirmeleri (routing) burada tanımlanır.

### 3.2. Anahtar Bileşenler ve İşlevleri

- **`Layout.tsx`**: Uygulamanın genel yerleşimini (sol menü, üst bar) sağlar. Kullanıcı giriş yapmışsa menüyü ve ana içeriği (`Outlet`), yapmamışsa sadece `Outlet`'i (Login/Register sayfaları için) render eder.
- **`Dashboard.tsx`**: Kullanıcının finansal durumuna genel bir bakış sunan ana sayfadır. Özet kartları, son işlemler listesi, haftalık nakit akışı grafiği ve hızlı eylem butonları gibi bileşenler içerir.
- **`InvestmentsPage.tsx`**: En karmaşık sayfalardan biridir. Kullanıcının yatırım portföyünü, takip listesini, varlık arama işlevini ve alım/satım formunu barındırır.
- **`TransactionForm.tsx`**: Yeni işlem ekleme ve mevcut işlemleri düzenleme formunu içerir. Seçilen işlem türüne göre dinamik olarak farklı alanlar gösterir.
- **`PrivateRoute.tsx`**: Belirli yollara (route) sadece giriş yapmış kullanıcıların erişebilmesini sağlayan bir sarmalayıcı (wrapper) bileşendir.

### 3.3. API İletişimi

- **`services/api.ts`**: Merkezi bir `axios` instance'ı oluşturur. Bu instance, tüm API isteklerine otomatik olarak `Authorization` başlığını (JWT token) ekleyen bir `interceptor` içerir. Bu sayede, her servis fonksiyonunda token'ı manuel olarak eklemeye gerek kalmaz.


### 4. Kullanıcı Tercihleri ve Projede Uygulanan Metodolojiler
       * Metodoloji Kuralları: Büyük kod bloklarının tek seferde değiştirilmemesi ve bunun yerine küçük, atomik değişiklikler uygulanarak projenin çalışır yapısının bozulmaması amaçlanmıştır. Büyük değişiklikler yapılması durumunda da geçmişteki kod, fonksiyon veya yapıların yorum olarak saklanmaya devam edilmesiyle değişiklikler arasındaki geçişin kolaylaştırılması hedeflenmiştir. 
       * API Kullanım Bilinci: Harici API'lerin kullanım limitlerine dikkat edilmekte ve Dashboard(ana sayfa) gibi sık yüklenen, kullanılan sayfalarda gereksiz olarak dış sağlayıcıların çağrılarından kaçınılmaktadır.
