// Konum: FinTrack.API/FinTrack.API/Services/UserAssetService.cs
using FinTrack.API.Data;
using FinTrack.API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public class UserAssetService : IUserAssetService
    {
        private readonly AppDbContext _context;
        private readonly IMarketDataService _marketDataService;

        public UserAssetService(AppDbContext context, IMarketDataService marketDataService)
        {
            _context = context;
            _marketDataService = marketDataService;
        }

        public async Task<List<MarketAsset>> GetTrackedAssetsAsync(int userId)
        {
            return await _context.UserTrackedAssets
                .Where(uta => uta.UserId == userId)
                .OrderBy(uta => uta.SortOrder)  // Sıralama için SortOrder kullanılacak (her bir kullanıcı varlıkları farklı sıralayabilecek)
                .Select(uta => uta.MarketAsset)
              //  .OrderBy(ma => ma.Name)   alfabetik olmasını istemiyorsak
                .ToListAsync();
        }

        public async Task<MarketAsset> AddTrackedAssetAsync(int userId, string symbol, int? sortOrder = null)   // sıralama için eklenen parametre
        {
            // 1. Bu sembole sahip varlık veritabanında var mı?
            var asset = await _context.MarketAssets.FirstOrDefaultAsync(ma => ma.Symbol == symbol);

            // 2. Yoksa, API'den arayıp bul ve veritabanına kaydet.
            if (asset == null)
            {
                var searchResults = await _marketDataService.SearchAssetsAsync(symbol);
                asset = searchResults.FirstOrDefault(sr => sr.Symbol.Equals(symbol, StringComparison.OrdinalIgnoreCase));

                if (asset == null) throw new InvalidOperationException($"'{symbol}' sembolü ile bir varlık bulunamadı.");

                // Aramadan gelen varlığı veritabanına ekle 
                // Bulunan YENİ varlığı, ilişki kurmadan ÖNCE veritabanına ekle ve KAYDET.
                // Bu, EF Core'un varlığa gerçek bir ID atamasını sağlar.
                _context.MarketAssets.Add(asset);
                // SaveChangesAsync burada çağrılmıyor, aşağıda toplu halde yapılacak.
                await _context.SaveChangesAsync(); // <-- Hatanın çözümündeki en kritik adım!
            }

            // 3. Kullanıcının bu varlığı zaten takip edip etmediğini kontrol et.
            var alreadyTracked = await _context.UserTrackedAssets
                .AnyAsync(uta => uta.UserId == userId && uta.MarketAssetId == asset.Id);



            if (alreadyTracked) return asset;

            int finalSortOrder;
            if (sortOrder.HasValue)
            {
                // Eğer bir sıra numarası belirtilmişse (varsayılan liste eklenirken), onu kullan.
                finalSortOrder = sortOrder.Value;
            }
            else
            {
                // Eğer belirtilmemişse (kullanıcı aramadan ekliyorsa), mevcut en büyük sıra numarasını bulup 1 ekle.
                var maxSortOrder = await _context.UserTrackedAssets
                    .Where(uta => uta.UserId == userId)
                    .Select(uta => (int?)uta.SortOrder) // Max'in boş listede çalışması için nullable int'e çevir
                    .MaxAsync();
                finalSortOrder = (maxSortOrder ?? -1) + 1; // Eğer liste boşsa -1+1=0 ile başlar.
            }

            var newTracking = new UserTrackedAsset
            {
                UserId = userId,
                MarketAssetId = asset.Id,
                TrackedAt = DateTime.UtcNow,
                SortOrder = finalSortOrder // Hesaplanmış sıra numarasını ata
            };
            _context.UserTrackedAssets.Add(newTracking);
            await _context.SaveChangesAsync();

            return asset;
        }

        public async Task<bool> RemoveTrackedAssetAsync(int userId, string symbol)
        {
            var asset = await _context.MarketAssets.FirstOrDefaultAsync(ma => ma.Symbol == symbol);

            if (asset == null) return false;

            var trackingToRemove = await _context.UserTrackedAssets
                .FirstOrDefaultAsync(uta => uta.UserId == userId && uta.MarketAssetId == asset.Id);

            if (trackingToRemove == null) return false;

            _context.UserTrackedAssets.Remove(trackingToRemove);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}