// FinTrack.API/Services/ITransferService.cs
using FinTrack.API.DTOs;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public interface ITransferService
    {
        Task<TransactionDto> TransferBetweenUserAccounts(string userId, TransferDto transferDto);
        Task<TransactionDto> TransferToAnotherUser(string userId, UserTransferRequestDto transferRequestDto);
        Task<string> GetRecipientNameByIbanAsync(string iban);
    }
}
