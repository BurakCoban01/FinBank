using System;
using System.Text.Json.Serialization;

namespace FinTrack.API.Models
{
    public class Transaction
    {
        public int Id { get; set; }
        public int AccountId { get; set; }
        public int? CategoryId { get; set; }
        public int UserId { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public DateTime TransactionDate { get; set; }
        
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public TransactionType Type { get; set; }
        public DateTime CreatedAt { get; set; }

        // Yatırım işlemleri için ek alanlar
        public int? MarketAssetId { get; set; }
        public decimal? Quantity { get; set; }
        public decimal? Price { get; set; }

        // İlişkiler
        public virtual Account Account { get; set; }
        public virtual Category Category { get; set; }
        public virtual User User { get; set; }
        public virtual MarketAsset? MarketAsset { get; set; }
    }

    public enum TransactionType
    {
        Income,
        Expense,
        GidenTransfer,
        GelenTransfer,
        EFTGonderim,
        EFTAlim,
        YatirimAlim,
        YatirimSatim,
        NakitYatirma,
        NakitCekme
    }
}