import { useState } from 'react';
import { Link } from 'react-router-dom';
import { changeCartItemQuantity, loadCart, saveCart, type CartItem } from '../cart';
import { Navigation } from '../components/Navigation';

const formatPrice = (priceCents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(priceCents / 100);
};

export const CartPage = () => {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [error, setError] = useState<string | null>(null);

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
                <p className="muted">Unit price: {formatPrice(item.priceCents)}</p>
                <p className="muted">
                  Line total: {formatPrice(item.priceCents * item.quantity)}
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
          <strong>Total: {formatPrice(cartTotal)}</strong>
          <button type="button" disabled>
            Checkout coming next
          </button>
        </div>
      </section>
    </main>
  );
};
