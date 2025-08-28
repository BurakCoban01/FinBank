using System.Security.Claims;
using System.Threading.Tasks;
using FinTrack.API.DTOs;
using FinTrack.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinTrack.API.Controllers
{
    [Authorize] // Bu controller'a erişim için kimlik doğrulaması zorunlu
    [ApiController]
    [Route("api/[controller]")]
    public class AccountsController : ControllerBase
    {
        private readonly IAccountService _accountService;

        public AccountsController(IAccountService accountService)
        {
            _accountService = accountService;
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

        // GET: api/accounts
        [HttpGet]
        public async Task<IActionResult> GetAccounts()
        {
            var userId = GetUserIdFromClaims();
            var accounts = await _accountService.GetAccountsByUserIdAsync(userId);
            return Ok(accounts);
        }

        // GET: api/accounts/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAccount(int id)
        {
            var userId = GetUserIdFromClaims();
            var account = await _accountService.GetAccountByIdAsync(id, userId);

            if (account == null)
                return NotFound();

            return Ok(account);
        }

        // POST: api/accounts
        [HttpPost]
        public async Task<IActionResult> CreateAccount([FromBody] CreateAccountDto createAccountDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserIdFromClaims();
            var account = await _accountService.CreateAccountAsync(createAccountDto, userId);
            return CreatedAtAction(nameof(GetAccount), new { id = account.Id }, account);
        }

        // PUT: api/accounts/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAccount(int id, [FromBody] UpdateAccountDto updateAccountDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserIdFromClaims();
            var success = await _accountService.UpdateAccountAsync(id, updateAccountDto, userId);

            if (!success)
                return NotFound();

            return NoContent();
        }

        // DELETE: api/accounts/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccount(int id)
        {
            var userId = GetUserIdFromClaims();
            var success = await _accountService.DeleteAccountAsync(id, userId);

            if (!success)
                return NotFound();

            return NoContent();
        }
    }
}