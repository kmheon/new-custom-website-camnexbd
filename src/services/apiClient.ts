/**
 * CamneX API Client
 * - Dynamic API Base resolution: seamlessly supports direct Express (:3000) and VS Code Live Server (:5500)
 * - Safe response parsing: prevents "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 * - In-flight CSRF token tracking and cookie synchronization
 * - Informative connection error messages
 */

let inMemoryCsrfToken: string | null = null;

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    // When served via Live Server (:5500) or other frontend dev ports, route to Express on port 3000
    if (port && port !== '3000') {
      const targetHost = hostname === '0.0.0.0' ? 'localhost' : hostname;
      return `${protocol}//${targetHost}:3000/api`;
    }
  }
  return '/api';
}

export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return inMemoryCsrfToken;
  const match = document.cookie.match(/(?:^|;\s*)camnex_csrf=([^;]+)/);
  if (match) {
    inMemoryCsrfToken = decodeURIComponent(match[1]);
  }
  return inMemoryCsrfToken;
}

export function setCachedCsrfToken(token: string | null): void {
  if (token) {
    inMemoryCsrfToken = token;
  }
}

export async function fetchCsrfToken(): Promise<string> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/auth/csrf`, {
      credentials: 'include'
    });
    const text = await res.text();
    if (text && text.trim().length > 0) {
      try {
        const data = JSON.parse(text);
        if (data && data.csrfToken) {
          inMemoryCsrfToken = data.csrfToken;
          return data.csrfToken;
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('Could not refresh CSRF token:', err);
  }
  return getCsrfTokenFromCookie() || '';
}

export async function apiFetch<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const base = getApiBase();
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${base}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options?.headers as Record<string, string> || {})
  };

  // Default Content-Type to application/json unless sending FormData
  if (options?.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (!inMemoryCsrfToken && options?.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
    await fetchCsrfToken();
  }
  const csrf = inMemoryCsrfToken || getCsrfTokenFromCookie();
  if (csrf && !headers['X-CSRF-Token']) {
    headers['X-CSRF-Token'] = csrf;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      credentials: 'include',
      ...options,
      headers
    });
  } catch (netErr: any) {
    throw new Error(
      `Cannot connect to CamneX server at ${url}. Please ensure 'node server.js' is running on port 3000. Details: ${netErr.message}`
    );
  }

  // Safe parsing of response body as text first to prevent JSON parse crashes
  const text = await res.text();
  let data: any = null;
  if (text && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch (_) {
      // Body is not JSON (e.g. HTML 404/500 or plain text error)
      data = null;
    }
  }

  if (!res.ok) {
    const errorMsg =
      (data && data.error) ||
      (data && data.message) ||
      (text && text.length < 250 && !text.includes('<!DOCTYPE') ? text : `Server returned error HTTP ${res.status} (${res.statusText})`);
    throw new Error(errorMsg);
  }

  // On 204 No Content or empty responses, return empty object/null safely
  if (data === null) {
    return {} as T;
  }

  return data as T;
}

