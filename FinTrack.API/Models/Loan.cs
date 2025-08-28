// Konum: FinTrack.API/Models/Loan.cs
using System;

namespace FinTrack.API.Models
{
    public class Loan
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int TargetAccountId { get; set; } // Kredi tutarının aktarılacağı hesap
        public string LoanType { get; set; } // "İhtiyaç", "Taşıt", "Konut"
        public decimal PrincipalAmount { get; set; } // Çekilen anapara
        public decimal InterestRate { get; set; } // Yıllık faiz oranı (örn: 0.60 for 60%)
        public int TermInMonths { get; set; } // Vade (ay olarak)
        public decimal MonthlyPayment { get; set; } // Aylık taksit tutarı
        public decimal TotalRepayment { get; set; } // Toplam geri ödeme tutarı
        public DateTime StartDate { get; set; }
        public bool IsActive { get; set; } = true;

        public virtual User User { get; set; }
        public virtual Account TargetAccount { get; set; }
    }
}