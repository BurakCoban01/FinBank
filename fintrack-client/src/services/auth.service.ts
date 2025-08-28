import { api } from './api'; // api.ts'den import 
import { User, LoginData, RegisterData } from '../types/user';


interface LoginResponse {
    user: User;
    token: string;
    message: string;
}


export const authService = {
    login: async (loginData: LoginData): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/login', loginData);
        return response.data;
    },
    register: async (registerData: RegisterData): Promise<{ message: string, user: User }> => {
        const response = await api.post('/auth/register', registerData);
        return response.data;
    },
    logout: async (): Promise<void> => {
        await api.post('/auth/logout');
    },
    getCurrentUser: async (): Promise<User> => {
        // Bu endpoint, token'ı header'da göndererek mevcut kullanıcıyı doğrular ve bilgilerini alır
        const response = await api.get<User>('/users/me');
        return response.data;
    }
};