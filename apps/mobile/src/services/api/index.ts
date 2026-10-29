/**
 * ORION-9 AUTHENTICATED API CLIENT
 * Secure HTTP client with timeout, cancellation, structured errors, and token injection.
 */

import { Platform } from 'react-native';
import { storage } from '../../storage';

const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_ORION_API_URL;
  if (envUrl) return envUrl;

  // On Android emulator, localhost is mapped to 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
};

export const API_BASE_URL = getBaseUrl();

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export const api = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { timeoutMs = 8000, skipAuth = false, headers = {}, ...rest } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(headers as Record<string, string>),
    };

    if (!skipAuth) {
      const session = await storage.getJson<{ token?: string }>('orion_auth_session');
      if (session?.token) {
        reqHeaders['Authorization'] = `Bearer ${session.token}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...rest,
        headers: reqHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      let data: any = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMsg = (data && data.error) || (data && data.message) || `HTTP error ${response.status}`;
        throw new ApiError(errorMsg, response.status, data);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new ApiError('Request timed out. Please check your network connection.', 408);
      }
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err.message || 'Network request failed', 0);
    }
  },

  get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
