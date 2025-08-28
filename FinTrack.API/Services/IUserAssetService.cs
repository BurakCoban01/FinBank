// Konum: FinTrack.API/FinTrack.API/Services/IUserAssetService.cs
using System.Collections.Generic;
using System.Threading.Tasks;
using FinTrack.API.Models;

namespace FinTrack.API.Services
{
    public interface IUserAssetService
    {
        Task<List<MarketAsset>> GetTrackedAssetsAsync(int userId);

        Task<MarketAsset> AddTrackedAssetAsync(int userId, string symbol, int? sortOrder = null);  // listelerde varlıkların sıralanması için
        Task<bool> RemoveTrackedAssetAsync(int userId, string symbol);
    }
}