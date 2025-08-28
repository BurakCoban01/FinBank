// Konum: FinTrack.API/FinTrack.API/Models/UserTrackedAsset.cs
using System;

namespace FinTrack.API.Models
{
    // Bu tablo, hangi kullanıcının hangi market varlığını takip ettiğini tutar.
    public class UserTrackedAsset
    {
        public int UserId { get; set; }
        public virtual User User { get; set; }

        public int MarketAssetId { get; set; }
        public virtual MarketAsset MarketAsset { get; set; }

        // Takip edilmeye başlandığı tarihi tutmak için
        public DateTime TrackedAt { get; set; }

        // Kullanıcının listesindeki her varlığın sırasını tutmak için bu sütunu ekliyoruz
        public int SortOrder { get; set; }
    }
}