const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export type User = {
  id: string;
  email: string;
  role: string;
  status: string;
};

export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export type Product = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

type AuthResponse = {
  user: User;
};

type ProductsResponse = {
  products: Product[];
};

type ProductResponse = {
  product: Product;
};

type CreateProductInput = {
  name: string;
  description?: string | null;
  priceCents: number;
  status?: ProductStatus;
};

type UpdateProductInput = Partial<CreateProductInput>;

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const fetchJson = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorResponse;
    throw new ApiError(body.error?.message ?? 'Request failed', response.status);
  }

  return (await response.json()) as T;
};

const shouldRefreshAfterUnauthorized = (path: string): boolean => {
  return !['/api/auth/register', '/api/auth/login', '/api/auth/refresh', '/api/auth/logout'].includes(path);
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetchJson<T>(path, options);
    } catch (error) {
      const canRefresh =
        attempt === 0 &&
        error instanceof ApiError &&
        error.status === 401 &&
        shouldRefreshAfterUnauthorized(path);

      if (!canRefresh) {
        throw error;
      }

      await fetchJson<AuthResponse>('/api/auth/refresh', { method: 'POST' });
    }
  }

  throw new Error('Request failed');
};

export const apiClient = {
  register: (email: string, password: string): Promise<AuthResponse> =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  login: (email: string, password: string): Promise<AuthResponse> =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  me: (): Promise<AuthResponse> => request('/api/auth/me'),
  logout: (): Promise<{ success: boolean }> =>
    request('/api/auth/logout', {
      method: 'POST'
    }),
  listProducts: (search?: string): Promise<ProductsResponse> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/api/products${query}`);
  },
  listAdminProducts: (): Promise<ProductsResponse> => request('/api/admin/products'),
  createProduct: (input: CreateProductInput): Promise<ProductResponse> =>
    request('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(input)
    }),
  updateProduct: (id: string, input: UpdateProductInput): Promise<ProductResponse> =>
    request(`/api/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    })
};
