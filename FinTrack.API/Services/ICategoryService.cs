using FinTrack.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public interface ICategoryService
    {
        Task<List<CategoryDto>> GetAllCategoriesAsync();
        Task<CategoryDto> GetCategoryByIdAsync(int categoryId);
    }
}