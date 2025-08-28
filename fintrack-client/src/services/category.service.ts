import { api } from './api';
import { CategoryDto } from '../types'; // types.ts'den veya types/category.ts'den

export const categoryService = {
    getCategories: async (): Promise<CategoryDto[]> => {
        const response = await api.get<CategoryDto[]>('/categories');
        return response.data;
    }
};