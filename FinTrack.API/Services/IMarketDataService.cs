using FinTrack.API.Models;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public class AssetPriceInfo
    {
        public string Symbol { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Currency { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; }
        public decimal? Change { get; set; } // Günlük değişim
        public decimal? ChangePercent { get; set; } // Günlük yüzde değişim
    }
    // Artık sistemin 3 ana görevi var.
    public interface IMarketDataService
    {
        // Verilen varlık bilgilerine göre ilgili API'den fiyatı çeker
        Task<AssetPriceInfo> GetGenericAssetPriceAsync(string userFacingSymbol, AssetType assetType, string apiSymbolForService, string sourceApiForService);

        // Verilen sorgu metnine göre varlıkları arar
        Task<List<MarketAsset>> SearchAssetsAsync(string query);

        // Varsayılan döviz kurlarını çeker
        Task<List<AssetPriceInfo>> GetCurrencyRatesAsync(string baseCurrency = "USD");

        // TCMB politika faizini çeker
        Task<double> GetTCMBPolicyRateAsync();
    }
    
}