export type WorkFormat = 'office' | 'remote' | 'hybrid';

export interface User {
  id: number;
  email: string;
  name: string;
  city: string;
  role: string;
  sector: string;
  skills: string[];
  bio: string;
  workFormat: WorkFormat;
  isFop: boolean;
  fopGroup: number | null;
  fopActivity: string;
  createdAt: string;
}

export type CatalogType = 'person' | 'company' | 'opportunity';

export interface CatalogItem {
  type: CatalogType;
  id: number;
  title: string;
  subtitle: string;
  description: string;
  city: string;
  sector: string;
  tags: string[];
  isFop?: boolean;
  createdAt: string;
}

export interface CatalogCounts {
  all: number;
  person: number;
  company: number;
  opportunity: number;
  fop: number;
}

export interface Fop {
  id: number;
  name: string;
  city: string;
  role: string;
  sector: string;
  fopGroup: number | null;
  fopActivity: string;
  skills: string[];
}

export type ProfileUpdate = Partial<Omit<User, 'id' | 'email' | 'createdAt'>>;

export const WORK_FORMAT_LABEL: Record<WorkFormat, string> = {
  office: 'Офіс',
  remote: 'Віддалено',
  hybrid: 'Гібрид',
};

const TOKEN_KEY = 'bn_token';
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = Array.isArray(body?.message) ? body.message.join('. ') : body?.message;
    throw new ApiError(msg || 'Щось пішло не так. Спробуйте ще раз.', res.status);
  }
  return body as T;
}

const post = <T>(path: string, data: unknown, method = 'POST') =>
  request<T>(path, { method, body: JSON.stringify(data) });

export const api = {
  register: (data: { email: string; password: string; name: string }) =>
    post<{ token: string; user: User }>('/auth/register', data),
  login: (data: { email: string; password: string }) => post<{ token: string; user: User }>('/auth/login', data),
  me: () => request<User>('/auth/me'),
  user: (id: number) => request<User>(`/users/${id}`),
  updateMe: (data: ProfileUpdate) => post<User>('/users/me', data, 'PATCH'),
  catalog: (type?: CatalogType) => request<CatalogItem[]>(`/catalog${type ? `?type=${type}` : ''}`),
  catalogCounts: () => request<CatalogCounts>('/catalog/counts'),
  fops: () => request<Fop[]>('/fop'),
};
