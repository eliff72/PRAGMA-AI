import axios from "axios";
import { clearAccessToken, ensureAccessToken } from "./auth";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
});

apiClient.interceptors.request.use(async (config) => {
  const token = await ensureAccessToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token gecersiz/suresi dolmus olabilir — bir sonraki istekte yeniden login dener
      clearAccessToken();
    }
    return Promise.reject(error);
  },
);
