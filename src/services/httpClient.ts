/**
 * Reusable HTTP Client for PRECURSOR-X FastAPI Backend.
 * Handles timeouts, network errors, non-2xx responses, and json parsing.
 */

/**
 * Reusable HTTP Client for PRECURSOR-X FastAPI Backend.
 * Handles timeouts, network errors, non-2xx responses, and json parsing.
 */

/**
 * Resolves and normalizes the API base URL to always include the authoritative /api/v1 path prefix.
 * Handles:
 * - Full URL with /api/v1: https://backend.onrender.com/api/v1 -> https://backend.onrender.com/api/v1
 * - Origin / Host only: https://backend.onrender.com or http://localhost:8000 -> appends /api/v1
 * - Relative / empty: defaults to /api/v1
 */
export const resolveApiBaseUrl = (rawUrl?: string): string => {
  const raw = (rawUrl !== undefined ? rawUrl : (import.meta.env.VITE_API_BASE_URL || '')).trim();
  if (!raw) {
    return '/api/v1';
  }
  // Strip trailing slashes
  const clean = raw.replace(/\/+$/, '');
  // If provided URL already ends with /api/v1, use directly
  if (clean.endsWith('/api/v1')) {
    return clean;
  }
  // If only origin/host or other prefix was provided, append /api/v1
  return `${clean}/api/v1`;
};

export const API_BASE_URL = resolveApiBaseUrl();

export interface ApiErrorDetails {
  status: number;
  message: string;
  isOffline: boolean;
  endpoint: string;
}

export class ApiClientError extends Error {
  public status: number;
  public isOffline: boolean;
  public endpoint: string;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = 'ApiClientError';
    this.status = details.status;
    this.isOffline = details.isOffline;
    this.endpoint = details.endpoint;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  // 30s default tolerates a Render free-tier cold start of the backend on the first request.
  const { timeoutMs = 30000, ...fetchOptions } = options;
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      credentials: 'include',
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(fetchOptions.headers || {})
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMessage = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          errorMessage = typeof errorJson.detail === 'string'
            ? errorJson.detail
            : JSON.stringify(errorJson.detail);
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // Response was not JSON
      }

      throw new ApiClientError({
        status: res.status,
        message: errorMessage,
        isOffline: false,
        endpoint: normalizedEndpoint
      });
    }

    // Try parsing JSON
    try {
      return (await res.json()) as T;
    } catch {
      throw new ApiClientError({
        status: res.status,
        message: `Failed to parse JSON response from ${normalizedEndpoint}`,
        isOffline: false,
        endpoint: normalizedEndpoint
      });
    }
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err instanceof ApiClientError) {
      throw err;
    }

    const isNetworkOrAbort =
      err.name === 'AbortError' ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('NetworkError') ||
      err.message?.includes('ECONNREFUSED');

    const message = isNetworkOrAbort
      ? `FastAPI backend unavailable at ${API_BASE_URL}. The service may be starting up, offline, or blocked by CORS/network settings.`
      : (err.message || 'Unknown network error occurred');

    throw new ApiClientError({
      status: 0,
      message,
      isOffline: true,
      endpoint: normalizedEndpoint
    });
  }
}

export const httpClient = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  },

  patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  }
};
