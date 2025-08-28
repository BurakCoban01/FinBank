// Konum: FinTrack.API/Services/ITimeDepositService.cs
using FinTrack.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public interface ITimeDepositService
    {
        Task<List<TimeDepositDto>> GetTimeDepositsByUserIdAsync(int userId);
        Task<TimeDepositDto> CreateTimeDepositAsync(CreateTimeDepositDto dto, int userId);
        Task<bool> CloseDepositEarlyAsync(int depositId, int userId);
        Task<DepositCalculationResponseDto> CalculateDeposit(DepositCalculationRequestDto dto);
    }
}