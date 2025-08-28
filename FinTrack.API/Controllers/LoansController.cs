// Konum: FinTrack.API/Controllers/LoansController.cs
using FinTrack.API.DTOs;
using FinTrack.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FinTrack.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class LoansController : ControllerBase
    {
        private readonly ILoanService _loanService;

        public LoansController(ILoanService loanService)
        {
            _loanService = loanService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        [HttpGet]
        public async Task<IActionResult> GetMyLoans()
        {
            var userId = GetUserId();
            var loans = await _loanService.GetLoansByUserIdAsync(userId);
            return Ok(loans);
        }

        [HttpPost]
        public async Task<IActionResult> CreateLoan([FromBody] CreateLoanDto dto)
        {
            var userId = GetUserId();

            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var createdLoan = await _loanService.CreateLoanAsync(dto, userId);
                return CreatedAtAction(nameof(GetMyLoans), new { /* id = createdLoan.Id */ }, createdLoan);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, "Kredi oluşturulurken sunucu tarafında bir hata oluştu.");
            }
        }
    }
}