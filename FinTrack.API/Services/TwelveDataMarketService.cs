
using FinTrack.API.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Globalization; // Decimal parsing için
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    // Twelve Data /price endpoint yanıtı için DTO
    public class TwelveDataPriceResponse
    {
        [JsonPropertyName("price")]
        public string Price { get; set; } // String olarak gelebilir, parse etmek gerekebilir
    }

    // Twelve Data /symbol_search endpoint yanıtı için DTO (Kısmi)
    public class TwelveDataSymbolSearchItem
    {
        public string Symbol { get; set; }
        public string Instrument_name { get; set; }
        public string Exchange { get; set; }
        public string Currency { get; set; }
        public string Instrument_type { get; set; } // "Stock", "Cryptocurrency", "Forex Pair", "ETF", "Index"
    }
    public class TwelveDataSymbolSearchResponse
    {
        public List<TwelveDataSymbolSearchItem> Data { get; set; }
        public string Status { get; set; }
    }


    public class TwelveDataMarketDataService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly JsonSerializerOptions _jsonOptions;

        public TwelveDataMarketDataService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["ApiKeys:TwelveData"];
            if (string.IsNullOrEmpty(_apiKey))
            {
                throw new InvalidOperationException("Twelve Data API key is not configured.");
            }
            _httpClient.BaseAddress = new Uri("https://api.twelvedata.com/");
            _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        }

        private async Task<AssetPriceInfo> GetPriceInternalAsync(string symbol, string instrumentTypeForDisplay)
        {
            // TwelveData /price endpoint: /price?symbol=AAPL&apikey=YOUR_KEY
            // Kripto için: /price?symbol=BTC/USD&exchange=Binance&apikey=YOUR_KEY
            // Metaller için: /price?symbol=XAU/USD&apikey=YOUR_KEY

            // string requestUrl = $"price?symbol={symbol}&apikey={_apiKey}";  eski hali
            string requestUrl = $"price?symbol={symbol.ToUpper()}&apikey={_apiKey}"; // Sembolü büyük harfe çevir


            // Metaller için (XAU/USD, XAG/USD) genellikle exchange belirtmeye gerek yok veya özel bir exchange olabilir.
            // Twelve Data dokümantasyonuna göre XAU/USD, XAG/USD gibi semboller exchange olmadan çalışmalı.

            var responseString = await _httpClient.GetStringAsync(requestUrl);
            var priceResponse = JsonSerializer.Deserialize<TwelveDataPriceResponse>(responseString, _jsonOptions);

            if (priceResponse == null || string.IsNullOrEmpty(priceResponse.Price))
            {
                Console.WriteLine($"TwelveData returned no price for symbol: {symbol}");
                return null;
            }

            // Fiyat string'ini decimal'e parse et (kültürden bağımsız)
            if (!decimal.TryParse(priceResponse.Price, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal priceValue))
            {
                Console.WriteLine($"TwelveData could not parse price for symbol {symbol}: {priceResponse.Price}");
                return null;
            }

            string currency = "USD"; // Varsayılan
            if (symbol.Contains("/"))
            {
                currency = symbol.Split('/')[1];
            }
            else if (symbol.Equals("XAU", StringComparison.OrdinalIgnoreCase) || symbol.Equals("XAG", StringComparison.OrdinalIgnoreCase))
            {
                currency = "USD"; // Genellikle USD üzerinden kote edilir.
            }


            return new AssetPriceInfo
            {
                Symbol = symbol,
                Price = priceValue,
                Currency = currency, // Sembolün ikinci kısmı (örn: BTC/USD -> USD)
                LastUpdated = DateTime.UtcNow // Twelve Data anlık fiyat için timestamp vermeyebilir, kendi zamanımızı kullanıyoruz
                // Change ve ChangePercent için Twelve Data'nın /time_series veya /quote endpoint'leri gerekebilir.
                // /price endpoint'i sadece fiyat verir.
            };
        }


        // IMarketDataService'e eklemek için yeni bir metot (veya mevcutları kullan)
        public async Task<AssetPriceInfo> GetForexPriceAsync(string symbol) // Örn: "EUR/USD"
        {
            return await GetPriceInternalAsync(symbol, "Forex Pair");
        }


        public async Task<AssetPriceInfo> GetCryptoPriceAsync(string symbolWithPair) // Örn: "BTC/USD"
        {
            return await GetPriceInternalAsync(symbolWithPair, "Cryptocurrency");
        }

        public async Task<AssetPriceInfo> GetMetalPriceAsync(string metalSymbolInPair) // Örn: "XAU/USD"
        {
            return await GetPriceInternalAsync(metalSymbolInPair, "Metal");
        }

        public async Task<AssetPriceInfo?> GetIndexPriceAsync(string symbol) // Örn: "^GSPC", "IXIC"
        {
            return await GetPriceInternalAsync(symbol, "Index");
        }

        public async Task<List<MarketAsset>> SearchSymbolsAsync(string query, string type = "") // type: "Stock", "Cryptocurrency" etc.
        {
            // /symbol_search?symbol=AAP&apikey=...&type=...
            string requestUrl = $"symbol_search?symbol={query}&apikey={_apiKey}";
            if (!string.IsNullOrEmpty(type))
            {
                requestUrl += $"&type={type}";
            }
            // Exchange de eklenebilir: &exchange=NASDAQ

            /* eski hali
            var responseString = await _httpClient.GetStringAsync(requestUrl);
            var searchResponse = JsonSerializer.Deserialize<TwelveDataSymbolSearchResponse>(responseString, _jsonOptions);

            if (searchResponse == null || searchResponse.Status != "ok" || searchResponse.Data == null)
            {
                return new List<MarketAsset>();
            }

            /* eski hali
            return searchResponse.Data.Select(item => new MarketAsset
            {
                Symbol = item.Symbol,
                Name = item.Instrument_name,
                Exchange = item.Exchange,
                Currency = item.Currency,
                Type = ConvertTwelveDataInstrumentType(item.Instrument_type),
                SourceApi = "TwelveData", // EKLENDİ
                ApiSymbol = item.Symbol    // EKLENDİ (TwelveData için genellikle aynı)
            }).ToList();
            /

            return searchResponse.Data
                .Where(item => !string.IsNullOrWhiteSpace(item.Symbol) && !string.IsNullOrWhiteSpace(item.Instrument_name)) // Geçerli sembol ve isimleri olanları al
                .Select(item => new MarketAsset
                {
                    // Id veritabanına eklenince atanacak, burada 0 veya null olabilir.
                    // Frontend'de geçici ID atanabilir.
                    Symbol = item.Symbol, // Kullanıcının gördüğü ve aradığı sembol
                    Name = item.Instrument_name,
                    Exchange = item.Exchange,
                    Currency = item.Currency,
                    Type = ConvertTwelveDataInstrumentType(item.Instrument_type),
                    SourceApi = "TwelveData", // BU ÇOK ÖNEMLİ
                    ApiSymbol = item.Symbol   // TwelveData için ApiSymbol genellikle Symbol ile aynı
                }).ToList();
            */

            try // KESİN ÇÖZÜM: API hatalarını yakalamak için try-catch bloğu eklendi.
            {
                var responseString = await _httpClient.GetStringAsync(requestUrl);
                var searchResponse = JsonSerializer.Deserialize<TwelveDataSymbolSearchResponse>(responseString, _jsonOptions);

                if (searchResponse == null || searchResponse.Status != "ok" || searchResponse.Data == null)
                {
                    return new List<MarketAsset>();
                }

                return searchResponse.Data
                    .Where(item => !string.IsNullOrWhiteSpace(item.Symbol) && !string.IsNullOrWhiteSpace(item.Instrument_name))
                    .Select(item => new MarketAsset
                    {
                        Symbol = item.Symbol,
                        Name = item.Instrument_name,
                        Exchange = item.Exchange,
                        Currency = item.Currency,
                        Type = ConvertTwelveDataInstrumentType(item.Instrument_type),
                        SourceApi = "TwelveData",
                        ApiSymbol = item.Symbol
                    }).ToList();
            }
            catch (HttpRequestException ex)
            {
                // Eğer 521 gibi bir HTTP hatası alırsak, uygulamayı çökertmek yerine
                // konsola bir uyarı yazdırıp boş bir liste döndürüyoruz.
                Console.WriteLine($"[API-ERROR] TwelveData SearchSymbolsAsync failed for query '{query}'. Status: {ex.StatusCode}. Message: {ex.Message}");
                return new List<MarketAsset>();
            }
        }

        private AssetType ConvertTwelveDataInstrumentType(string twelveDataType)
        {
            /* Type'ların ilk kullandığımız hali:
             
            // Bu metod, gelen string'i doğru AssetType enum'una çevirir.
            // "Forex Pair" ve "Currency" türlerini AssetType.Currency olarak işaretlemek kritik öneme sahiptir.
            return twelveDataType?.ToLowerInvariant() switch
            {
                "stock" => AssetType.Stock,
                "common stock" => AssetType.Stock,
                "preferred stock" => AssetType.Stock,
                "cryptocurrency" => AssetType.Crypto,
                "digital currency" => AssetType.Crypto,
                "forex pair" => AssetType.Currency, 
                "currency" => AssetType.Currency,   
                "etf" => AssetType.Fund,
                "index" => AssetType.Index,
                "metal" => AssetType.Currency, // Metalleri şimdilik Currency altında tutuyoruz (XAU/USD)
                "commodity" => AssetType.Currency, // Metaller için bu da gelebilir
                _ => AssetType.Stock, // Bilinmeyenleri şimdilik Hisse olarak işaretle veya logla
            };
            */
            /*
            // Gelen string'i null kontrolü yaparak küçük harfe çeviriyoruz.
            return twelveDataType?.ToLowerInvariant() switch
            {
                // Hisse Senedi Türleri
                "stock" => AssetType.Stock,
                "common stock" => AssetType.Stock,
                "preferred stock" => AssetType.Stock,

                // Kripto Para Türleri
                "cryptocurrency" => AssetType.Crypto,
                "digital currency" => AssetType.Crypto,

                // Döviz, Emtia ve Metal Türleri (HEPSİ BİZİM SİSTEMİMİZDE 'CURRENCY' OLARAK SINIFLANDIRILIYOR)
                "forex pair" => AssetType.Currency,        // <<< EUR/USD, GBP/JPY gibi varlıkları doğru sınıflandırır.
                "physical currency" => AssetType.Currency,
                "precious metal" => AssetType.Currency,   // <<< XAU/USD gibi varlıkları doğru sınıflandırır.
                "metal" => AssetType.Currency,
                "commodity" => AssetType.Currency,        // <<< WTI/USD gibi emtiaları doğru sınıflandırır.

                // Diğer Türler
                "etf" => AssetType.Fund,
                "reit" => AssetType.Fund,
                "index" => AssetType.Index,

                // Eğer yukarıdakilerden hiçbiri eşleşmezse, varsayılan olarak Stock kabul et ve konsola uyar.
                _ => AssetType.Stock,
            };
            */

            // Gelen string'i null kontrolü yaparak küçük harfe çeviriyoruz.
            // Bu switch ifadesi, projenin doğru çalışması için hayati öneme sahiptir.
            switch (twelveDataType?.ToLowerInvariant())
            {
                // Hisse Senedi Türleri
                case "stock":
                case "common stock":
                case "preferred stock":
                    return AssetType.Stock;

                // Kripto Para Türleri
                case "cryptocurrency":
                case "digital currency":
                    return AssetType.Crypto;

                // DÖVİZ, EMTİA VE METALLERİN TÜMÜ 'CURRENCY' OLARAK EŞLENİYOR
                case "forex pair":        // Örn: EUR/USD, GBP/JPY
                case "physical currency":
                case "precious metal":    // Örn: XAU/USD
                case "metal":
                case "commodity":         // Örn: WTI/USD (Ham Petrol)
                    return AssetType.Currency;

                // Diğer Türler
                case "etf":
                case "reit":
                    return AssetType.Fund;
                case "index":
                    return AssetType.Index;

                // Bilinmeyen bir tür gelirse, varsayılan olarak Stock kabul et ve konsola uyarı yazdır.
                default:
                    Console.WriteLine($"[Warning] Unknown TwelveData instrument_type: '{twelveDataType}'. Defaulting to 'Stock'.");
                    return AssetType.Stock;
            }

        }
    }
}

