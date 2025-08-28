// Konum: FinTrack.API/FinTrack.API/Controllers/UserAssetsController.cs
using FinTrack.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FinTrack.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/user/assets")]
    public class UserAssetsController : ControllerBase
    {
        private readonly IUserAssetService _userAssetService;

        public UserAssetsController(IUserAssetService userAssetService)
        {
            _userAssetService = userAssetService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        [HttpGet]
        public async Task<IActionResult> GetMyTrackedAssets()
        {
            var userId = GetUserId();
            var assets = await _userAssetService.GetTrackedAssetsAsync(userId);
            return Ok(assets);
        }

        [HttpPost("{symbol}")]
        public async Task<IActionResult> AddAssetToWatchlist(string symbol)
        {
            var decodedSymbol = WebUtility.UrlDecode(symbol);
            var userId = GetUserId();

            try
            {
                var addedAsset = await _userAssetService.AddTrackedAssetAsync(userId, decodedSymbol);
                return Ok(addedAsset);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{symbol}")]
        public async Task<IActionResult> RemoveAssetFromWatchlist(string symbol)
        {
            var decodedSymbol = WebUtility.UrlDecode(symbol);
            var userId = GetUserId();

            var success = await _userAssetService.RemoveTrackedAssetAsync(userId, decodedSymbol);
            if (!success) return NotFound(new { message = "Takip edilen varlık bulunamadı." });

            return NoContent();
        }
    }
}