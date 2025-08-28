using System;
using System.Collections.Generic;

namespace FinTrack.API.Models
{
    public class Account
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; }
        public string AccountType { get; set; }  // Banka Hesabı, Kredi Kartı, Nakit vb.
        public decimal Balance { get; set; }
        public string Currency { get; set; }
        public string Iban { get; set; } = string.Empty; // IBAN alanı eklendi
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }

        // İlişkiler
        public virtual User User { get; set; }
        public virtual ICollection<Transaction> Transactions { get; set; }
    }
}