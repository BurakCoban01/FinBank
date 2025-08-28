using FinTrack.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public interface ITransactionService
    {
        Task<List<TransactionDto>> GetTransactionsByUserIdAsync(int userId);
        Task<TransactionDto> GetTransactionByIdAsync(int transactionId, int userId);
        Task<TransactionDto> CreateTransactionAsync(CreateTransactionDto createTransactionDto, int userId);
        Task<bool> UpdateTransactionAsync(int transactionId, UpdateTransactionDto updateTransactionDto, int userId);
        Task<bool> DeleteTransactionAsync(int transactionId, int userId);
        Task<TransactionSummaryDto> GetTransactionSummaryAsync(int userId);

        Task<TransactionDto> CreateDepositAsync(CreateDepositWithdrawalDto depositDto, int userId);
        Task<TransactionDto> CreateWithdrawalAsync(CreateDepositWithdrawalDto withdrawalDto, int userId);
        Task<TransactionDto> CreateInvestmentTransactionAsync(CreateInvestmentTransactionDto investmentDto, int userId);
        Task<(TransactionDto fromTransaction, TransactionDto toTransaction)> CreateTransferAsync(TransferDto transferDto, int userId);
    }
}