// FinTrack.API/Services/IIbanService.cs
namespace FinTrack.API.Services
{
    public interface IIbanService
    {
        Task<string> GenerateNewIbanAsync(string accountType);
    }
}