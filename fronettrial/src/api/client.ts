// ==========================================
// AERO-BLOOD Centralized API Client
// Handles fetch, error parsing, query serialization
// ==========================================

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function buildUrl(endpoint: string, params?: Record<string, unknown>): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = `${BASE_URL}${cleanEndpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return url;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    let data: unknown = null;
    try {
      data = await response.json();
      if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>;
        if (typeof d.detail === 'string') {
          errorDetail = d.detail;
        } else if (Array.isArray(d.detail)) {
          // FastAPI validation errors
          errorDetail = d.detail
            .map((item) => (typeof item === 'object' && item?.msg ? String(item.msg) : JSON.stringify(item)))
            .join('; ');
        }
      }
    } catch {
      // response wasn't JSON
    }
    throw new ApiError(errorDetail, response.status, data);
  }

  // Handle 204 or empty response
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return null as T;
}

export const apiClient = {
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const url = buildUrl(endpoint, params);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    return handleResponse<T>(response);
  },

  async post<T>(endpoint: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
    const url = buildUrl(endpoint, params);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async patch<T>(endpoint: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
    const url = buildUrl(endpoint, params);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(endpoint: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
    const url = buildUrl(endpoint, params);
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const url = buildUrl(endpoint, params);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    });
    return handleResponse<T>(response);
  },
};
