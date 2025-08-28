import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'development' ? '/api' : '/api'; 

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Session cookie'lerinin gönderilip alınması için çok önemli
});

// Yanıt interceptor'ı (isteğe bağlı, global hata yönetimi için)
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Oturum süresi dolmuş veya yetkisiz erişim
            // Kullanıcıyı login sayfasına yönlendir.
            // Global state (Context API) varsa, logout işlemi de burada yapılabilir
            // Bu basit örnekte, her bileşen kendi 401'ini yönetebilir veya App.tsx seviyesinde bir kontrol mekanizması kurulabilir.
            // window.location.href = '/login'; // En basit yönlendirme
        }
        return Promise.reject(error);
    }
);

// Auth
export const loginUser = (data: any) => apiClient.post('/auth/login', data);
export const registerUser = (data: any) => apiClient.post('/auth/register', data);
export const logoutUser = () => apiClient.post('/auth/logout');

// Accounts
export const getAccounts = () => apiClient.get('/accounts');
export const getAccountById = (id: number) => apiClient.get(`/accounts/${id}`);
export const createAccount = (data: any) => apiClient.post('/accounts', data);
export const updateAccount = (id: number, data: any) => apiClient.put(`/accounts/${id}`, data);
export const deleteAccount = (id: number) => apiClient.delete(`/accounts/${id}`);

// Transactions
export const getTransactions = () => apiClient.get('/transactions');
export const getTransactionById = (id: number) => apiClient.get(`/transactions/${id}`);
export const createTransaction = (data: any) => apiClient.post('/transactions', data);
export const updateTransaction = (id: number, data: any) => apiClient.put(`/transactions/${id}`, data);
export const deleteTransaction = (id: number) => apiClient.delete(`/transactions/${id}`);
export const getTransactionSummary = () => apiClient.get('/transactions/summary');


// Categories
export const getCategories = () => apiClient.get('/categories');
export const getCategoryById = (id: number) => apiClient.get(`/categories/${id}`);


export default apiClient;