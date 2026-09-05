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

export type PublicInventory = {
  productId: string;
  availableQty: number;
};

export type InventoryItem = PublicInventory & {
  id: string;
  reservedQty: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminInventory = InventoryItem & {
  reservations: Array<{
    id: string;
    quantity: number;
    status: 'ACTIVE' | 'RELEASED' | 'COMMITTED' | 'EXPIRED';
    expiresAt: string;
  }>;
};

export type OrderStatus =
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderPayment = {
  id: string;
  status: PaymentStatus;
  amountCents: number;
  provider: string;
  providerReference: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
};

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotalCents: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payment: OrderPayment | null;
  expiresAt?: string;
};

export type CheckoutItem = {
  productId: string;
  quantity: number;
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

type PublicInventoryResponse = {
  inventory: PublicInventory;
};

type AdminInventoryResponse = {
  inventory: AdminInventory;
};

type InventoryItemResponse = {
  inventory: InventoryItem;
};

type CheckoutResponse = {
  order: Order;
  payment: OrderPayment | null;
};

type OrdersResponse = {
  orders: Order[];
};

type OrderResponse = {
  order: Order;
};

type PaymentResponse = {
  payment: OrderPayment;
  order: Order;
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

export class ApiError extends Error {
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
    }),
  getPublicInventory: (productId: string): Promise<PublicInventoryResponse> =>
    request(`/api/inventory/${productId}`),
  getAdminInventory: (productId: string): Promise<AdminInventoryResponse> =>
    request(`/api/admin/inventory/${productId}`),
  setInventory: (productId: string, availableQty: number): Promise<InventoryItemResponse> =>
    request(`/api/admin/inventory/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ availableQty })
    }),
  checkout: (items: CheckoutItem[]): Promise<CheckoutResponse> =>
    request('/api/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({
        items: items.map(({ productId, quantity }) => ({ productId, quantity }))
      })
    }),
  getMyOrders: (): Promise<OrdersResponse> => request('/api/orders/my'),
  getOrder: (orderId: string): Promise<OrderResponse> =>
    request(`/api/orders/${encodeURIComponent(orderId)}`),
  succeedPayment: (paymentId: string): Promise<PaymentResponse> =>
    request(`/api/payments/${encodeURIComponent(paymentId)}/succeed`, { method: 'POST' }),
  failPayment: (paymentId: string): Promise<PaymentResponse> =>
    request(`/api/payments/${encodeURIComponent(paymentId)}/fail`, { method: 'POST' })
};
