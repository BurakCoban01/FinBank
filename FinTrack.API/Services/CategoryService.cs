using AutoMapper;
using FinTrack.API.Data;
using FinTrack.API.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FinTrack.API.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public CategoryService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<CategoryDto>> GetAllCategoriesAsync()
        {
            var categories = await _context.Categories.ToListAsync();
            return _mapper.Map<List<CategoryDto>>(categories);
        }

        public async Task<CategoryDto> GetCategoryByIdAsync(int categoryId)
        {
            var category = await _context.Categories.FindAsync(categoryId);
            return _mapper.Map<CategoryDto>(category);
        }
    }
}