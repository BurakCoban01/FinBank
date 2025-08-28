// FinTrack.API/Services/IbanService.cs
using FinTrack.API.Data;
using Microsoft.EntityFrameworkCore;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public class IbanService : IIbanService
    {
        private const string CountryCode = "TR";
        private const string BankCode = "00001"; // Projemiz için varsayılan banka kodu
        private const string ReservedCode = "0"; // Rezerv kod

        private readonly AppDbContext _context;

        public IbanService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<string> GenerateNewIbanAsync(string accountType)
        {
            // Sadece "Banka Hesabı" türündeki hesaplar için IBAN üret
            if (accountType != "Banka Hesabı")
            {
                return string.Empty;
            }

            // 1. Veritabanından yeni, benzersiz bir sıra numarası al
            long seqValue;
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT nextval('account_number_seq')";
                await _context.Database.OpenConnectionAsync();
                var result = await command.ExecuteScalarAsync();
                if (result == null || result == DBNull.Value)
                {
                    throw new InvalidOperationException("Could not retrieve the next value from the account_number_seq sequence.");
                }
                seqValue = Convert.ToInt64(result);
            }

            // 2. BBAN (Temel Banka Hesap Numarası) oluştur
            // Banka Kodu (5) + Rezerv (1) + Hesap Numarası (16) = 22 hane
            var accountNumber = seqValue.ToString().PadLeft(16, '0');
            var bban = $"{BankCode}{ReservedCode}{accountNumber}";

            // 3. Kontrol basamaklarını hesapla
            var checkDigits = CalculateCheckDigits(CountryCode, bban);

            // 4. Tam IBAN'ı oluştur ve döndür
            return $"{CountryCode}{checkDigits:D2}{bban}";
        }

        private int CalculateCheckDigits(string countryCode, string bban)
        {
            // IBAN'ın başına ülke kodu + "00" (yer tutucu) ekle
            var preIban = countryCode + "00" + bban;

            // Harfleri sayısal değerlere dönüştür (A=10, B=11, ...)
            var transformed = new StringBuilder();
            foreach (var ch in preIban)
            {
                if (char.IsLetter(ch))
                {
                    transformed.Append(ch - 'A' + 10);
                }
                else
                {
                    transformed.Append(ch);
                }
            }

            // Mod-97 işlemi (çok büyük sayılarla çalışmak için BigInteger kullanılır)
            var total = BigInteger.Parse(transformed.ToString());
            var remainder = (int)(total % 97);

            // Kontrol basamağını hesapla
            return 98 - remainder;
        }
    }
}