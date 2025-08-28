// File: FinTrack.API/Controllers/UserController.cs

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using FinTrack.API.Services;
using FinTrack.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt; // YENİ: JwtRegisteredClaimNames için eklendi.

namespace FinTrack.API.Controllers
{
    [Authorize] // Bu controller'a erişim için kimlik doğrulaması zorunlu.
    [ApiController]
    [Route("api/users")] // Route'u standart RESTful isimlendirmesine uygun olarak "users" yapabiliriz.
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            // [Authorize] attribute'u, gelen JWT'yi doğrular ve kullanıcı bilgilerini User.Claims'e doldurur.
            // Kullanıcı ID'sini token'ın "subject" (sub) claim'inden alıyoruz. Bu, JWT için standart bir yöntemdir.
            // ÖNCEKİ HALİ: var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userIdString = User.FindFirstValue(JwtRegisteredClaimNames.Sub); // JWT standardı olan "sub" claim'ini kullanıyoruz.

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
            {
                // Bu durumun [Authorize] attribute'u nedeniyle gerçekleşmemesi gerekir.
                // Ancak token'da 'sub' claim'i yoksa veya geçersizse diye kontrol eklemek iyidir.
                return Unauthorized(new { message = "User ID could not be determined from the token." });
            }

            try
            {
                var userDto = await _userService.GetUserByIdAsync(userId);

                if (userDto == null)
                {
                    // JWT geçerli bir ID içeriyor ama veritabanında bu kullanıcı yok (örn: kullanıcı silinmiş).
                    return NotFound(new { message = "User associated with the token not found." });
                }

                return Ok(userDto);
            }
            catch (System.Exception)
            {
                // Üretim ortamında bu hatayı loglamak önemlidir.
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred while retrieving user details." });
            }
        }
    }
}