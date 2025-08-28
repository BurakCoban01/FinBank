
using System;
using System.Collections.Generic;

namespace FinTrack.API.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }

        // İlişkiler
        public virtual ICollection<Account> Accounts { get; set; } = new List<Account>();
        public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

        // Kullanıcının takip ettiği varlıklar için koleksiyon
        public virtual ICollection<UserTrackedAsset> TrackedAssets { get; set; } = new List<UserTrackedAsset>();
    }
}