import axios from "axios";

// Backend'in gerçek adresi (README > Hızlı Başlangıç): http://localhost:8000
// NOT: Content-Type burada SABİT verilmiyor — axios, JSON body'ler icin bunu
// otomatik ekler, multipart/form-data (dosya yukleme) icin ise tarayicinin
// kendisinin boundary'li Content-Type'i eklemesi gerekir. Burada veya istek
// bazinda elle "multipart/form-data" set etmek boundary'yi siler ve backend
// "Missing boundary in multipart" hatasiyla reddeder (bkz. uploadDocument).
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("pragma_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Backend hazır olmadığında arayüzü test edebilmek için mock modu.
// Varsayılan KAPALI (gerçek backend'e gider) — VITE_USE_MOCK eksik/tanımsız
// olsa bile yanlışlıkla mock'a düşülmesin diye "true" DIŞINDA her değer
// gercek backend'i kullanir (bkz. rapor: eskiden varsayilan ACIK'ti ve .env
// hic paylasilmayan bir dosya oldugu icin her yeni klon sessizce mock modda
// kaliyordu).
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
