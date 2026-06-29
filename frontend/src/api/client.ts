const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5161/api';
const AUTH_TOKEN_KEY = 'admin_token';

export function getApiBase() {
  return API_BASE;
}

function networkErrorMessage(): string {
  if (API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1')) {
    return 'Chưa cấu hình VITE_API_URL trên Vercel. Đặt https://holtelcenter.onrender.com/api rồi Redeploy.';
  }
  return 'Không kết nối được API. Render free có thể đang khởi động — đợi ~1 phút rồi thử lại.';
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch {
    throw new Error(networkErrorMessage());
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    login: (password: string) =>
      request<{ token: string; expiresInDays: number }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
    verify: () => request<{ ok: boolean }>('/auth/verify'),
  },
  dashboard: {
    get: () => request<import('../types').Dashboard>('/dashboard'),
    checkIn: (data: object) => request<{ id: number; message: string }>('/dashboard/check-in', { method: 'POST', body: JSON.stringify(data) }),
    checkOut: (bookingId: number) => request<{ id: number; totalAmount: number; message: string }>('/dashboard/check-out', { method: 'POST', body: JSON.stringify({ bookingId }) }),
  },
  reports: {
    revenue: (from: string, to: string) =>
      request<import('../types').RevenueReport>(`/reports/revenue?from=${from}&to=${to}`),
  },
  rooms: {
    getAll: (publicOnly?: boolean) => request<import('../types').Room[]>(`/rooms${publicOnly ? '?publicOnly=true' : ''}`),
    getAvailability: () => request<import('../types').Room[]>('/rooms/availability'),
    create: (data: object) => request<import('../types').Room>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: object) => request<import('../types').Room>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: number, status: string) =>
      request<import('../types').UpdateRoomStatusResponse>(`/rooms/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    billingPreview: (id: number) =>
      request<import('../types').CheckoutBilling>(`/rooms/${id}/billing-preview`),
    delete: (id: number) => request<void>(`/rooms/${id}`, { method: 'DELETE' }),
  },
  hourlyRates: {
    getAll: (roomType?: string) => request<import('../types').HourlyRate[]>(`/hourlyrates${roomType ? `?roomType=${roomType}` : ''}`),
    create: (data: object) => request<import('../types').HourlyRate>('/hourlyrates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: object) => request<import('../types').HourlyRate>(`/hourlyrates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggle: (id: number) => request<import('../types').HourlyRate>(`/hourlyrates/${id}/toggle`, { method: 'PATCH' }),
    delete: (id: number) => request<void>(`/hourlyrates/${id}`, { method: 'DELETE' }),
  },
  products: {
    getAll: () => request<import('../types').Product[]>('/products'),
    create: (data: object) => request<import('../types').Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: object) => request<import('../types').Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggle: (id: number) => request<import('../types').Product>(`/products/${id}/toggle`, { method: 'PATCH' }),
    delete: (id: number) => request<void>(`/products/${id}`, { method: 'DELETE' }),
  },
  vouchers: {
    getAll: (publicOnly?: boolean) => request<import('../types').Voucher[]>(`/vouchers${publicOnly ? '?publicOnly=true' : ''}`),
    create: (data: object) => request<import('../types').Voucher>('/vouchers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: object) => request<import('../types').Voucher>(`/vouchers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggle: (id: number) => request<import('../types').Voucher>(`/vouchers/${id}/toggle`, { method: 'PATCH' }),
    delete: (id: number) => request<void>(`/vouchers/${id}`, { method: 'DELETE' }),
  },
  combos: {
    getAll: (publicOnly?: boolean) => request<import('../types').Combo[]>(`/combos${publicOnly ? '?publicOnly=true' : ''}`),
    create: (data: object) => request<import('../types').Combo>('/combos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: object) => request<import('../types').Combo>(`/combos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggle: (id: number) => request<import('../types').Combo>(`/combos/${id}/toggle`, { method: 'PATCH' }),
    delete: (id: number) => request<void>(`/combos/${id}`, { method: 'DELETE' }),
  },
};
