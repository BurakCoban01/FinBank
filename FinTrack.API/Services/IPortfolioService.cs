// Konum: FinTrack.API/Services/IPortfolioService.cs
using FinTrack.API.DTOs;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public interface IPortfolioService
    {
        Task<PortfolioSummaryDto> GetPortfolioSummaryAsync(int userId);
    }
}
