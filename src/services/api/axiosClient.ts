import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../store/authStore';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS simulator, or IP for physical device
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api/v1' : 'http://localhost:8000/api/v1';

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Bearer Token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Access the token synchronously from Zustand's in-memory state
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unwrap data & handle 401/422
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Automatically unwrap Laravel's Eloquent API Resource `data` object if present
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response) {
      // 401 Unauthorized: Token expired or revoked
      if (error.response.status === 401) {
        // Trigger global logout (clears state & secure storage, and _layout.tsx will redirect)
        useAuthStore.getState().logout();
      }

      // 422 Unprocessable Entity: Validation Errors
      // We pass the error down so useMutation can catch it and map errors to the UI
      if (error.response.status === 422) {
        return Promise.reject(error.response.data);
      }
    }

    return Promise.reject(error);
  }
);
