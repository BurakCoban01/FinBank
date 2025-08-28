namespace FinTrack.API.Models
{
    public enum AssetType
    {
        Stock,      // Hisse Senedi
        Currency,   // Döviz
        Crypto,     // Kripto Para
        Index,      // Endeks
        Fund        // Fon
    }

    public class MarketAsset
    {
        public int Id { get; set; }
        public string Symbol { get; set; } // Örneğin: "AAPL", "EURUSD=X", "BTC-USD", "^SPX"
        public string Name { get; set; }   // Örneğin: "Apple Inc.", "EUR/USD", "Bitcoin", "S&P 500"
        public AssetType Type { get; set; }
        public string? Exchange { get; set; } // Örneğin: "NASDAQ", "CURRENCY", "BIST" (Borsa İstanbul)
        public string? Currency { get; set; } // Varlığın işlem gördüğü para birimi (örn: USD, TRY, BTC)


        public string SourceApi { get; set; } // "Finnhub", "TwelveData"
        public string ApiSymbol { get; set; } // API'nin beklediği sembol (örn: OANDA:EUR_USD)


        // Bu varlığı takip eden kullanıcılar için koleksiyon
        public virtual ICollection<UserTrackedAsset> TrackingUsers { get; set; } = new List<UserTrackedAsset>();
    }
}