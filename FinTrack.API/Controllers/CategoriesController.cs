using FinTrack.API.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace FinTrack.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            // Kategoriler genel olduðu için kullanýcý kontrolü yok (seed edilmiþler)
            // Eðer kullanýcýya özel kategoriler olsaydý session'dan userId alýnýp kontrol edilirdi.
            var categories = await _categoryService.GetAllCategoriesAsync();
            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategory(int id)
        {
            var category = await _categoryService.GetCategoryByIdAsync(id);
            if (category == null)
            {
                return NotFound();
            }
            return Ok(category);
        }
    }
}