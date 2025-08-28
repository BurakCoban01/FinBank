// Konum: FinTrack.API/DTOs/TransferDto.cs
using System.ComponentModel.DataAnnotations;

namespace FinTrack.API.DTOs
{
    public class TransferDto
    {
        [Required]
        public int FromAccountId { get; set; }

        [Required]
        public int ToAccountId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Tutar 0'dan büyük olmalıdır.")]
        public decimal Amount { get; set; }

        public string? Description { get; set; }
    }
}
