using AutoMapper;
using FinTrack.API.Data;
using FinTrack.API.DTOs;
using FinTrack.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IMarketDataService _marketDataService;
        private readonly ILogger<TransactionService> _logger;

        public TransactionService(AppDbContext context, IMapper mapper, IMarketDataService marketDataService, ILogger<TransactionService> logger)
        {
            _context = context;
            _mapper = mapper;
            _marketDataService = marketDataService;
            _logger = logger;
        }

        public async Task<List<TransactionDto>> GetTransactionsByUserIdAsync(int userId)
        {
            var transactions = await _context.Transactions
                .Include(t => t.Account)
                .Include(t => t.Category)
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.TransactionDate)
                .ToListAsync();
            return _mapper.Map<List<TransactionDto>>(transactions);
        }

        public async Task<TransactionDto> GetTransactionByIdAsync(int transactionId, int userId)
        {
            var transaction = await _context.Transactions
                .Include(t => t.Account)
                .Include(t => t.Category)
                .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId);
            return _mapper.Map<TransactionDto>(transaction);
        }

        public async Task<TransactionDto> CreateTransactionAsync(CreateTransactionDto createTransactionDto, int userId)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == createTransactionDto.AccountId && a.UserId == userId);
            if (account == null)
            {
                throw new UnauthorizedAccessException("Hesap bulunamadı veya kullanıcıya ait değil.");
            }

            var transaction = _mapper.Map<Transaction>(createTransactionDto);
            transaction.UserId = userId;
            transaction.CreatedAt = DateTime.UtcNow;
            if (!createTransactionDto.TransactionDate.HasValue)
            {
                transaction.TransactionDate = DateTime.UtcNow;
            }

            _context.Transactions.Add(transaction);

            if (transaction.Type == TransactionType.Income)
            {
                account.Balance += transaction.Amount;
            }
            else if (transaction.Type == TransactionType.Expense)
            {
                account.Balance -= transaction.Amount;
            }

            _context.Accounts.Update(account);
            await _context.SaveChangesAsync();

            var createdTransactionWithDetails = await _context.Transactions
                .Include(t => t.Account)
                .Include(t => t.Category)
                .FirstOrDefaultAsync(t => t.Id == transaction.Id);

            return _mapper.Map<TransactionDto>(createdTransactionWithDetails);
        }

        public async Task<bool> UpdateTransactionAsync(int transactionId, UpdateTransactionDto updateTransactionDto, int userId)
        {
            var transaction = await _context.Transactions
                                .Include(t => t.Account)
                                .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId);

            if (transaction == null) return false;

            var oldAccount = transaction.Account;
            if (oldAccount != null)
            {
                if (transaction.Type == TransactionType.Income) oldAccount.Balance -= transaction.Amount;
                else if (transaction.Type == TransactionType.Expense) oldAccount.Balance += transaction.Amount;
            }

            _mapper.Map(updateTransactionDto, transaction);

            Account newAccount = null;
            if (updateTransactionDto.AccountId.HasValue && updateTransactionDto.AccountId.Value != oldAccount?.Id)
            {
                newAccount = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == updateTransactionDto.AccountId.Value && a.UserId == userId);
                if (newAccount == null) throw new UnauthorizedAccessException("Yeni hesap bulunamadı veya kullanıcıya ait değil.");
                transaction.Account = newAccount;
            }
            else
            {
                newAccount = oldAccount;
            }

            if (newAccount != null)
            {
                if (transaction.Type == TransactionType.Income) newAccount.Balance += transaction.Amount;
                else if (transaction.Type == TransactionType.Expense) newAccount.Balance -= transaction.Amount;
                _context.Accounts.Update(newAccount);
            }
            if (oldAccount != null && oldAccount.Id != newAccount?.Id)
            {
                _context.Accounts.Update(oldAccount);
            }

            _context.Transactions.Update(transaction);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteTransactionAsync(int transactionId, int userId)
        {
            var transaction = await _context.Transactions
                                .Include(t => t.Account)
                                .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId);

            if (transaction == null) return false;

            var account = transaction.Account;
            if (account != null)
            {
                if (transaction.Type == TransactionType.Income)
                {
                    account.Balance -= transaction.Amount;
                }
                else if (transaction.Type == TransactionType.Expense)
                {
                    account.Balance += transaction.Amount;
                }
                _context.Accounts.Update(account);
            }

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<TransactionSummaryDto> GetTransactionSummaryAsync(int userId)
        {
            var transactions = await _context.Transactions
                .Where(t => t.UserId == userId && t.TransactionDate.Month == DateTime.UtcNow.Month && t.TransactionDate.Year == DateTime.UtcNow.Year)
                .ToListAsync();

            var totalIncome = transactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
            var totalExpense = transactions.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);

            return new TransactionSummaryDto
            {
                TotalIncome = totalIncome,
                TotalExpense = totalExpense,
                NetBalance = totalIncome - totalExpense,
                TransactionCount = transactions.Count
            };
        }

        public async Task<TransactionDto> CreateDepositAsync(CreateDepositWithdrawalDto depositDto, int userId)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == depositDto.AccountId && a.UserId == userId && a.IsActive);
            if (account == null)
            {
                throw new UnauthorizedAccessException("Hesap bulunamadı, aktif değil veya kullanıcıya ait değil.");
            }

            var transaction = new Transaction
            {
                AccountId = depositDto.AccountId,
                UserId = userId,
                Amount = depositDto.Amount,
                Description = string.IsNullOrWhiteSpace(depositDto.Description) ? "Para Yatırma" : depositDto.Description,
                TransactionDate = DateTime.UtcNow,
                Type = TransactionType.NakitYatirma,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Transactions.Add(transaction);
            account.Balance += depositDto.Amount;
            _context.Accounts.Update(account);

            await _context.SaveChangesAsync();

            var createdTransactionWithDetails = await _context.Transactions
                .Include(t => t.Account)
                .Include(t => t.Category)
                .FirstOrDefaultAsync(t => t.Id == transaction.Id);

            return _mapper.Map<TransactionDto>(createdTransactionWithDetails);
        }

        public async Task<TransactionDto> CreateWithdrawalAsync(CreateDepositWithdrawalDto withdrawalDto, int userId)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == withdrawalDto.AccountId && a.UserId == userId && a.IsActive);
            if (account == null)
            {
                throw new UnauthorizedAccessException("Hesap bulunamadı, aktif değil veya kullanıcıya ait değil.");
            }

            if (account.Balance < withdrawalDto.Amount)
            {
                throw new InvalidOperationException("Yetersiz bakiye.");
            }

            var transaction = new Transaction
            {
                AccountId = withdrawalDto.AccountId,
                UserId = userId,
                Amount = withdrawalDto.Amount,
                Description = string.IsNullOrWhiteSpace(withdrawalDto.Description) ? "Para Çekme" : withdrawalDto.Description,
                TransactionDate = DateTime.UtcNow,
                Type = TransactionType.NakitCekme,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Transactions.Add(transaction);
            account.Balance -= withdrawalDto.Amount;
            _context.Accounts.Update(account);

            await _context.SaveChangesAsync();

            var createdTransactionWithDetails = await _context.Transactions
                .Include(t => t.Account)
                .Include(t => t.Category)
                .FirstOrDefaultAsync(t => t.Id == transaction.Id);

            return _mapper.Map<TransactionDto>(createdTransactionWithDetails);
        }

        public async Task<TransactionDto> CreateInvestmentTransactionAsync(CreateInvestmentTransactionDto investmentDto, int userId)
        {
            _logger.LogInformation(
                "Starting investment transaction for UserId:{UserId}, AssetId:{AssetId}, Type:{Type}, Qty:{Qty}, Price:{Price} {Currency}",
                userId, investmentDto.MarketAssetId, investmentDto.TransactionType, investmentDto.Quantity, investmentDto.Price, investmentDto.PriceCurrency
            );

            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == investmentDto.AccountId && a.UserId == userId && a.IsActive);
            if (account == null)
                throw new UnauthorizedAccessException("İşlem için kullanılacak hesap bulunamadı, aktif değil veya kullanıcıya ait değil.");

            var marketAsset = await _context.MarketAssets.FindAsync(investmentDto.MarketAssetId);
            if (marketAsset == null)
                throw new InvalidOperationException("İşlem yapılacak piyasa varlığı bulunamadı.");

            decimal totalCostInAccountCurrency;
            string transactionDescription;

            if (investmentDto.PriceCurrency == account.Currency)
            {
                totalCostInAccountCurrency = investmentDto.Quantity * investmentDto.Price;
                transactionDescription = $"{investmentDto.TransactionType} - {investmentDto.Quantity} {marketAsset.Symbol} @ {investmentDto.Price:F4} {investmentDto.PriceCurrency}";
                _logger.LogInformation("No currency conversion needed. Final cost in {AccountCurrency}: {Cost}", account.Currency, totalCostInAccountCurrency);
            }
            else
            {
                var conversionPairSymbol = $"{investmentDto.PriceCurrency}/{account.Currency}";
                _logger.LogInformation("Conversion required. Fetching rate for {Pair}", conversionPairSymbol);

                var conversionRateInfo = await _marketDataService.GetGenericAssetPriceAsync(conversionPairSymbol, AssetType.Currency, null, null);
                if (conversionRateInfo == null || conversionRateInfo.Price <= 0)
                    throw new InvalidOperationException($"'{conversionPairSymbol}' için anlık kur bilgisi alınamadı. İşlem gerçekleştirilemiyor.");

                decimal conversionRate = conversionRateInfo.Price;
                decimal totalCostInPriceCurrency = investmentDto.Quantity * investmentDto.Price;
                totalCostInAccountCurrency = totalCostInPriceCurrency * conversionRate;
                transactionDescription = $"{investmentDto.TransactionType} - {investmentDto.Quantity} {marketAsset.Symbol} @ {investmentDto.Price:F4} {investmentDto.PriceCurrency} (Kur: {conversionRate:F4})";
                _logger.LogInformation("Conversion successful. Rate:{Rate}, Final cost in {AccountCurrency}:{Cost}", conversionRate, account.Currency, totalCostInAccountCurrency);
            }

            var userAsset = await _context.UserAssets.FirstOrDefaultAsync(ua => ua.UserId == userId && ua.MarketAssetId == investmentDto.MarketAssetId);
            
            TransactionType transactionType;

            if (investmentDto.TransactionType.Equals("Buy", StringComparison.OrdinalIgnoreCase))
            {
                transactionType = TransactionType.YatirimAlim;
                if (account.Balance < totalCostInAccountCurrency)
                    throw new InvalidOperationException("Yetersiz bakiye.");
                
                account.Balance -= totalCostInAccountCurrency;

                if (userAsset != null)
                {
                    var newTotalQuantity = userAsset.Quantity + investmentDto.Quantity;
                    var existingTotalOriginalCost = userAsset.AverageCost * userAsset.Quantity;
                    var newTransactionOriginalCost = investmentDto.Price * investmentDto.Quantity;
                    
                    userAsset.AverageCost = (existingTotalOriginalCost + newTransactionOriginalCost) / newTotalQuantity;
                    userAsset.Quantity = newTotalQuantity;
                    userAsset.TotalCostInUserCurrency += totalCostInAccountCurrency;
                    userAsset.LastUpdated = DateTime.UtcNow;
                }
                else
                {
                    userAsset = new UserAsset
                    {
                        UserId = userId,
                        MarketAssetId = investmentDto.MarketAssetId,
                        Quantity = investmentDto.Quantity,
                        AverageCost = investmentDto.Price,
                        TotalCostInUserCurrency = totalCostInAccountCurrency,
                        LastUpdated = DateTime.UtcNow
                    };
                    _context.UserAssets.Add(userAsset);
                }
            }
            else if (investmentDto.TransactionType.Equals("Sell", StringComparison.OrdinalIgnoreCase))
            {
                transactionType = TransactionType.YatirimSatim;
                if (userAsset == null || userAsset.Quantity < investmentDto.Quantity)
                    throw new InvalidOperationException("Satış için yeterli varlık bulunmuyor.");

                account.Balance += totalCostInAccountCurrency;

                decimal costOfSoldPortion = (userAsset.TotalCostInUserCurrency / userAsset.Quantity) * investmentDto.Quantity;
                userAsset.TotalCostInUserCurrency -= costOfSoldPortion;
                userAsset.Quantity -= investmentDto.Quantity;
                userAsset.LastUpdated = DateTime.UtcNow;

                if (userAsset.Quantity == 0)
                {
                    _context.UserAssets.Remove(userAsset);
                }
            }
            else
            {
                throw new InvalidOperationException("Geçersiz işlem türü. Sadece 'Buy' veya 'Sell' olabilir.");
            }

            var transaction = new Transaction
            {
                UserId = userId,
                AccountId = investmentDto.AccountId,
                MarketAssetId = investmentDto.MarketAssetId,
                Type = transactionType,
                Amount = totalCostInAccountCurrency,
                Quantity = investmentDto.Quantity,
                Price = investmentDto.Price,
                Description = transactionDescription,
                TransactionDate = investmentDto.TransactionDate,
                CreatedAt = DateTime.UtcNow,
                CategoryId = null // Yatırım işlemleri artık kategorisiz
            };

            _context.Transactions.Add(transaction);
            _context.Accounts.Update(account);

            await _context.SaveChangesAsync();
            _logger.LogInformation("Transaction and UserAsset changes saved successfully. TransactionId: {TransactionId}", transaction.Id);

            var createdTransactionWithDetails = await _context.Transactions
                .Include(t => t.Account)
                .Include(t => t.MarketAsset)
                .FirstOrDefaultAsync(t => t.Id == transaction.Id);

            return _mapper.Map<TransactionDto>(createdTransactionWithDetails);
        }

        public async Task<(TransactionDto fromTransaction, TransactionDto toTransaction)> CreateTransferAsync(TransferDto transferDto, int userId)
        {
            if (transferDto.FromAccountId == transferDto.ToAccountId)
            {
                throw new InvalidOperationException("Kaynak ve hedef hesap aynı olamaz.");
            }

            var fromAccount = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == transferDto.FromAccountId && a.UserId == userId);
            var toAccount = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == transferDto.ToAccountId && a.UserId == userId);

            if (fromAccount == null || toAccount == null)
            {
                throw new UnauthorizedAccessException("Hesaplardan biri bulunamadı veya kullanıcıya ait değil.");
            }

            if (fromAccount.Balance < transferDto.Amount)
            {
                throw new InvalidOperationException("Yetersiz bakiye.");
            }

            fromAccount.Balance -= transferDto.Amount;
            toAccount.Balance += transferDto.Amount;

            var description = string.IsNullOrWhiteSpace(transferDto.Description)
                ? $"{fromAccount.Name} -> {toAccount.Name} Transfer"
                : transferDto.Description;

            var fromTransaction = new Transaction
            {
                UserId = userId,
                AccountId = fromAccount.Id,
                Type = TransactionType.GidenTransfer,
                Amount = transferDto.Amount,
                Description = $"Kime: {toAccount.Name} - {description}",
                TransactionDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                CategoryId = null
            };

            var toTransaction = new Transaction
            {
                UserId = userId,
                AccountId = toAccount.Id,
                Type = TransactionType.GelenTransfer,
                Amount = transferDto.Amount,
                Description = $"Kimden: {fromAccount.Name} - {description}",
                TransactionDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                CategoryId = null
            };

            _context.Transactions.Add(fromTransaction);
            _context.Transactions.Add(toTransaction);
            _context.Accounts.Update(fromAccount);
            _context.Accounts.Update(toAccount);

            await _context.SaveChangesAsync();

            return (
                _mapper.Map<TransactionDto>(fromTransaction),
                _mapper.Map<TransactionDto>(toTransaction)
            );
        }
    }
}
