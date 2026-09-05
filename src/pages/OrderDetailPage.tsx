import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient, type Order } from '../api/client';
import { saveCart } from '../cart';
import { Navigation } from '../components/Navigation';
import {
  canSimulatePayment,
  formatCurrency,
  formatDate,
  getPaymentErrorMessage
} from '../orderUi';

type PaymentAction = 'success' | 'failure';

export const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentAction, setPaymentAction] = useState<PaymentAction | null>(null);

  const loadOrder = useCallback(async (): Promise<void> => {
    if (!orderId) {
      setError('Order id is missing.');
      setIsLoading(false);
      return;
    }

    const response = await apiClient.getOrder(orderId);
    setOrder(response.order);
  }, [orderId]);

  useEffect(() => {
    let isMounted = true;

    const load = async (): Promise<void> => {
      try {
        if (!orderId) {
          throw new Error('Order id is missing.');
        }
        const response = await apiClient.getOrder(orderId);
        if (isMounted) {
          setOrder(response.order);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : 'Could not load order');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const simulatePayment = async (action: PaymentAction): Promise<void> => {
    if (!order?.payment) {
      return;
    }

    setError(null);
    setMessage(null);
    setPaymentAction(action);

    try {
      if (action === 'success') {
        await apiClient.succeedPayment(order.payment.id);
        saveCart([]);
        setMessage('Payment succeeded. Your order is confirmed and the cart was cleared.');
      } else {
        await apiClient.failPayment(order.payment.id);
        setMessage('Payment failed. Reserved stock was released; you may try checkout again.');
      }
      await loadOrder();
    } catch (caughtError) {
      setError(getPaymentErrorMessage(caughtError));
      try {
        await loadOrder();
      } catch {
        // Keep the payment error visible when the follow-up refresh also fails.
      }
    } finally {
      setPaymentAction(null);
    }
  };

  const paymentDeadline = order?.payment?.expiresAt ?? order?.expiresAt;
  const showPaymentControls = order ? canSimulatePayment(order) : false;

  return (
    <main className="page page-wide">
      <section className="panel panel-wide">
        <Navigation />
        <h1>Order details</h1>
        {isLoading ? <p className="muted">Loading order...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}
        {order ? (
          <>
            <dl className="details">
              <div>
                <dt>Order id</dt>
                <dd>{order.id}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{order.status}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{formatCurrency(order.totalCents)}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDate(order.createdAt)}</dd>
              </div>
              <div>
                <dt>Payment status</dt>
                <dd>{order.payment?.status ?? 'Not available'}</dd>
              </div>
              {paymentDeadline ? (
                <div>
                  <dt>Payment deadline</dt>
                  <dd>{formatDate(paymentDeadline)}</dd>
                </div>
              ) : null}
            </dl>
            <div className="order-items">
              <h2>Items</h2>
              {order.items.map((item) => (
                <article className="order-item" key={item.id}>
                  <div>
                    <strong>{item.productName}</strong>
                    <p className="muted">
                      {formatCurrency(item.unitPriceCents)} x {item.quantity}
                    </p>
                  </div>
                  <strong>{formatCurrency(item.lineTotalCents)}</strong>
                </article>
              ))}
            </div>
            {showPaymentControls ? (
              <div className="payment-actions">
                <button
                  type="button"
                  disabled={paymentAction !== null}
                  onClick={() => {
                    void simulatePayment('success');
                  }}
                >
                  {paymentAction === 'success' ? 'Processing...' : 'Simulate payment success'}
                </button>
                <button
                  type="button"
                  disabled={paymentAction !== null}
                  onClick={() => {
                    void simulatePayment('failure');
                  }}
                >
                  {paymentAction === 'failure' ? 'Processing...' : 'Simulate payment failure'}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
};
