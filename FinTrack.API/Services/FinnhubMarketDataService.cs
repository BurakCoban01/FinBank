using FinTrack.API.Models; // AssetPriceInfo için
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging; // Loglama için
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization; // FirstOrDefault için
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using HtmlAgilityPack;

namespace FinTrack.API.Services
{
    // Finnhub'dan gelen Quote yanıtı için DTO (önceki gibi)
    public class FinnhubQuoteResponse
    {
        [JsonPropertyName("c")] public decimal CurrentPrice { get; set; }
        [JsonPropertyName("d")] public decimal? Change { get; set; }
        [JsonPropertyName("dp")] public decimal? PercentChange { get; set; }
        [JsonPropertyName("h")] public decimal HighPrice { get; set; }
        [JsonPropertyName("l")] public decimal LowPrice { get; set; }
        [JsonPropertyName("o")] public decimal OpenPrice { get; set; }
        [JsonPropertyName("pc")] public decimal PreviousClosePrice { get; set; }
        [JsonPropertyName("t")] public long Timestamp { get; set; }
    }

    // Finnhub'dan gelen sembol arama yanıtı için (Company Profile 2 daha iyi olabilir)
    public class FinnhubCompanyProfile2
    {
        public string Country { get; set; }
        public string Currency { get; set; } // "USD", "TRY"
        public string Exchange { get; set; }
        public string FinnhubIndustry { get; set; }
        public string Ipo { get; set; }
        public string Logo { get; set; }
        public decimal MarketCapitalization { get; set; }
        public string Name { get; set; }
        public string Phone { get; set; }
        public decimal ShareOutstanding { get; set; }
        public string Ticker { get; set; } // Bu bizim ana sembolümüz (AAPL, GARAN.IS)
        public string Weburl { get; set; }
    }

    // Kripto sembolleri için (Finnhub /crypto/symbol endpoint'i)
    public class FinnhubCryptoSymbol
    {
        public string Description { get; set; }
        public string DisplaySymbol { get; set; } // "BTC/USD"
        public string Symbol { get; set; } // "BINANCE:BTCUSDT" (Finnhub'ın kullandığı sembol)
    }

    // Forex sembolleri için (Finnhub /forex/symbol endpoint'i)
    public class FinnhubForexSymbol
    {
        public string Description { get; set; }
        public string DisplaySymbol { get; set; } // "EUR/USD"
        public string Symbol { get; set; } // "OANDA:EUR_USD"
    }


    public class FinnhubMarketDataService // IMarketDataService'i implemente ETMİYOR. Sadece Finnhub'a özel olacak.
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly JsonSerializerOptions _jsonOptions;

