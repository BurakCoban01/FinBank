import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { User, LoginData, RegisterData } from '../types/user';
import { api } from '../services/api';

interface AuthContextType {
    user: User | null;
    loading: boolean; // Kullanıcı bilgisi yüklenirken
    isAuthenticated: boolean; // Kullanıcının giriş yapıp yapmadığını net gösterir
    login: (loginData: LoginData) => Promise<User>;  // başarılı olduğunda User döner
    register: (registerData: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true); // Başlangıçta true olmalı

    const checkUserSession = useCallback(async () => {
        // 1. localStorage'da token var mı diye kontrol et
        const token = localStorage.getItem('token');

        if (token) {
            try {
                // 2. Token varsa, kullanıcı bilgilerini almak için bir istek yap
                // Bu, token'ın sunucu tarafında hala geçerli olduğunu doğrular
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                // 3. İstek başarısız olursa (örn: 401), token geçersizdir. Temizle.
                console.error("Session check failed:", error);
                localStorage.removeItem('token');
                setUser(null);
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        checkUserSession();
    }, [checkUserSession]);

    const login = async (loginData: LoginData) => {
        try {
            // API yanıtı artık token de içeriyor
            const { user, token } = await authService.login(loginData);
            setUser(user);
            // Token'ı localStorage'a kaydet
            localStorage.setItem('token', token);
            return user;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const register = async (registerData: RegisterData) => {
        try {
            // Önce kayıt işlemini yap
            await authService.register(registerData);
            // Kayıt başarılıysa, aynı bilgilerle otomatik olarak giriş yap
            await login({ email: registerData.email, password: registerData.password });
        } catch (error) {
            console.error('Registration failed:', error);
            // Hata durumunda kullanıcı state'ini temizlediğimizden emin olalım
            setUser(null);
            throw error;
        }
    };

    const logout = async () => {
        // setLoading(true) // Logout sırasında loading göstermek opsiyoneldir.
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout API call failed, proceeding with client-side logout error in useAuth:', error);
        } finally {
            setUser(null); // Her durumda kullanıcıyı null yap
            localStorage.removeItem('token');
            // setLoading(false);
        }
    };

    const isAuthenticated = !loading && !!user;

    const value = { user, loading, login, logout, register, isAuthenticated };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

