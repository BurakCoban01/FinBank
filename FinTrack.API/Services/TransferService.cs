// FinTrack.API/Services/TransferService.cs
using FinTrack.API.Data;
using FinTrack.API.DTOs;
using FinTrack.API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;

namespace FinTrack.API.Services
{
    public class TransferService : ITransferService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public TransferService(AppDbContext context, IHttpContextAccessor httpContextAccessor, IMapper mapper)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
        }

        private string GetUserId()
        {
            var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                throw new InvalidOperationException("User ID not found in token.");
            }
            return userId;
        }

        public async Task<string> GetRecipientNameByIbanAsync(string iban)
        {
            if (string.IsNullOrWhiteSpace(iban))
                return null;

            var account = await _context.Accounts
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.Iban == iban && a.IsActive);

            if (account == null)
                return null;

            var firstName = account.User.FirstName;
            var lastName = account.User.LastName;

            var maskedFirstName = firstName.Length > 2 ? $"{firstName.Substring(0, 2)}{new string('*', firstName.Length - 2)}" : firstName;
            var maskedLastName = lastName.Length > 2 ? $"{lastName.Substring(0, 2)}{new string('*', lastName.Length - 2)}" : lastName;

            return $"{maskedFirstName} {maskedLastName}";
        }

        public async Task<TransactionDto> TransferBetweenUserAccounts(string userId, TransferDto transferDto)
        {
            using var dbTransaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var fromAccount = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == transferDto.FromAccountId && a.UserId.ToString() == userId && a.IsActive);
                var toAccount = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == transferDto.ToAccountId && a.UserId.ToString() == userId && a.IsActive);

                if (fromAccount == null || toAccount == null) throw new Exception("Bir veya daha fazla hesap bulunamadı veya size ait değil.");
                if (fromAccount.Id == toAccount.Id) throw new Exception("Aynı hesaba transfer yapılamaz.");
                if (fromAccount.Balance < transferDto.Amount) throw new Exception("Yetersiz bakiye.");
                if (fromAccount.Currency != toAccount.Currency) throw new Exception("Hesaplar arası para birimi farklılığı nedeniyle transfer yapılamaz.");

                fromAccount.Balance -= transferDto.Amount;
                toAccount.Balance += transferDto.Amount;

                var withdrawal = new Transaction
                {
                    AccountId = fromAccount.Id,
                    UserId = int.Parse(userId),
                    Amount = -transferDto.Amount,
                    Description = $"Giden Transfer: {toAccount.Name}",
                    TransactionDate = DateTime.UtcNow,
                    Type = TransactionType.GidenTransfer,
                    CategoryId = null
                };

                var deposit = new Transaction
                {
                    AccountId = toAccount.Id,
                    UserId = int.Parse(userId),
                    Amount = transferDto.Amount,
                    Description = $"Gelen Transfer: {fromAccount.Name}",
                    TransactionDate = DateTime.UtcNow,
                    Type = TransactionType.GelenTransfer,
                    CategoryId = null
                };

                _context.Transactions.Add(withdrawal);
                _context.Transactions.Add(deposit);

                await _context.SaveChangesAsync();
                await dbTransaction.CommitAsync();

                return _mapper.Map<TransactionDto>(withdrawal);
            }
            catch (Exception)
            {
                await dbTransaction.RollbackAsync();
                throw;
            }
        }

        public async Task<TransactionDto> TransferToAnotherUser(string userId, UserTransferRequestDto transferRequestDto)
        {
            using var dbTransaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var fromAccount = await _context.Accounts.Include(a => a.User).FirstOrDefaultAsync(a => a.Id == transferRequestDto.FromAccountId && a.UserId.ToString() == userId && a.IsActive);
                if (fromAccount == null) throw new Exception("Kaynak hesap bulunamadı veya size ait değil.");
                if (fromAccount.Balance < transferRequestDto.Amount) throw new Exception("Yetersiz bakiye.");

                var recipientAccount = await _context.Accounts.Include(a => a.User).FirstOrDefaultAsync(a => a.Iban == transferRequestDto.RecipientIban && a.IsActive);
                if (recipientAccount == null) throw new Exception("Alıcı IBAN'ına ait bir hesap bulunamadı.");
                
                var recipientFullName = $"{recipientAccount.User.FirstName} {recipientAccount.User.LastName}".Trim();
                if (!recipientFullName.Equals(transferRequestDto.RecipientName, StringComparison.OrdinalIgnoreCase)) throw new Exception("Alıcı adı IBAN ile eşleşmiyor.");
                if (fromAccount.Currency != recipientAccount.Currency) throw new Exception("Para birimi uyuşmazlığı nedeniyle transfer gerçekleştirilemiyor.");
                if (fromAccount.UserId == recipientAccount.UserId) throw new Exception("Kendi hesabınıza bu ekrandan transfer yapamazsınız. Lütfen 'Hesaplarım Arası Transfer' ekranını kullanın.");

                fromAccount.Balance -= transferRequestDto.Amount;
                recipientAccount.Balance += transferRequestDto.Amount;

                var withdrawalDesc = $"EFT/Havale Gönderim: {recipientFullName} ({transferRequestDto.RecipientIban}) - {transferRequestDto.Description}";
                var depositDesc = $"EFT/Havale Alım: {fromAccount.User.FirstName} {fromAccount.User.LastName} - {transferRequestDto.Description}";

                var withdrawal = new Transaction
                {
                    AccountId = fromAccount.Id,
                    UserId = int.Parse(userId),
                    Amount = -transferRequestDto.Amount,
                    Description = withdrawalDesc,
                    TransactionDate = DateTime.UtcNow,
                    Type = TransactionType.EFTGonderim,
                    CategoryId = null
                };

                var deposit = new Transaction
                {
                    AccountId = recipientAccount.Id,
                    UserId = recipientAccount.UserId,
                    Amount = transferRequestDto.Amount,
                    Description = depositDesc,
                    TransactionDate = DateTime.UtcNow,
                    Type = TransactionType.EFTAlim,
                    CategoryId = null
                };

                _context.Transactions.Add(withdrawal);
                _context.Transactions.Add(deposit);

                await _context.SaveChangesAsync();
                await dbTransaction.CommitAsync();

                return _mapper.Map<TransactionDto>(withdrawal);
            }
            catch (Exception)
            {
                await dbTransaction.RollbackAsync();
                throw;
            }
        }

    }
}