        public FinnhubMarketDataService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["ApiKeys:Finnhub"];
            if (string.IsNullOrEmpty(_apiKey))
            {
                throw new InvalidOperationException("Finnhub API key is not configured.");
            }
            _httpClient.BaseAddress = new Uri("https://finnhub.io/api/v1/");
            _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        }

        public async Task<AssetPriceInfo?> GetStockQuoteAsync(string symbol)
        {
            var responseString = await _httpClient.GetStringAsync($"quote?symbol={symbol.ToUpper()}&token={_apiKey}");
            var quoteResponse = JsonSerializer.Deserialize<FinnhubQuoteResponse>(responseString, _jsonOptions);

            if (quoteResponse == null || quoteResponse.CurrentPrice == 0)
            {
                Console.WriteLine($"Finnhub returned no data or zero price for stock symbol: {symbol}");
                return null;
            }

            // Finnhub'dan para birimi almak için /stock/profile2 endpoint'i kullanılabilir.
            // Şimdilik USD varsayıyoruz.
            string currency = "USD"; // Varsayılan
            try
            {
                var profileResponseString = await _httpClient.GetStringAsync($"stock/profile2?symbol={symbol.ToUpper()}&token={_apiKey}");
                using var jsonDoc = JsonDocument.Parse(profileResponseString);
                if (jsonDoc.RootElement.TryGetProperty("currency", out var currencyElement))
                {
                    currency = currencyElement.GetString() ?? "USD";
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Could not fetch currency from profile for {symbol}: {ex.Message}. Defaulting to USD.");
            }


            return new AssetPriceInfo
            {
                Symbol = symbol.ToUpper(),
                Price = quoteResponse.CurrentPrice,
                Change = quoteResponse.Change,
                ChangePercent = quoteResponse.PercentChange,
                Currency = currency, // Alınan para birimi
                LastUpdated = DateTimeOffset.FromUnixTimeSeconds(quoteResponse.Timestamp).UtcDateTime
            };
        }

        public async Task<List<AssetPriceInfo>> GetCurrencyRatesForTRYAsync()
        {

            // TCMB'den veri çekme mantığı
            try
            {
                var tcmbUrl = "https://www.tcmb.gov.tr/kurlar/today.xml";
                // HttpClient'ın BaseAddress'i Finnhub'a ayarlı olduğu için yeni bir HttpRequestMessage kullanalım
                using var request = new HttpRequestMessage(HttpMethod.Get, tcmbUrl);
                using var response = await _httpClient.SendAsync(request); // _httpClient'ı kullanabiliriz
                response.EnsureSuccessStatusCode();
                var xmlString = await response.Content.ReadAsStringAsync();

                var xmlDoc = new System.Xml.XmlDocument();
                xmlDoc.LoadXml(xmlString);

                var rates = new List<AssetPriceInfo>();
                var currencyNodes = xmlDoc.SelectNodes("/Tarih_Date/Currency");
                DateTime dateFromXml = DateTime.UtcNow; // Varsayılan
                var dateAttribute = xmlDoc.SelectSingleNode("/Tarih_Date")?.Attributes["Tarih"];
                if (dateAttribute != null && DateTime.TryParse(dateAttribute.Value, CultureInfo.GetCultureInfo("tr-TR"), DateTimeStyles.None, out var parsedDate))
                {
                    dateFromXml = DateTime.SpecifyKind(parsedDate, DateTimeKind.Local).ToUniversalTime(); // Tarihi UTC'ye çevir
                }


                if (currencyNodes != null)
                {

                    var targetCurrencyCodes = new List<string> { "USD", "EUR", "GBP", "JPY", "AUD", "CHF", "DKK", "SEK", "CAD", "NOK", "SAR", "BGN", "RON", "RUB", "CNY", "AZN", "AED", "KRW" };
                    foreach (System.Xml.XmlNode node in currencyNodes)
                    {
                        var currencyCode = node.Attributes["CurrencyCode"]?.Value;

                        if (!string.IsNullOrEmpty(currencyCode) && targetCurrencyCodes.Contains(currencyCode))
                        {
                            // Japon Yeni gibi bazı kurlar 100 birim üzerinden kote edilir.
                            // Bu durumu ele almak için "Unit" (Birim) bilgisini de okumalıyız.
                            var unitNode = node.SelectSingleNode("Unit");
                            var forexSellingNode = node.SelectSingleNode("ForexSelling");

                            if (forexSellingNode != null && decimal.TryParse(forexSellingNode.InnerText.Replace(".", ","), NumberStyles.Any, CultureInfo.GetCultureInfo("tr-TR"), out decimal rate))
                            {
                                int unit = 1;
                                if (unitNode != null && int.TryParse(unitNode.InnerText, out int parsedUnit))
                                {
                                    unit = parsedUnit;
                                }

                                // Eğer birim 1'den büyükse (örn: JPY için 100), fiyatı 1 birime bölerek normalize et.
                                if (unit > 1)
                                {
                                    rate /= unit;
                                }

                                rates.Add(new AssetPriceInfo
                                {
                                    Symbol = $"{currencyCode}/TRY",
                                    Price = rate,
                                    Currency = "TRY",
                                    LastUpdated = dateFromXml
                                });
                            }
                        }
                    }
                }
                return rates;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching or parsing TCMB rates: {ex.Message}");
                return new List<AssetPriceInfo>();
            }
        }

        // Genel döviz çiftleri için (örn: EUR/USD, GBP/JPY)
        // Finnhub'ın desteklediği forex sembol formatını kullanır (örn: OANDA:EUR_USD)
        public async Task<AssetPriceInfo?> GetForexPairQuoteAsync(string finnhubForexSymbol)
        {
            // GetStockQuoteAsync, Finnhub'ın quote endpoint'ini kullandığı için
            // forex sembolleri için de çalışacaktır. Sadece para birimi ve sembol adı düzenlenmeli.
            var quote = await GetStockQuoteAsync(finnhubForexSymbol);
            if (quote != null)
            {
                // Sembolü daha okunabilir hale getir (OANDA:EUR_USD -> EUR/USD)
                var match = Regex.Match(finnhubForexSymbol, @":([A-Z]{3})_([A-Z]{3})");
                if (match.Success)
                {
                    quote.Symbol = $"{match.Groups[1].Value}/{match.Groups[2].Value}";
                    quote.Currency = match.Groups[2].Value; // Kotasyon para birimi
                }
                else
                {
                    quote.Symbol = finnhubForexSymbol; // Eşleşmezse orijinal sembol
                }
            }
            return quote;
        }



        public async Task<double> GetTCMBPolicyRateAsync()
        {
            try
            {
                var url = "https://www.tcmb.gov.tr/wps/wcm/connect/tr/tcmb+tr/main+menu/temel+faaliyetler/para+politikasi/merkez+bankasi+faiz+oranlari/1+hafta+repo";
                var web = new HtmlWeb();        // HtmlAgilityPack’in web helper’ı (kolay load)
                var doc = await web.LoadFromWebAsync(url);  // Sayfayı indir ve HtmlDocument oluştur

                // Daha genel: sayfadaki tüm tablolar arasından, son satırın 3. hücresini al.
                var node = doc.DocumentNode.SelectSingleNode("//table//tbody/tr[last()]/td[3]");
                // XPath: -> tüm tablolar içinde tbody içindeki son satırın (last()) üçüncü hücresi (td[3])

                if (node != null)
                {
                    // “,” ayırıcıya yönelik
                    var rateText = node.InnerText.Trim().Replace("%", "").Replace(",", ".");
                    if (double.TryParse(rateText, NumberStyles.Any, CultureInfo.InvariantCulture, out double rate))
                    {
                        return rate;
                    }
                }
            }
            catch (Exception ex)
            {
                // Log detaylı hata
                Console.WriteLine($"GetTCMBPolicyRateAsync hata: {ex}");
            }
            // Eğer çekilemediyse, bir uyarı seviyesinde 0 döndürebilirsiniz
            return 0;
        }


    }
}

