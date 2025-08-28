using System.Threading.Tasks;
using FinTrack.API.DTOs;
using FinTrack.API.Models;

namespace FinTrack.API.Services
{
    public interface IUserService
    {
        Task<(bool success, string message, User user)> RegisterAsync(RegisterDto registerDto);
        Task<(bool success, string message, User user, string token)> LoginAsync(LoginDto loginDto);
        Task<UserDto> GetUserByIdAsync(int userId);
        Task<bool> UpdateUserAsync(int userId, UpdateAccountDto updateUserDto);
    }
}

