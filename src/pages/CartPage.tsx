import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { changeCartItemQuantity, loadCart, saveCart, type CartItem } from '../cart';
import { Navigation } from '../components/Navigation';
import { formatCurrency, getCheckoutErrorMessage } from '../orderUi';

export const CartPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const updateItems = (nextItems: CartItem[]): void => {
    setError(null);

    try {
      saveCart(nextItems);
      setItems(nextItems);
    } catch {
      setError('Could not update the cart. Check that browser storage is available.');
    }
  };

  const changeQuantity = (productId: string, change: number): void => {
    updateItems(changeCartItemQuantity(items, productId, change));
  };

  const removeItem = (productId: string): void => {
    updateItems(items.filter((item) => item.productId !== productId));
  };

  const handleCheckout = async (): Promise<void> => {
    if (items.length === 0) {
      return;
    }

    setError(null);
    setIsCheckingOut(true);

    try {
      const response = await apiClient.checkout(
        items.map(({ productId, quantity }) => ({ productId, quantity }))
      );
      navigate(`/orders/${response.order.id}`);
    } catch (caughtError) {
      setError(getCheckoutErrorMessage(caughtError));
    } finally {
      setIsCheckingOut(false);
    }
  };

  const cartTotal = items.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0
  );

  return (
    <main className="page page-wide">
      <section className="panel panel-wide">
        <Navigation />
        <h1>Cart</h1>
        {error ? <p className="error">{error}</p> : null}
        {items.length === 0 ? (
          <p className="muted">
            Your cart is empty. <Link to="/products">Browse products</Link>.
          </p>
        ) : null}
        <div className="cart-list">
          {items.map((item) => (
            <article className="cart-item" key={item.productId}>
              <div>
                <h2>{item.name}</h2>
                <p className="muted">Unit price: {formatCurrency(item.priceCents)}</p>
                <p className="muted">
                  Line total: {formatCurrency(item.priceCents * item.quantity)}
                </p>
                <p className="muted">Availability snapshot: {item.availableQty}</p>
              </div>
              <div className="cart-actions">
                <div className="quantity-controls" aria-label={`Quantity for ${item.name}`}>
                  <button
                    type="button"
                    aria-label={`Decrease ${item.name} quantity`}
                    onClick={() => changeQuantity(item.productId, -1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Increase ${item.name} quantity`}
                    onClick={() => changeQuantity(item.productId, 1)}
                    disabled={item.quantity >= item.availableQty}
                  >
                    +
                  </button>
                </div>
                <button type="button" onClick={() => removeItem(item.productId)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="cart-summary">
          <strong>Cart estimate: {formatCurrency(cartTotal)}</strong>
          <button
            type="button"
            disabled={items.length === 0 || isCheckingOut}
            onClick={() => {
              void handleCheckout();
            }}
          >
            {isCheckingOut ? 'Checking out...' : 'Checkout'}
          </button>
        </div>
      </section>
    </main>
  );
};
