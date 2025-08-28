using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FinTrack.API.Data;
using FinTrack.API.Models;
using FinTrack.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarketDataController : ControllerBase
    {
        private readonly IMarketDataService _marketDataService;
        private readonly AppDbContext _context;

        public MarketDataController(IMarketDataService marketDataService, AppDbContext context)
        {
            _marketDataService = marketDataService;
            _context = context;
        }

        [HttpGet("price/{symbol}")]
        public async Task<IActionResult> GetAssetPrice(string symbol)
        {
            if (string.IsNullOrWhiteSpace(symbol))
                return BadRequest(new { message = "Sembol boş olamaz." });

            var decodedUserSymbol = System.Net.WebUtility.UrlDecode(symbol);
            Console.WriteLine($"CONTROLLER: GetAssetPrice called for decodedUserSymbol: '{decodedUserSymbol}'");

            // 1. Varlığı ÖNCE veritabanından ara
            // 2: EF Core'un çevirebildiği bir LINQ sorgusu kullanılır
            MarketAsset assetDefinition = await _context.MarketAssets
                                            .FirstOrDefaultAsync(m => m.Symbol.ToLower() == decodedUserSymbol.ToLower());

            if (assetDefinition == null)
            {
                Console.WriteLine($"CONTROLLER: Asset '{decodedUserSymbol}' not in DB, trying live search...");
                var searchResults = await _marketDataService.SearchAssetsAsync(decodedUserSymbol);

                // Buradaki arama client-side olduğu için .Equals kalabilir, ama tutarlılık için bunu da değiştirelim.
                assetDefinition = searchResults.FirstOrDefault(sr =>
                    sr.Symbol.Equals(decodedUserSymbol, StringComparison.OrdinalIgnoreCase));

                if (assetDefinition == null)
                {
                    Console.WriteLine($"CONTROLLER: Asset definition for '{decodedUserSymbol}' not found after DB and live search.");
                    return NotFound(new { message = $"Varlık tanımı ({decodedUserSymbol}) bulunamadı." });
                }
                Console.WriteLine($"CONTROLLER: Asset for '{decodedUserSymbol}' resolved via SEARCH. Name: '{assetDefinition.Name}', Type: {assetDefinition.Type}");
            }
            else
            {
                Console.WriteLine($"CONTROLLER: Asset '{decodedUserSymbol}' found in DB. Name: '{assetDefinition.Name}', Type: {assetDefinition.Type}");
            }

            // 3. Varlık tanımını servise gönder.
            AssetPriceInfo priceInfo = await _marketDataService.GetGenericAssetPriceAsync(
                assetDefinition.Symbol,
                assetDefinition.Type,          // <- Artık doğru gelen tür bilgisi
                assetDefinition.ApiSymbol,
                assetDefinition.SourceApi
            );

            if (priceInfo == null)
            {
                Console.WriteLine($"CONTROLLER: GetGenericAssetPriceAsync returned null for UserSymbol='{decodedUserSymbol}'");
                return NotFound(new { message = $"Fiyat bilgisi ({decodedUserSymbol}) alınamadı. Varlık türü desteklenmiyor veya API'de anlık bir sorun olabilir." });
            }

            // ... (priceInfo doldurma ve return Ok aynı)
            priceInfo.Symbol = assetDefinition.Symbol;
            if (string.IsNullOrEmpty(priceInfo.Currency))
            {
                priceInfo.Currency = assetDefinition.Currency ?? "USD";
            }
            return Ok(priceInfo);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchAssets([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query)) return BadRequest(new { message = "Arama sorgusu boş olamaz." });
            return Ok(await _marketDataService.SearchAssetsAsync(query));
        }

        [HttpGet("assets")]
        public async Task<IActionResult> GetTrackedAndDefaultAssets()
        {
            var assets = await _context.MarketAssets.AsNoTracking().OrderBy(a => a.Type).ThenBy(a => a.Name).ToListAsync();
            // Eğer tablo boşsa, temel birkaç varlığı ekleyelim ki uygulama boş görünmesin.
            if (!assets.Any())
            {
                var defaultAssets = new List<MarketAsset>
                {
                    new MarketAsset { Symbol = "AAPL", Name = "Apple Inc.", Type = AssetType.Stock, SourceApi = "Finnhub", ApiSymbol = "AAPL" },
                    new MarketAsset { Symbol = "BTC/USD", Name = "Bitcoin", Type = AssetType.Crypto, SourceApi = "TwelveData", ApiSymbol = "BTC/USD" },
                    new MarketAsset { Symbol = "EUR/USD", Name = "EUR/USD", Type = AssetType.Currency, SourceApi = "TwelveData", ApiSymbol = "EUR/USD" },
                    new MarketAsset { Symbol = "USD/TRY", Name = "Dolar/TL", Type = AssetType.Currency, SourceApi = "Finnhub", ApiSymbol = "USD/TRY" },
                };
                await _context.MarketAssets.AddRangeAsync(defaultAssets);
                await _context.SaveChangesAsync();
                return Ok(defaultAssets);
            }
            return Ok(assets);
        }

        [HttpGet("currency/rates/{baseCurrency?}")]
        public async Task<IActionResult> GetCurrencyRates(string baseCurrency = "TRY")
        {
            var ratesInfo = await _marketDataService.GetCurrencyRatesAsync(baseCurrency.ToUpper());
            if (ratesInfo == null || !ratesInfo.Any())
                return NotFound(new { message = $"Döviz kuru bilgileri ({baseCurrency} tabanlı) bulunamadı." });
            return Ok(ratesInfo);
        }
    }
}
