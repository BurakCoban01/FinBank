// Konum: FinTrack.API/DTOs/CreateInvestmentTransactionDto.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace FinTrack.API.DTOs
{
    public class CreateInvestmentTransactionDto
    {
        [Required]
        public int AccountId { get; set; }

        [Required]
        public int MarketAssetId { get; set; }

        [Required]
        [Range(0.00000001, double.MaxValue, ErrorMessage = "Miktar 0'dan büyük olmalıdır.")]
        public decimal Quantity { get; set; }

        [Required]
        [Range(0.00000001, double.MaxValue, ErrorMessage = "Fiyat 0'dan büyük olmalıdır.")]
        public decimal Price { get; set; }

        [Required]
        public string PriceCurrency { get; set; } // Örn: "USD", "TRY"

        [Required]
        public DateTime TransactionDate { get; set; }

        [Required]
        public string TransactionType { get; set; } // "Buy" veya "Sell"
    }
}
