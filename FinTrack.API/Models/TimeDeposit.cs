// Konum: FinTrack.API/Models/TimeDeposit.cs
using System;
namespace FinTrack.API.Models
{

    // Vade sonu aksiyonları için enum
    public enum MaturityAction
    {
        CloseAndTransfer,   // Hesabı kapat, anapara ve faizi vadesize aktar
        RenewPrincipal,     // Anaparayı yenile, faizi vadesize aktar
        RenewAll            // Anapara ve faizi birlikte yenile (bileşik)
    }

    public class TimeDeposit
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int SourceAccountId { get; set; } // Paranın çekildiği hesap
        public decimal PrincipalAmount { get; set; } // Anapara
        public decimal InterestRate { get; set; } // Yıllık faiz oranı (örn: 0.45 for 45%)
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal MaturityAmount { get; set; } // Vade sonu anapara + faiz tutarı
        public bool IsActive { get; set; } = true; // Vade sonunda false olabilir


        public MaturityAction MaturityAction { get; set; }

        public virtual User User { get; set; }
        public virtual Account SourceAccount { get; set; }
    }
}