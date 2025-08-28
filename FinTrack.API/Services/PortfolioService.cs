// Konum: FinTrack.API/Services/PortfolioService.cs
using FinTrack.API.Data;
using FinTrack.API.DTOs;
using FinTrack.API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public class PortfolioService : IPortfolioService
    {
        private readonly AppDbContext _context;
        private readonly IMarketDataService _marketDataService;

        public PortfolioService(AppDbContext context, IMarketDataService marketDataService)
        {
            _context = context;
            _marketDataService = marketDataService;
        }

        public async Task<PortfolioSummaryDto> GetPortfolioSummaryAsync(int userId)
        {
            // 1. Kullanıcının sahip olduğu tüm varlıkları (pozisyonları) veritabanından çek.
            var userAssets = await _context.UserAssets
                .Include(ua => ua.MarketAsset)
                .Where(ua => ua.UserId == userId && ua.Quantity > 0)
                .ToListAsync();

            var summary = new PortfolioSummaryDto();
            const string userBaseCurrency = "TRY";
            summary.Currency = userBaseCurrency;

            // 2. Her bir pozisyon için anlık değerleri ve kar/zararı hesapla.
            foreach (var asset in userAssets)
            {
                var priceInfo = await _marketDataService.GetGenericAssetPriceAsync(
                    asset.MarketAsset.Symbol,
                    asset.MarketAsset.Type,
                    asset.MarketAsset.ApiSymbol,
                    asset.MarketAsset.SourceApi
                );

                decimal currentPriceInUserBaseCurrency = priceInfo?.Price ?? 0;
                
                if (priceInfo != null && !string.IsNullOrEmpty(priceInfo.Currency) && priceInfo.Currency != userBaseCurrency)
                {
                    var conversionRateInfo = await _marketDataService.GetGenericAssetPriceAsync(
                        $"{priceInfo.Currency}/{userBaseCurrency}", AssetType.Currency, null, null);
                    
                    if (conversionRateInfo != null && conversionRateInfo.Price > 0)
                    {
                        currentPriceInUserBaseCurrency *= conversionRateInfo.Price;
                    }
                    else
                    {
                        Console.WriteLine($"UYARI: Portföy özeti için '{priceInfo.Currency}/{userBaseCurrency}' kuru alınamadı. '{asset.MarketAsset.Symbol}' anlık değeri 0 olarak hesaplanacak.");
                        currentPriceInUserBaseCurrency = 0;
                    }
                }

                // Artık toplam maliyet veritabanında TRY cinsinden tutuluyor.
                var totalCost = asset.TotalCostInUserCurrency;
                var currentValue = currentPriceInUserBaseCurrency * asset.Quantity;
                
                // Ortalama maliyeti (TRY cinsinden) yeniden hesapla
                var averageCostInUserBaseCurrency = (asset.Quantity > 0) ? totalCost / asset.Quantity : 0;

                var positionDto = new AssetPositionDto
                {
                    MarketAssetId = asset.MarketAssetId,
                    Symbol = asset.MarketAsset.Symbol,
                    Name = asset.MarketAsset.Name,
                    Type = asset.MarketAsset.Type,
                    Quantity = asset.Quantity,
                    AverageCost = averageCostInUserBaseCurrency, // TRY cinsinden ortalama maliyet
                    CurrentPrice = currentPriceInUserBaseCurrency,
                    CurrentValue = currentValue,
                    TotalCost = totalCost, // Veritabanından gelen doğru toplam maliyet
                    ProfitLoss = currentValue - totalCost,
                    ProfitLossPercentage = (totalCost > 0) ? ((currentValue - totalCost) / totalCost) * 100 : 0
                };
                
                summary.Positions.Add(positionDto);
                summary.TotalValue += positionDto.CurrentValue;
                summary.TotalCost += positionDto.TotalCost;
            }

            // 3. Genel portföy özetini hesapla.
            summary.Positions = summary.Positions.OrderByDescending(p => p.CurrentValue).ToList();
            summary.TotalProfitLoss = summary.TotalValue - summary.TotalCost;
            summary.TotalProfitLossPercentage = (summary.TotalCost > 0) ? (summary.TotalProfitLoss / summary.TotalCost) * 100 : 0;

            return summary;
        }
    }
}
