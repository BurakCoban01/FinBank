using System.Collections.Generic;
using System.Threading.Tasks;
using FinTrack.API.DTOs;

namespace FinTrack.API.Services
{
    public interface IAccountService
    {
        Task<List<AccountDto>> GetAccountsByUserIdAsync(int userId);
        Task<AccountDto> GetAccountByIdAsync(int accountId, int userId);
        Task<AccountDto> CreateAccountAsync(CreateAccountDto createAccountDto, int userId);
        Task<bool> UpdateAccountAsync(int accountId, UpdateAccountDto updateAccountDto, int userId);
        Task<bool> DeleteAccountAsync(int accountId, int userId);
    }
}