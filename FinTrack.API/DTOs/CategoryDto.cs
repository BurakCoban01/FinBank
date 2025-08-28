using System.ComponentModel.DataAnnotations;

namespace FinTrack.API.DTOs
{
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string IconName { get; set; }
        public string Color { get; set; }
    }

    public class CreateCategoryDto
    {
        [Required]
        [StringLength(50)]
        public string Name { get; set; }

        [StringLength(255)]
        public string Description { get; set; }

        [StringLength(50)]
        public string IconName { get; set; }

        [StringLength(20)]
        public string Color { get; set; }
    }

    public class UpdateCategoryDto
    {
        [StringLength(50)]
        public string Name { get; set; }

        [StringLength(255)]
        public string Description { get; set; }

        [StringLength(50)]
        public string IconName { get; set; }

        [StringLength(20)]
        public string Color { get; set; }
    }
}