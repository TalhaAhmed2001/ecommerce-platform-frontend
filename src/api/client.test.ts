import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient, type CheckoutItem } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiClient checkout', () => {
  it('sends only productId and quantity for each cart item', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ order: { id: 'order-1' }, payment: null })
    });
    vi.stubGlobal('fetch', fetchMock);

    const untrustedItems = [
      {
        productId: 'product-1',
        quantity: 2,
        name: 'Untrusted name',
        priceCents: 1,
        availableQty: 999,
        lineTotalCents: 2,
        total: 2
      }
    ] as unknown as CheckoutItem[];

    await apiClient.checkout(untrustedItems);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(options.body))).toEqual({
      items: [{ productId: 'product-1', quantity: 2 }]
    });
  });
});
