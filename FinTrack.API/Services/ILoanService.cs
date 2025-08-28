// Konum: FinTrack.API/Services/ILoanService.cs
using FinTrack.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public interface ILoanService
    {
        Task<List<LoanDto>> GetLoansByUserIdAsync(int userId);
        Task<LoanDto> CreateLoanAsync(CreateLoanDto dto, int userId);
        LoanCalculationResponseDto CalculateLoan(LoanCalculationRequestDto dto);
    }
}