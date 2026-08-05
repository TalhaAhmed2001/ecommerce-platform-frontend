import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  changeCartItemQuantity,
  getCartQuantity,
  loadCart,
  saveCart,
  type CartItem
} from './cart';

const item: CartItem = {
  productId: 'product-1',
  name: 'Test product',
  priceCents: 2500,
  quantity: 2,
  availableQty: 3
};

const createLocalStorage = (): Storage => {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => {
      values.clear();
    },
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    }
  };
};

beforeEach(() => {
  vi.stubGlobal('localStorage', createLocalStorage());
});

describe('cart storage', () => {
  it('saves and loads typed cart items', () => {
    saveCart([item]);

    expect(loadCart()).toEqual([item]);
  });

  it('returns an empty cart for invalid stored data', () => {
    localStorage.setItem('ecomm-cart', 'not-json');

    expect(loadCart()).toEqual([]);
  });

  it('discards stored items above their availability snapshot', () => {
    localStorage.setItem('ecomm-cart', JSON.stringify([{ ...item, quantity: 4 }]));

    expect(loadCart()).toEqual([]);
  });

  it('discards stored items without an availability snapshot', () => {
    const { availableQty: _availableQty, ...itemWithoutAvailability } = item;
    localStorage.setItem('ecomm-cart', JSON.stringify([itemWithoutAvailability]));

    expect(loadCart()).toEqual([]);
  });
});

describe('cart quantities', () => {
  it('keeps quantity between one and the availability snapshot', () => {
    expect(changeCartItemQuantity([item], item.productId, -10)[0].quantity).toBe(1);
    expect(changeCartItemQuantity([item], item.productId, 10)[0].quantity).toBe(3);
  });

  it('totals quantities for the navigation badge', () => {
    expect(getCartQuantity([item, { ...item, productId: 'product-2', quantity: 4 }])).toBe(6);
  });
});
