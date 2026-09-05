import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, type Order } from '../api/client';
import { Navigation } from '../components/Navigation';
import { formatCurrency, formatDate } from '../orderUi';

export const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async (): Promise<void> => {
      try {
        const response = await apiClient.getMyOrders();
        if (isMounted) {
          setOrders(response.orders);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : 'Could not load orders');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="page page-wide">
      <section className="panel panel-wide">
        <Navigation />
        <h1>Orders</h1>
        {isLoading ? <p className="muted">Loading orders...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!isLoading && !error && orders.length === 0 ? (
          <p className="muted">You have not placed any orders yet.</p>
        ) : null}
        <div className="order-list">
          {orders.map((order) => (
            <Link className="order-card" to={`/orders/${order.id}`} key={order.id}>
              <span>
                <strong>Order {order.id}</strong>
                <small>{formatDate(order.createdAt)}</small>
              </span>
              <span>
                <strong>{formatCurrency(order.totalCents)}</strong>
                <small>{order.status}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
};
