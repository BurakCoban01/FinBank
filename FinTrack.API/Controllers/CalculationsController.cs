// Konum: FinTrack.API/Controllers/CalculationsController.cs
using FinTrack.API.DTOs;
using FinTrack.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinTrack.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CalculationsController : ControllerBase
    {
        private readonly ILoanService _loanService;
        private readonly ITimeDepositService _timeDepositService;

        public CalculationsController(ILoanService loanService, ITimeDepositService timeDepositService)
        {
            _loanService = loanService;
            _timeDepositService = timeDepositService;
        }

        [HttpPost("loan")]
        public IActionResult CalculateLoan([FromBody] LoanCalculationRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = _loanService.CalculateLoan(dto);
            return Ok(result);
        }

        [HttpPost("deposit")]
        public async Task<IActionResult> CalculateDeposit([FromBody] DepositCalculationRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _timeDepositService.CalculateDeposit(dto);
            return Ok(result);
        }
    }
}
