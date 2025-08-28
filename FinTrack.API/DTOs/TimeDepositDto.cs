// Konum: FinTrack.API/DTOs/TimeDepositDtos.cs
using FinTrack.API.Models;
using System;
using System.ComponentModel.DataAnnotations;

namespace FinTrack.API.DTOs
{
    public class TimeDepositDto
    {
        public int Id { get; set; }
        public string SourceAccountName { get; set; }
        public decimal PrincipalAmount { get; set; }
        public decimal InterestRate { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal MaturityAmount { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateTimeDepositDto
    {
        [Required]
        public int SourceAccountId { get; set; }

        [Required]
        [Range(1.0, double.MaxValue, ErrorMessage = "Tutar 0'dan büyük olmalıdır.")]
        public decimal Amount { get; set; }

        [Required]
        [Range(1, 60, ErrorMessage = "Vade 1 ile 60 ay arasında olmalıdır.")]
        public int TermInMonths { get; set; }

        [Required]
        [Range(0.01, 1.0, ErrorMessage = "Yıllık faiz oranı 0.01 ile 1.0 arasında olmalıdır.")]
        public decimal AnnualInterestRate { get; set; }


        [Required]
        public MaturityAction MaturityAction { get; set; }
    }
}