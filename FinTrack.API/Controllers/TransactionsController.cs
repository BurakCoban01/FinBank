using FinTrack.API.DTOs;
using FinTrack.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace FinTrack.API.Controllers
{
    [Authorize] // Bu controller'a erişim için kimlik doğrulaması zorunlu
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly ITransactionService _transactionService;

        public TransactionsController(ITransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        private int GetUserIdFromClaims()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
            {
                // Bu durum [Authorize] attribute'u nedeniyle beklenmez, ancak olursa istisna fırlatmak mantıklıdır.
                throw new UnauthorizedAccessException("User ID could not be determined from the authentication token.");
            }
            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetTransactions()
        {
            var userId = GetUserIdFromClaims();
            var transactions = await _transactionService.GetTransactionsByUserIdAsync(userId);
            return Ok(transactions);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTransaction(int id)
        {
            var userId = GetUserIdFromClaims();
            var transaction = await _transactionService.GetTransactionByIdAsync(id, userId);
            if (transaction == null)
                return NotFound();

            return Ok(transaction);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetTransactionSummary()
        {
            var userId = GetUserIdFromClaims();
            var summary = await _transactionService.GetTransactionSummaryAsync(userId);
            return Ok(summary);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionDto createTransactionDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserIdFromClaims();

            try
            {
                var transaction = await _transactionService.CreateTransactionAsync(createTransactionDto, userId);
                return CreatedAtAction(nameof(GetTransaction), new { id = transaction.Id }, transaction);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "İşlem oluşturulurken bir hata oluştu." });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTransaction(int id, [FromBody] UpdateTransactionDto updateTransactionDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserIdFromClaims();

            try
            {
                var success = await _transactionService.UpdateTransactionAsync(id, updateTransactionDto, userId);
                if (!success)
                    return NotFound(new { message = "İşlem bulunamadı veya güncelleme yetkiniz yok." });
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "İşlem güncellenirken bir hata oluştu." });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransaction(int id)
        {
            var userId = GetUserIdFromClaims();
            var success = await _transactionService.DeleteTransactionAsync(id, userId);
            if (!success)
                return NotFound(new { message = "İşlem bulunamadı veya silme yetkiniz yok." });

            return NoContent();
        }


        [HttpPost("deposit")]
        public async Task<IActionResult> Deposit([FromBody] CreateDepositWithdrawalDto depositDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserIdFromClaims();

            try
            {
                var transaction = await _transactionService.CreateDepositAsync(depositDto, userId);
                return Ok(transaction);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Para yatırma işlemi sırasında bir hata oluştu." });
            }
        }

        [HttpPost("withdraw")]
        public async Task<IActionResult> Withdraw([FromBody] CreateDepositWithdrawalDto withdrawalDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserIdFromClaims();

            try
            {
                var transaction = await _transactionService.CreateWithdrawalAsync(withdrawalDto, userId);
                return Ok(transaction);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Para çekme işlemi sırasında bir hata oluştu." });
            }
        }

        [HttpPost("investment")]
        public async Task<IActionResult> CreateInvestmentTransaction([FromBody] CreateInvestmentTransactionDto investmentDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserIdFromClaims();

            try
            {
                var transaction = await _transactionService.CreateInvestmentTransactionAsync(investmentDto, userId);
                return Ok(transaction);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Yatırım işlemi sırasında bir hata oluştu." });
            }
        }

        [HttpPost("transfer")]
        public async Task<IActionResult> CreateTransfer([FromBody] TransferDto transferDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserIdFromClaims();

            try
            {
                var (fromTransaction, toTransaction) = await _transactionService.CreateTransferAsync(transferDto, userId);
                return Ok(new { fromTransaction, toTransaction });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Transfer işlemi sırasında bir hata oluştu." });
            }
        }
    }
}
