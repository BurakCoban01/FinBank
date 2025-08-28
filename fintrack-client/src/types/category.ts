export interface CategoryDto { // Backend'deki CategoryDto ile aynı olmalı
    id: number;
    name: string;
    description: string;
    iconName: string;
    color: string;
}


export interface CreateCategoryDto
{
    name: string;
    description: string;
    iconName: string;
    color: string;
}

export interface UpdateCategoryDto
{
    name: string;
    description: string;
    iconName: string;
    color: string;
}

// Frontend içinde CategoryDto'yu Category olarak kullanabiliriz
export type Category = CategoryDto;