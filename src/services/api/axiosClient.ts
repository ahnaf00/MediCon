import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Config } from '../../constants/config';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Return the whole body (e.g. pagination `meta`) instead of unwrapping `data`. */
    keepEnvelope?: boolean;
  }
}

// Base URL comes from EXPO_PUBLIC_API_URL (see src/constants/config.ts).
export const axiosClient = axios.create({
  baseURL: Config.API.BASE_URL,
  // Without a limit a request on a dead connection never settles (audit API-002).
  // Slow calls (AI replies, uploads) pass their own longer timeout.
  timeout: Config.API.TIMEOUT,
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
  (error) => Promise.reject(error),
);

// Response Interceptor: Unwrap data & handle 401/422
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Automatically unwrap Laravel's Eloquent API Resource `data` object if present
    if (response.config.keepEnvelope) {
      return response.data;
    }
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
        // The token is already rejected, so don't try to revoke it remotely.
        useAuthStore.getState().logout({ remote: false });
      }

      // 403 for a suspended account: every request will fail, so sign out and say why.
      const body = error.response.data as { message?: unknown } | undefined;
      if (
        error.response.status === 403 &&
        body?.message === 'Account is suspended' &&
        useAuthStore.getState().token
      ) {
        useAuthStore.getState().logout({ remote: false });
        Alert.alert('Account suspended', 'Your account is suspended. Contact MediCon support.');
      }

      // 422 Unprocessable Entity: Validation Errors
      // We pass the error down so useMutation can catch it and map errors to the UI
      if (error.response.status === 422) {
        return Promise.reject(error.response.data);
      }
    }

    return Promise.reject(error);
  },
);
