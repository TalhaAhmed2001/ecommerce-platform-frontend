export type CartItem = {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
  availableQty: number;
};

const CART_STORAGE_KEY = 'ecomm-cart';
export const CART_UPDATED_EVENT = 'cart-updated';

const isCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  const hasValidQuantity = Number.isInteger(item.quantity) && Number(item.quantity) >= 1;
  const hasValidAvailability =
    Number.isInteger(item.availableQty) && Number(item.availableQty) >= Number(item.quantity);

  return (
    typeof item.productId === 'string' &&
    typeof item.name === 'string' &&
    Number.isInteger(item.priceCents) &&
    Number(item.priceCents) >= 0 &&
    hasValidQuantity &&
    hasValidAvailability
  );
};

export const loadCart = (): CartItem[] => {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) {
      return [];
    }

    const parsedCart: unknown = JSON.parse(storedCart);
    return Array.isArray(parsedCart) ? parsedCart.filter(isCartItem) : [];
  } catch {
    return [];
  }
};

export const saveCart = (items: CartItem[]): void => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
};

export const getCartQuantity = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.quantity, 0);
};

export const changeCartItemQuantity = (
  items: CartItem[],
  productId: string,
  change: number
): CartItem[] => {
  return items.map((item) => {
    if (item.productId !== productId) {
      return item;
    }

    return {
      ...item,
      quantity: Math.min(item.availableQty, Math.max(1, item.quantity + change))
    };
  });
};
