using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace FinTrack.API.Models
{
    public class UserAsset
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int MarketAssetId { get; set; }
        
        [Column(TypeName = "decimal(18, 8)")]
        public decimal Quantity { get; set; }

        [Column(TypeName = "decimal(18, 8)")]
        public decimal AverageCost { get; set; }

        // Bu varlık için kullanıcının ana para birimi (örn: TRY) cinsinden toplam maliyet
        [Column(TypeName = "decimal(18, 8)")]
        public decimal TotalCostInUserCurrency { get; set; }

        public DateTime LastUpdated { get; set; }

        // Navigation properties
        public virtual User User { get; set; }
        public virtual MarketAsset MarketAsset { get; set; }
    }
}
