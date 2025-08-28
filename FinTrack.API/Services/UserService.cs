using AutoMapper;
using FinTrack.API.Data;
using FinTrack.API.DTOs;
using FinTrack.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IUserAssetService _userAssetService; 
        private readonly ILogger<UserService> _logger; 

        public UserService(AppDbContext context, IMapper mapper, IUserAssetService userAssetService, ILogger<UserService> logger)
        {
            _context = context;
            _mapper = mapper;
            _userAssetService = userAssetService;
            _logger = logger;
        }

        public async Task<(bool success, string message, User user)> RegisterAsync(RegisterDto registerDto)
        {
            // E-posta zaten kayıtlı mı kontrol et
            if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
            {
                return (false, "Bu e-posta adresi zaten kayıtlı", null);
            }

            // Kullanıcı adı zaten alınmış mı kontrol et
            if (await _context.Users.AnyAsync(u => u.Username == registerDto.Username))
            {
                return (false, "Bu kullanıcı adı zaten alınmış", null);
            }

            // Kullanıcı entity'si oluştur
            var user = _mapper.Map<User>(registerDto);

            // Şifreyi hashle
            user.PasswordHash = HashPassword(registerDto.Password);
            user.CreatedAt = DateTime.UtcNow;
            user.IsActive = true;

            // Kullanıcıyı veritabanına kaydet
            _context.Users.Add(user);
            await _context.SaveChangesAsync();


            // Baştaki varsayılan varlıkları yeni kullanıcı için ata
            try
            {
                _logger.LogInformation("Yeni kullanıcı ID {UserId} için varsayılan takip listesi ekleniyor.", user.Id);
                var defaultSymbols = new List<string> { "USD/TRY", "EUR/TRY", "BTC/USD", "XAU/USD", "EUR/USD", "TSLA", "AAPL", "GOOG" };

                // for döngüsünü, sıra numarasını (index) alacak şekilde güncelliyoruz
                for (int i = 0; i < defaultSymbols.Count; i++)
                {
                    var symbol = defaultSymbols[i];
                    // Servis metodunu, sıra numarasını da alacak şekilde güncelleyeceğiz (bir sonraki adım).
                    await _userAssetService.AddTrackedAssetAsync(user.Id, symbol, i);

                }
                _logger.LogInformation("Yeni kullanıcı ID {UserId} için varsayılan varlıklar başarıyla eklendi.", user.Id);
            }
            catch (Exception ex)
            {
                // Eğer varsayılan varlıklar eklenirken bir hata olursa (örn: API cevap vermezse),
                // bu durum kullanıcının kayıt işlemini engellememeli. Sadece hatayı loglayıp devam ediyoruz.
                _logger.LogError(ex, "Yeni kullanıcı ID {UserId} için varsayılan varlıklar eklenirken bir hata oluştu.", user.Id);
            }

            return (true, "Kayıt başarılı", user);
        }

        public async Task<(bool success, string message, User user, string token)> LoginAsync(LoginDto loginDto)
        {
            // E-posta ile kullanıcıyı bul
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == loginDto.Email);

            // Kullanıcı var mı ve aktif mi kontrol et
            if (user == null)
            {
                return (false, "Geçersiz e-posta veya şifre", null, null);
            }

            if (!user.IsActive)
            {
                return (false, "Hesap devre dışı bırakılmış", null, null);
            }

            // Şifreyi doğrula
            if (!VerifyPassword(loginDto.Password, user.PasswordHash))
            {
                return (false, "Geçersiz e-posta veya şifre", null, null);
            }

            // JWT kullanmadığımız için token null
            string token = null;

            return (true, "Giriş başarılı", user, token);
        }

        public async Task<UserDto> GetUserByIdAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            return _mapper.Map<UserDto>(user);
        }

        public async Task<bool> UpdateUserAsync(int userId, UpdateAccountDto updateUserDto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            // DTO'dan güncellemeleri uygula
            _mapper.Map(updateUserDto, user);

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return true;
        }

        // Şifre hashleme yardımcı metodları
        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
            }
        }

        private bool VerifyPassword(string password, string passwordHash)
        {
            return HashPassword(password) == passwordHash;
        }
    }
}
