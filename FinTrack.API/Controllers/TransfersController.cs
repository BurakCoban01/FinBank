// FinTrack.API/Controllers/TransfersController.cs
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
    public class TransfersController : ControllerBase
    {
        private readonly ITransferService _transferService;

        public TransfersController(ITransferService transferService)
        {
            _transferService = transferService;
        }

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

        [HttpGet("verify-iban/{iban}")]
        public async Task<IActionResult> VerifyIban(string iban)
        {
            var maskedName = await _transferService.GetRecipientNameByIbanAsync(iban);
            if (maskedName == null)
            {
                return NotFound(new { message = "Bu IBAN'a ait bir hesap bulunamadı." });
            }
            return Ok(new { name = maskedName });
        }

        [HttpPost("internal")]
        public async Task<IActionResult> TransferBetweenAccounts([FromBody] TransferDto transferDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = GetUserId();
                var result = await _transferService.TransferBetweenUserAccounts(userId, transferDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("user-to-user")]
        public async Task<IActionResult> TransferToAnotherUser([FromBody] UserTransferRequestDto transferRequestDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = GetUserId();
                var result = await _transferService.TransferToAnotherUser(userId, transferRequestDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
