// Konum: FinTrack.API/DTOs/LoanDtos.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace FinTrack.API.DTOs
{
    public class LoanDto
    {
        public int Id { get; set; }
        public string TargetAccountName { get; set; }
        public string LoanType { get; set; }
        public decimal PrincipalAmount { get; set; }
        public decimal InterestRate { get; set; } // Yüzde olarak gönderilecek
        public int TermInMonths { get; set; }
        public decimal MonthlyPayment { get; set; }
        public decimal TotalRepayment { get; set; }

        public decimal TotalInterestPaid { get; set; }
        public DateTime StartDate { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateLoanDto
    {
        [Required]
        public int TargetAccountId { get; set; }

        [Required]
        public string LoanType { get; set; }

        [Required]
        [Range(1000, 5000000, ErrorMessage = "Kredi tutarı 1,000 ile 5,000,000 arasında olmalıdır.")]
        public decimal Amount { get; set; }

        [Required]
        [Range(3, 120, ErrorMessage = "Vade 3 ile 120 ay arasında olmalıdır.")]
        public int TermInMonths { get; set; }

        // Faiz oranı DTO'da değil, serviste vadeye göre belirlenecek.
    }
}