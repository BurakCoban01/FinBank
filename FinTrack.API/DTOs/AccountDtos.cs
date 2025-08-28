using System;
using System.ComponentModel.DataAnnotations;

namespace FinTrack.API.DTOs
{
    public class AccountDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty;
        public decimal Balance { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string Iban { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateAccountDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string AccountType { get; set; } = string.Empty;

        [Required]
        public decimal Balance { get; set; }

        [Required]
        [StringLength(3)]
        public string Currency { get; set; } = string.Empty;
    }

    public class UpdateAccountDto
    {
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(50)]
        public string AccountType { get; set; } = string.Empty;

        public decimal? Balance { get; set; }

        [StringLength(3)]
        public string Currency { get; set; } = string.Empty;

        public bool? IsActive { get; set; }
    }
}