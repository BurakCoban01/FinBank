// FinTrack.API/DTOs/UserTransferRequestDto.cs
using System.ComponentModel.DataAnnotations;

namespace FinTrack.API.DTOs
{
    public class UserTransferRequestDto
    {
        [Required]
        public int FromAccountId { get; set; }

        [Required(ErrorMessage = "Alıcı IBAN adresi gereklidir.")]
        [RegularExpression(@"^TR\d{24}$", ErrorMessage = "Geçerli bir TR IBAN adresi giriniz.")]
        public string RecipientIban { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Alıcı adı gereklidir.")]
        public string RecipientName { get; set; } = string.Empty;

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Tutar 0'dan büyük olmalıdır.")]
        public decimal Amount { get; set; }

        [MaxLength(200)]
        public string? Description { get; set; }
    }
}
