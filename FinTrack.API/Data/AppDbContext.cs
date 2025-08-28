using FinTrack.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Category> Categories { get; set; }


        public DbSet<MarketAsset> MarketAssets { get; set; }

        public DbSet<TimeDeposit> TimeDeposits { get; set; }
        public DbSet<Loan> Loans { get; set; }
        public DbSet<UserAsset> UserAssets { get; set; }


        // YENİ EKLENDİ: Yeni tablo için DbSet
        public DbSet<UserTrackedAsset> UserTrackedAssets { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User konfigürasyonu
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);

                // Bu, Id'nin veritabanında otomatik olarak
                // oluşturulacağını (auto-incrementing) belirtir. Kayıt hatasını çözer.
                entity.Property(e => e.Id).ValueGeneratedOnAdd();

                entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.FirstName).HasMaxLength(50);
                entity.Property(e => e.LastName).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.IsActive).HasDefaultValue(true);

                // Unique index oluştur
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.Username).IsUnique();
            });

            // Account konfigürasyonu
            modelBuilder.Entity<Account>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.AccountType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Balance).HasColumnType("decimal(18, 2)");
                entity.Property(e => e.Currency).IsRequired().HasMaxLength(3);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.IsActive).HasDefaultValue(true);

                // IBAN'ın boş olmayan değerler için benzersiz olmasını sağlayan filtreli index
                entity.HasIndex(e => e.Iban).IsUnique().HasFilter("\"Iban\" IS NOT NULL AND \"Iban\" <> ''");

                // İlişki konfigürasyonu
                entity.HasOne(e => e.User)
                      .WithMany(u => u.Accounts)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Transaction konfigürasyonu
            modelBuilder.Entity<Transaction>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)").IsRequired();
                entity.Property(e => e.Description).HasMaxLength(255);
                entity.Property(e => e.TransactionDate).IsRequired();
                entity.Property(e => e.Type).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

                // İlişki konfigürasyonu
                entity.HasOne(e => e.Account)
                      .WithMany(a => a.Transactions)
                      .HasForeignKey(e => e.AccountId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Category)
                      .WithMany(c => c.Transactions)
                      .HasForeignKey(e => e.CategoryId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.User)
                      .WithMany(u => u.Transactions)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Category konfigürasyonu
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Description).HasMaxLength(255);
                entity.Property(e => e.IconName).HasMaxLength(50);
                entity.Property(e => e.Color).HasMaxLength(20);
            });


            // AppDbContext.cs - OnModelCreating içinde
            modelBuilder.Entity<MarketAsset>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Symbol).IsRequired().HasMaxLength(50); // Uzunluk artırılabilir
                entity.Property(e => e.Name).IsRequired().HasMaxLength(150); // Uzunluk artırılabilir
                entity.HasIndex(e => e.Symbol).IsUnique();
                entity.Property(e => e.SourceApi).HasMaxLength(50); // Yeni alan
                entity.Property(e => e.ApiSymbol).HasMaxLength(100); // Yeni alan

                // KESİN ÇÖZÜM 1: 'Exchange' sütununun veritabanında NULL olmasına izin ver.
                // Bu, 'violates not-null constraint' hatasını çözecektir.
                entity.Property(e => e.Exchange).IsRequired(false);
                entity.Property(e => e.Currency).HasMaxLength(10).IsRequired(false); 
            });



            // YENİ EKLENDİ: UserTrackedAsset tablosunun yapılandırması
            modelBuilder.Entity<UserTrackedAsset>(entity =>
            {
                // UserId ve MarketAssetId'den oluşan bir bileşik birincil anahtar tanımlıyoruz.
                // Bu, bir kullanıcının aynı varlığı birden fazla kez takip edememesini sağlar.
                entity.HasKey(uta => new { uta.UserId, uta.MarketAssetId });

                // User ile olan ilişki
                entity.HasOne(uta => uta.User)
                      .WithMany(u => u.TrackedAssets)
                      .HasForeignKey(uta => uta.UserId)
                      .OnDelete(DeleteBehavior.Cascade); // Kullanıcı silinirse, takip kayıtları da silinir.

                // MarketAsset ile olan ilişki
                entity.HasOne(uta => uta.MarketAsset)
                      .WithMany(ma => ma.TrackingUsers)
                      .HasForeignKey(uta => uta.MarketAssetId)
                      .OnDelete(DeleteBehavior.Cascade); // Varlık silinirse, takip kayıtları da silinir.
            });



            // Örnek kategori verileri
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Maaş", Description = "İş geliri", IconName = "work", Color = "#4CAF50" },
                new Category { Id = 2, Name = "Yemek", Description = "Market ve dışarıda yemek", IconName = "restaurant", Color = "#FF9800" },
                new Category { Id = 3, Name = "Ulaşım", Description = "Toplu taşıma ve yakıt", IconName = "directions_car", Color = "#2196F3" },
                new Category { Id = 4, Name = "Eğlence", Description = "Filmler, oyunlar ve aktiviteler", IconName = "movie", Color = "#E91E63" },
                new Category { Id = 5, Name = "Alışveriş", Description = "Giyim ve genel alışveriş", IconName = "shopping_cart", Color = "#9C27B0" },
                new Category { Id = 6, Name = "Faturalar", Description = "Düzenli ödemeler ve faturalar", IconName = "receipt", Color = "#F44336" },
                new Category { Id = 7, Name = "Konut", Description = "Kira veya mortgage ödemeleri", IconName = "home", Color = "#795548" },
                new Category { Id = 8, Name = "Sağlık", Description = "Sağlık harcamaları", IconName = "local_hospital", Color = "#00BCD4" },
                new Category { Id = 9, Name = "Yatırım", Description = "Hisse senetleri ve yatırımlar", IconName = "trending_up", Color = "#607D8B" },
                new Category { Id = 10, Name = "Diğer", Description = "Çeşitli harcamalar", IconName = "more_horiz", Color = "#9E9E9E" }
            );


            modelBuilder.Entity<TimeDeposit>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PrincipalAmount).HasColumnType("decimal(18, 2)");
                entity.Property(e => e.InterestRate).HasColumnType("decimal(5, 4)");
                entity.Property(e => e.MaturityAmount).HasColumnType("decimal(18, 2)");

                entity.HasOne(e => e.User)
                      .WithMany() // Bir kullanıcının birden çok mevduatı olabilir.
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.SourceAccount)
                      .WithMany() // Bir hesabın birden çok mevduat işlemi olabilir.
                      .HasForeignKey(e => e.SourceAccountId)
                      .OnDelete(DeleteBehavior.Restrict); // Hesap silinirse mevduat kaydı kalmalı.
            });

            modelBuilder.Entity<Loan>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.LoanType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PrincipalAmount).HasColumnType("decimal(18, 2)");
                entity.Property(e => e.InterestRate).HasColumnType("decimal(5, 4)");
                entity.Property(e => e.MonthlyPayment).HasColumnType("decimal(18, 2)");
                entity.Property(e => e.TotalRepayment).HasColumnType("decimal(18, 2)");

                entity.HasOne(e => e.User)
                      .WithMany() // Bir kullanıcının birden çok kredisi olabilir.
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.TargetAccount)
                      .WithMany()
                      .HasForeignKey(e => e.TargetAccountId)
                      .OnDelete(DeleteBehavior.Restrict);
            });



        }
    }
}