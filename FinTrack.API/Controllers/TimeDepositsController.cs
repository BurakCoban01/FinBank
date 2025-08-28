// Konum: FinTrack.API/Controllers/TimeDepositsController.cs
using FinTrack.API.DTOs;
using FinTrack.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FinTrack.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TimeDepositsController : ControllerBase
    {
        private readonly ITimeDepositService _timeDepositService;
        private readonly IMarketDataService _marketDataService;

        public TimeDepositsController(ITimeDepositService timeDepositService, IMarketDataService marketDataService)
        {
            _timeDepositService = timeDepositService;
            _marketDataService = marketDataService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        [HttpGet]
        public async Task<IActionResult> GetMyDeposits()
        {
            var userId = GetUserId();
            var deposits = await _timeDepositService.GetTimeDepositsByUserIdAsync(userId);
            return Ok(deposits);
        }

        [HttpPost]
        public async Task<IActionResult> CreateDeposit([FromBody] CreateTimeDepositDto dto)
        {
            var userId = GetUserId();

            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var createdDeposit = await _timeDepositService.CreateTimeDepositAsync(dto, userId);
                return CreatedAtAction(nameof(GetMyDeposits), createdDeposit);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, "Mevduat oluşturulurken bir hata oluştu.");
            }
        }


        [HttpPost("{id}/close-early")]
        public async Task<IActionResult> CloseDepositEarly(int id)
        {
            var userId = GetUserId();

            try
            {
                var success = await _timeDepositService.CloseDepositEarlyAsync(id, userId);
                if (!success)
                {
                    return NotFound(new { message = "Maduat hesabı bulunamadı veya size ait değil." });
                }
                return Ok(new { message = "Mevduat hesabı başarıyla kapatıldı ve anapara hesaba aktarıldı." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, "Hesap kapatılırken bir hata oluştu.");
            }
        }

        [HttpGet("rates")]
        [AllowAnonymous] // Bu endpoint için yetkilendirme gerekmeyebilir
        public async Task<IActionResult> GetDepositRates()
        {
            double policyRate = await _marketDataService.GetTCMBPolicyRateAsync();
            // 1 aylıkta %policyRate, 12 aylık %policyRate - 16 olacak şekilde lineer dağılım
            double totalDrop = 16.0;
            int maxTerm = 12;
            double dropPerMonth = totalDrop / (maxTerm - 1);  // her ay ~1.4545 puan düşecek
            
            var terms = new[] { 1, 3, 6, 12 };

            var rates = terms
                .Select(term =>
                {
                    // 1) İlk raw rate’i hesapla
                    double rawRate = policyRate - dropPerMonth * (term - 1);

                    // 2) En yakın 0.5’e yuvarla
                    double roundedRate = Math.Round(rawRate * 2, MidpointRounding.AwayFromZero) / 2;

                    // 3) İki ondalık basamak formatı etkili olsun diye ekstra Round
                    roundedRate = Math.Round(roundedRate, 2);

                    return new
                    {
                        duration = term,
                        rate = roundedRate
                    };
                }).ToArray();

            return Ok(rates);
        }

    }
}