using System;
using System.ComponentModel.DataAnnotations;
using FinTrack.API.Models;

namespace FinTrack.API.DTOs
{
    public class TransactionDto
    {
        public int Id { get; set; }
        public int AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public string AccountCurrency { get; set; } = string.Empty;
        public int? CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string CategoryColor { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime TransactionDate { get; set; }
        public TransactionType Type { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateTransactionDto
    {
        [Required]
        public int AccountId { get; set; }

        public int? CategoryId { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [StringLength(255)]
        public string Description { get; set; } = string.Empty;

        public DateTime? TransactionDate { get; set; }

        [Required]
        public TransactionType Type { get; set; }
    }

    public class UpdateTransactionDto
    {
        public int? AccountId { get; set; }
        public int? CategoryId { get; set; }
        public decimal? Amount { get; set; }

        [StringLength(255)]
        public string Description { get; set; } = string.Empty;

        public DateTime? TransactionDate { get; set; }
        public TransactionType? Type { get; set; }
    }

    public class TransactionSummaryDto
    {
        public decimal TotalIncome { get; set; }
        public decimal TotalExpense { get; set; }
        public decimal NetBalance { get; set; }
        public int TransactionCount { get; set; }
    }


    public class CreateDepositWithdrawalDto
    {
        [Required]
        public int AccountId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Tutar pozitif olmalıdır.")]
        public decimal Amount { get; set; }

        [StringLength(255)]
        public string Description { get; set; } = string.Empty;
    }
}