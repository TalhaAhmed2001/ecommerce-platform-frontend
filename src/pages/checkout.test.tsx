// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { apiClient, type Order } from '../api/client';
import { loadCart, saveCart, type CartItem } from '../cart';
import { CartPage } from './CartPage';
import { OrderDetailPage } from './OrderDetailPage';

const cartItem: CartItem = {
  productId: 'product-1',
  name: 'Test product',
  priceCents: 2500,
  quantity: 2,
  availableQty: 3
};

const pendingOrder: Order = {
  id: 'order-1',
  userId: 'user-1',
  status: 'PAYMENT_PENDING',
  subtotalCents: 5000,
  totalCents: 5000,
  createdAt: '2026-08-07T12:00:00.000Z',
  updatedAt: '2026-08-07T12:00:00.000Z',
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      productName: 'Authoritative product name',
      unitPriceCents: 2500,
      quantity: 2,
      lineTotalCents: 5000,
      createdAt: '2026-08-07T12:00:00.000Z',
      updatedAt: '2026-08-07T12:00:00.000Z'
    }
  ],
  payment: {
    id: 'payment-1',
    status: 'PENDING',
    amountCents: 5000,
    provider: 'FAKE',
    providerReference: null,
    createdAt: '2026-08-07T12:00:00.000Z',
    updatedAt: '2026-08-07T12:00:00.000Z'
  }
};

const OrderDestination = () => {
  const { orderId } = useParams();
  return <p>Order destination {orderId}</p>;
};

const renderOrderDetail = (): void => {
  render(
    <MemoryRouter initialEntries={['/orders/order-1']}>
      <Routes>
        <Route path="/orders/:orderId" element={<OrderDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('cart checkout', () => {
  it('navigates to the order detail without clearing the cart', async () => {
    saveCart([cartItem]);
    const checkoutSpy = vi.spyOn(apiClient, 'checkout').mockResolvedValue({
      order: pendingOrder,
      payment: pendingOrder.payment
    });

    render(
      <MemoryRouter initialEntries={['/cart']}>
        <Routes>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders/:orderId" element={<OrderDestination />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Checkout' }));

    await screen.findByText('Order destination order-1');
    expect(checkoutSpy).toHaveBeenCalledWith([{ productId: 'product-1', quantity: 2 }]);
    expect(loadCart()).toEqual([cartItem]);
  });
});

describe('fake payment controls', () => {
  it('clears the cart after a successful payment and refreshes the order', async () => {
    saveCart([cartItem]);
    const confirmedOrder = {
      ...pendingOrder,
      status: 'CONFIRMED' as const,
      payment: { ...pendingOrder.payment!, status: 'SUCCEEDED' as const }
    };
    vi.spyOn(apiClient, 'getOrder')
      .mockResolvedValueOnce({ order: pendingOrder })
      .mockResolvedValueOnce({ order: confirmedOrder });
    const succeedSpy = vi.spyOn(apiClient, 'succeedPayment').mockResolvedValue({
      order: confirmedOrder,
      payment: confirmedOrder.payment
    });

    renderOrderDetail();
    fireEvent.click(await screen.findByRole('button', { name: 'Simulate payment success' }));

    await screen.findByText(/Payment succeeded/);
    expect(succeedSpy).toHaveBeenCalledWith('payment-1');
    expect(loadCart()).toEqual([]);
  });

  it('keeps the cart after a failed payment', async () => {
    saveCart([cartItem]);
    const failedOrder = {
      ...pendingOrder,
      status: 'FAILED' as const,
      payment: { ...pendingOrder.payment!, status: 'FAILED' as const }
    };
    vi.spyOn(apiClient, 'getOrder')
      .mockResolvedValueOnce({ order: pendingOrder })
      .mockResolvedValueOnce({ order: failedOrder });
    vi.spyOn(apiClient, 'failPayment').mockResolvedValue({
      order: failedOrder,
      payment: failedOrder.payment
    });

    renderOrderDetail();
    fireEvent.click(await screen.findByRole('button', { name: 'Simulate payment failure' }));

    await screen.findByText(/Reserved stock was released/);
    expect(loadCart()).toEqual([cartItem]);
  });

  it('shows fake payment buttons only while both order and payment are pending', async () => {
    const confirmedOrder = {
      ...pendingOrder,
      status: 'CONFIRMED' as const,
      payment: { ...pendingOrder.payment!, status: 'SUCCEEDED' as const }
    };
    vi.spyOn(apiClient, 'getOrder').mockResolvedValue({ order: confirmedOrder });

    renderOrderDetail();
    await screen.findByText('CONFIRMED');

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Simulate payment success' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Simulate payment failure' })).toBeNull();
    });
  });
});
