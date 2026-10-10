/**
 * CamneX Shared API Client
 * Connects to Business API (/api/v1) with automatic CSRF management and session credentials.
 */

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // If running in browser, default to '/api/v1' unless configured via window or env
    const globalApiUrl = (typeof window !== 'undefined' && (window as any).__CAMNEX_API_URL__) || '';
    this.baseUrl = baseUrl || globalApiUrl || '/api/v1';
  }

  private getCsrfToken(): string {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/(?:^|;\s*)camnex_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  private async fetchCsrfToken(): Promise<string> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/csrf`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        return data.csrfToken || this.getCsrfToken();
      }
    } catch (_) {}
    return this.getCsrfToken();
  }

  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(
      endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`,
      typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:3000'
    );

    if (options.params) {
      Object.entries(options.params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val));
        }
      });
    }

    const headers = new Headers(options.headers || {});
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      let csrfToken = this.getCsrfToken();
      if (!csrfToken) {
        csrfToken = await this.fetchCsrfToken();
      }
      if (csrfToken && !headers.has('X-CSRF-Token')) {
        headers.set('X-CSRF-Token', csrfToken);
      }
    }

    const response = await fetch(url.toString(), {
      ...options,
      method,
      headers,
      credentials: options.credentials || 'include'
    });

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type') || '';
    let body: any;
    if (contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    if (!response.ok) {
      const errorMsg = (typeof body === 'object' && body && (body.error || body.message)) || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg) as any;
      error.status = response.status;
      error.data = body;
      throw error;
    }

    return body as T;
  }

  get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }

  put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }

  patch<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }

  delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export const apiClient = api;
