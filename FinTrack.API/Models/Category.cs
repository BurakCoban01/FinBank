using System.Collections.Generic;

namespace FinTrack.API.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string IconName { get; set; }
        public string Color { get; set; }

        // İlişkiler
        public virtual ICollection<Transaction> Transactions { get; set; }
    }
}