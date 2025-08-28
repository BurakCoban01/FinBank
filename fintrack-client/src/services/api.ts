import axios from 'axios';

const API_BASE_URL = 'https://localhost:7146/api'; // Backend'in çalıştığı adres

export const api = axios.create({
  baseURL: API_BASE_URL,
  // withCredentials: true, // Session cookie'lerinin gönderilip alınması için önemliydi, JWT için bu kaldırıldı. Token'ı manuel ekleyeceğiz
});

// JWT Token Interceptor - Her API isteğinden önce çalışacak olan request interceptor'ı
api.interceptors.request.use(
    (config) => {
        // localStorage'dan token'ı al
        const token = localStorage.getItem('token');
        
        // Eğer token varsa, Authorization başlığını ayarla
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        // İstek hatası durumunda yapılan
        return Promise.reject(error);
    }
);

// Yanıt interceptor'ı ile isteğe bağlı genel hata yönetimi
api.interceptors.response.use(
  (response) => response,
  (error) => {

    console.error('Axios interceptor error object:', JSON.parse(JSON.stringify(error))); // Tüm error objesini logla

    if (error.response) {
      // Sunucudan bir yanıt geldi ancak durum kodu hata aralığında
      console.error('API Error Response:', error.response.data);
      console.error('API Error Status:', error.response.status);
      console.error('API Error Headers:', error.response.headers);

      if (error.response.status === 401) {
        // Token süresi dolmuş veya yetkisiz erişim
        // localStorage'daki geçersiz token'ı temizleyip kullanıcıyı login'e yönlendirebiliriz
            localStorage.removeItem('token');
            // Not: Bu yönlendirme AuthContext içinde de yönetilebilir
            // window.location.href = '/login';   // lakin state'i kaybetmemek için bu yöntem tercih edilmemeli
        console.warn('Unauthorized (401) request. Session might have expired.');
      }
    } else if (error.request) {
      // İstek yapıldı ancak yanıt alınamadı (örn: network hatası, backend çalışmıyor)
      console.error('API No Response - Request Object:', error.request);
      console.error('Error message (no response):', error.message); // 'Network Error' burada görünebilir
    } else {
      // İsteği ayarlarken bir şeyler ters gitti
      console.error('API Error:', error.message);
    }
    return Promise.reject(error); // Hatanın çağrıldığı yere geri dönmesini sağla
  }
);

export default api;