// Konum: FinTrack.API/Controllers/PortfolioController.cs
using FinTrack.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FinTrack.API.Controllers
{
    [Authorize] // Bu controller'a erişim için kimlik doğrulaması zorunlu
    [ApiController]
    [Route("api/[controller]")]
    public class PortfolioController : ControllerBase
    {
        private readonly IPortfolioService _portfolioService;

        public PortfolioController(IPortfolioService portfolioService)
        {
            _portfolioService = portfolioService;
        }

        private int GetUserIdFromClaims()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
            {
                throw new UnauthorizedAccessException("User ID could not be determined from the authentication token.");
            }
            return userId;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetPortfolioSummary()
        {
            try
            {
                var userId = GetUserIdFromClaims();
                var summary = await _portfolioService.GetPortfolioSummaryAsync(userId);
                return Ok(summary);
            }
            catch (System.Exception ex)
            {
                // Hata loglanabilir
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Portföy özeti alınırken bir hata oluştu." });
            }
        }
    }
}
