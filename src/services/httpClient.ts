/**
 * Reusable HTTP Client for PRECURSOR-X FastAPI Backend.
 * Handles timeouts, network errors, non-2xx responses, and json parsing.
 */

/**
 * The backend origin the deployed frontend is proxied to when VITE_API_BASE_URL is not
 * explicitly set. Kept here purely as a documented reference matching the rewrite rule in
 * render.yaml (`/api/* -> https://precursor-x-backend.onrender.com/api/*`); it is NOT used
 * as an automatic fallback value (see resolveApiBaseUrl below for why).
 */
export const KNOWN_PRODUCTION_BACKEND_ORIGIN = 'https://precursor-x-backend.onrender.com';

/**
 * Resolves and normalizes the API base URL to always include the authoritative /api/v1 path prefix.
 *
 * Resolution priority:
 *   1. Explicit `rawUrl` argument (e.g. for tests).
 *   2. `VITE_API_BASE_URL` baked in at Vite build time — an explicit opt-out of same-origin
 *      proxying (see point 3), for deployments that don't use the render.yaml rewrite rule.
 *   3. Relative '/api/v1', in EVERY environment (production and local dev alike).
 *
 * Why relative in production too:
 * Render's onrender.com is on the public suffix list, so the frontend's and backend's
 * *.onrender.com subdomains are different *sites* to a browser even though they share a
 * parent domain. A session cookie set by the backend in response to a *direct*, cross-site
 * fetch from the frontend is therefore a third-party cookie, and browsers routinely refuse to
 * store it — this reproduces as: POST /auth/login returns 200 with a Set-Cookie header, yet
 * every following request comes back 401 because the cookie was never actually retained.
 * The fix is to keep every API call same-origin from the browser's point of view: call the
 * relative path, and let the deployment's own edge proxy it to the backend server-to-server
 * (see render.yaml's `/api/*` rewrite rule for production, and vite.config.ts's dev server
 * `proxy` entry for local development). The Set-Cookie response then arrives "from" the
 * frontend's own origin, so it's a first-party cookie and is reliably stored and resent.
 *
 * Handles:
 * - Full URL with /api/v1: https://backend.example.com/api/v1 -> https://backend.example.com/api/v1
 * - Origin / Host only: https://backend.example.com -> appends /api/v1
 */
export const resolveApiBaseUrl = (rawUrl?: string): string => {
  const explicit = (rawUrl !== undefined ? rawUrl : import.meta.env.VITE_API_BASE_URL || '').trim();

  if (!explicit) {
    // No explicit override: always relative. A same-origin edge proxy (Render rewrite rule in
    // production, Vite dev server proxy locally) forwards this to the real backend, which is
    // what keeps the HttpOnly session cookie first-party. See the comment above for why this
    // must NOT resolve to an absolute cross-origin URL by default.
    return '/api/v1';
  }

  // Strip trailing slashes
  const clean = explicit.replace(/\/+$/, '');
  // If provided URL already ends with /api/v1, use directly
  if (clean.endsWith('/api/v1')) {
    return clean;
  }
  // If only origin/host or other prefix was provided, append /api/v1
  return `${clean}/api/v1`;
};

export const API_BASE_URL = resolveApiBaseUrl();

// Development-only diagnostic: makes the resolved API base URL visible in the
// browser console during local dev / build debugging. No secrets are logged —
// only the derived, already-public base URL. Stripped from production builds
// since import.meta.env.DEV is statically replaced with `false` and dead-code
// eliminated by Vite/esbuild at build time.
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log('[httpClient] Resolved API_BASE_URL:', API_BASE_URL);
}

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
