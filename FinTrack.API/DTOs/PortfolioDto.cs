
// Konum: FinTrack.API/DTOs/PortfolioDto.cs
using System.Collections.Generic;
using FinTrack.API.Models;

namespace FinTrack.API.DTOs
{
    // Kullanıcının sahip olduğu tek bir varlığın detaylı pozisyon bilgisini tutar
    public class AssetPositionDto
    {
        public int MarketAssetId { get; set; }
        public string Symbol { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public AssetType Type { get; set; }
        public decimal Quantity { get; set; } // Sahip olunan miktar (örn: 10 adet hisse, 0.5 BTC)
        public decimal AverageCost { get; set; } // Ortalama alım maliyeti (birim başına)
        public decimal TotalCost { get; set; } // Toplam maliyet (Quantity * AverageCost)
        public decimal CurrentPrice { get; set; } // Anlık piyasa fiyatı
        public decimal CurrentValue { get; set; } // Anlık toplam değer (Quantity * CurrentPrice)
        public decimal ProfitLoss { get; set; } // Kar/Zarar (CurrentValue - TotalCost)
        public decimal ProfitLossPercentage { get; set; } // Kar/Zarar Yüzdesi
    }

    // Kullanıcının tüm yatırım portföyünün özetini temsil eder
    public class PortfolioSummaryDto
    {
        public decimal TotalValue { get; set; } // Portföyün toplam anlık değeri
        public decimal TotalCost { get; set; } // Portföyün toplam maliyeti
        public decimal TotalProfitLoss { get; set; } // Toplam kar/zarar
        public decimal TotalProfitLossPercentage { get; set; } // Yüzdesel toplam kar/zarar
        public string Currency { get; set; } // Portföyün hesaplandığı ana para birimi
        public List<AssetPositionDto> Positions { get; set; } // Portföydeki varlıkların listesi

        public PortfolioSummaryDto()
        {
            Positions = new List<AssetPositionDto>();
            Currency = "TRY"; // Varsayılan olarak TRY ata
        }
    }
}
