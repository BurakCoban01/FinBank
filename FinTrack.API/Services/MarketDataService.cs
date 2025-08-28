﻿// FinTrack.API/FinTrack.API/Services/MarketDataService.cs
using FinTrack.API.Data;
using FinTrack.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging; // ILogger için eklendi
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public class MarketDataService : IMarketDataService
    {
        private readonly FinnhubMarketDataService _finnhubService;
        private readonly TwelveDataMarketDataService _twelveDataService;
        private readonly AppDbContext _context;
        private readonly ILogger<MarketDataService> _logger; // Logger eklendi

        public MarketDataService(
            FinnhubMarketDataService finnhubService,
            TwelveDataMarketDataService twelveDataService,
            AppDbContext context,
            ILogger<MarketDataService> logger) // Logger enjekte edildi
        {
            _finnhubService = finnhubService;
            _twelveDataService = twelveDataService;
            _context = context;
            _logger = logger; // Logger atanıyor
        }

        /* Bu, projenin ana veri çekme metodudur. Varlığın türüne göre istenen API kaynağını seçer ve fiyat bilgisini getirir.
        Bu merkezi mantık, farklı varlık türleri için farklı servislerin (Finnhub, TwelveData) kullanılmasını sağlar
        */
        public async Task<AssetPriceInfo> GetGenericAssetPriceAsync(string userFacingSymbol, AssetType assetType, string apiSymbolForService, string sourceApiForService)
        {
            // API'ye gönderilecek sembol, eğer özel bir API sembolü belirtilmemişse, kullanıcının girdiği semboldür.
            string symbolToUseWithApi = !string.IsNullOrEmpty(apiSymbolForService) ? apiSymbolForService : userFacingSymbol;

            Console.WriteLine($"SERVICE: GetGenericAssetPriceAsync received UserSymbol='{userFacingSymbol}', Type='{assetType}', SymbolToUseWithApi='{symbolToUseWithApi}'");

            try
            {
                // **İŞ MANTIĞININ UYGULANDIĞI YER**
                // Gelen varlık türüne (AssetType) göre hangi servisin çağrılacağına burada karar verilir.
                switch (assetType)
                {
                    case AssetType.Stock:
                        // Tüm hisse senetleri Finnhub'dan çekilir.
                        Console.WriteLine($"SERVICE: Routing to Finnhub for Stock: '{symbolToUseWithApi}'");
                        if (symbolToUseWithApi.Contains(".IS")) // BIST hisseleri ücretsiz planda desteklenmiyor.
                        {
                            Console.WriteLine($"SERVICE: BIST symbol {symbolToUseWithApi} not supported by Finnhub free plan.");
                            return null;
                        }
                        return await _finnhubService.GetStockQuoteAsync(symbolToUseWithApi);

                    case AssetType.Crypto:
                        // Tüm kripto paralar TwelveData'dan çekilir.
                        Console.WriteLine($"SERVICE: Routing to TwelveData for Crypto: '{symbolToUseWithApi}'");
                        return await _twelveDataService.GetCryptoPriceAsync(symbolToUseWithApi);

                    case AssetType.Currency:
                        // Döviz ve Metaller(Emtialar) kendi içlerinde ayrılır
                        if (symbolToUseWithApi.ToUpper().EndsWith("TRY"))
                        {
                            // TRY içeren kurlar Finnhub'daki TCMB kısmından çekilir.
                            Console.WriteLine($"SERVICE: Routing to Finnhub (TCMB) for TRY pair: '{symbolToUseWithApi}'");
                            var rates = await _finnhubService.GetCurrencyRatesForTRYAsync();
                            // Gelen symbol "USD/TRY" ise, ilk 3 karakteri ("USD") alıp eşleşeni buluruz.
                            return rates.FirstOrDefault(r => r.Symbol.StartsWith(symbolToUseWithApi.Substring(0, 3)));
                        }
                        else if (symbolToUseWithApi.ToUpper().StartsWith("XAU/") || symbolToUseWithApi.ToUpper().StartsWith("XAG/") || symbolToUseWithApi.ToUpper().StartsWith("WTI/") || symbolToUseWithApi.StartsWith("wti/"))
                        {
                            // Metaller (Altın, Gümüş, Petrol) TwelveData'dan çekilir.
                            Console.WriteLine($"SERVICE: Routing to TwelveData for Metal: '{symbolToUseWithApi}'");
                            return await _twelveDataService.GetMetalPriceAsync(symbolToUseWithApi);
                        }
                        else
                        {
                            // Diğer tüm döviz çiftleri (EUR/USD, GBP/JPY vb.) TwelveData'dan çekilir.
                            Console.WriteLine($"SERVICE: Routing to TwelveData for Forex: '{symbolToUseWithApi}'");
                            return await _twelveDataService.GetForexPriceAsync(symbolToUseWithApi);
                        }

                    // Diğer türler (Index, Fund) için case'ler buraya eklendi
                    case AssetType.Index:
                        // KURAL: Endeksler TwelveData'dan çekilir.
                        Console.WriteLine($"SERVICE: Routing to TwelveData for Index: '{symbolToUseWithApi}'");
                        return await _twelveDataService.GetIndexPriceAsync(symbolToUseWithApi);

                    default:
                        Console.WriteLine($"SERVICE: Unhandled asset type '{assetType}' for symbol '{symbolToUseWithApi}'.");
                        return null;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"SERVICE: EXCEPTION in GetGenericAssetPriceAsync for '{userFacingSymbol}' (ApiSymbol: '{symbolToUseWithApi}'): {ex.ToString()}");
                return null;
            }
        }

        // IMarketDataService arayüzündeki diğer metotlar, artık merkezi GetGenericAssetPriceAsync'i çağıracak şekilde basitleştirilebilir
        // veya doğrudan Controller'dan GetGenericAssetPriceAsync çağrılabilir. Bu arayüz metotlarını şimdilik tutuyoruz.
        public async Task<AssetPriceInfo> GetStockQuoteAsync(string symbol) =>
            await GetGenericAssetPriceAsync(symbol, AssetType.Stock, symbol, "Finnhub");

        public async Task<List<AssetPriceInfo>> GetCurrencyRatesAsync(string baseCurrency = "USD")
        {
            if (baseCurrency.ToUpper() == "TRY")
            {
                return await _finnhubService.GetCurrencyRatesForTRYAsync();
            }
            // Diğer base currency'ler için TwelveData'dan popüler çiftleri çekilebilir
            var results = new List<AssetPriceInfo>();
            var popularPairs = new[] { "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD" };
            foreach (var pair in popularPairs)
            {
                var price = await GetForexPriceAsync(pair);
                if (price != null) results.Add(price);
            }
            return results;
        }

        public async Task<AssetPriceInfo> GetCryptoPriceAsync(string symbol) =>
            await GetGenericAssetPriceAsync(symbol, AssetType.Crypto, symbol, "TwelveData");

        public async Task<AssetPriceInfo> GetMetalPriceAsync(string symbol) =>
            await GetGenericAssetPriceAsync(symbol, AssetType.Currency, symbol, "TwelveData");

        public async Task<AssetPriceInfo> GetForexPriceAsync(string symbol) =>
            await GetGenericAssetPriceAsync(symbol, AssetType.Currency, symbol, "TwelveData");

        public async Task<List<MarketAsset>> SearchAssetsAsync(string query)
        {
            // Arama için TwelveData daha geniş bir varlık yelpazesi sunduğu için idealdir.
            var twelveDataResults = await _twelveDataService.SearchSymbolsAsync(query);

            // Arama sonuçlarını alaka düzeyine göre sıralayabiliriz.
            if (twelveDataResults != null)
            {
                return twelveDataResults
                    .Where(a => !string.IsNullOrEmpty(a.Symbol) && !string.IsNullOrEmpty(a.Name)) // Boş sembol veya isimleri filtrele
                    .OrderByDescending(a => a.Type == AssetType.Crypto ? 3 : a.Type == AssetType.Currency ? 2 : a.Type == AssetType.Stock ? 1 : 0) // Tür önceliği
                    .ThenBy(a => a.Name)
                    .ToList();
            }
            return new List<MarketAsset>();
        }

        public async Task<double> GetTCMBPolicyRateAsync()
        {
            return await _finnhubService.GetTCMBPolicyRateAsync();
        }
    }
}
