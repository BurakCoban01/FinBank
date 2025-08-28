
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using FinTrack.API.DTOs;
using FinTrack.API.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;  // Cookie tabanlı authentication sırasında kullanılıyordu
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System;
using FinTrack.API.Models;

namespace FinTrack.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;

        public AuthController(IUserService userService, IMapper mapper, IConfiguration configuration)
        {
            _userService = userService;
            _mapper = mapper;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (success, message, user) = await _userService.RegisterAsync(registerDto);

            if (!success)
                return BadRequest(new { message });

            
            var userDto = _mapper.Map<UserDto>(user);
            return Ok(new { message, user = userDto });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (success, message, user, _) = await _userService.LoginAsync(loginDto);

            if (!success || user == null)
                return Unauthorized(new { message });   // 401 Unauthorized

            /* Cookie bazlı authentication yapılırken bu mekanizma kullanılıyordu
            // Session yerine Cookie-based authentication kullan
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Username)
            };

            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true, // "Beni hatırla" gibi bir seçenek varsa true yapılabilir
                ExpiresUtc = DateTimeOffset.UtcNow.AddHours(2) // Oturum süresi
            };

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                authProperties);
            */

            // JWT Token oluşturulan authentication mekanizması
            var token = GenerateJwtToken(user);
            var userDto = _mapper.Map<UserDto>(user);
            // Token'ı ve kullanıcı bilgisini döndür
            return Ok(new { message, user = userDto, token });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            // await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme); // Cookie auth için gerekliydi
            // JWT stateless olduğu için sunucu tarafında bir logout işlemi yoktur. Client token'ı silmelidir
            return Ok(new { message = "Başarıyla çıkış yapıldı" });
        }

        // JWT Token üreten yardımcı metot
        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()), // Standard claim for subject (user ID)
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Name, user.Username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) // Unique token ID
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8), // Token geçerlilik süresi
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
