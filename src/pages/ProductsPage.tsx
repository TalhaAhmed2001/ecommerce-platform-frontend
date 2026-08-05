import { useEffect, useState } from 'react';
import { ApiError, apiClient, type Product, type PublicInventory } from '../api/client';
import { loadCart, saveCart } from '../cart';
import { Navigation } from '../components/Navigation';

const formatPrice = (priceCents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(priceCents / 100);
};

export const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryByProduct, setInventoryByProduct] = useState<
    Record<string, PublicInventory | null>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async (): Promise<void> => {
      try {
        const response = await apiClient.listProducts();
        if (isMounted) {
          setProducts(response.products);
        }
        const inventoryEntries = await Promise.all(
          response.products.map(async (product) => {
            try {
              const inventoryResponse = await apiClient.getPublicInventory(product.id);
              return [product.id, inventoryResponse.inventory] as const;
            } catch (inventoryError) {
              if (inventoryError instanceof ApiError && inventoryError.status === 404) {
                return [product.id, null] as const;
              }
              throw inventoryError;
            }
          })
        );
        if (isMounted) {
          setInventoryByProduct(Object.fromEntries(inventoryEntries));
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : 'Could not load products');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (
    product: Product,
    inventory?: PublicInventory | null
  ): void => {
    setMessage(null);

    if (!inventory || inventory.availableQty <= 0) {
      setMessage({ type: 'error', text: `${product.name} is not currently available.` });
      return;
    }

    try {
      const cart = loadCart();
      const existingItem = cart.find((item) => item.productId === product.id);
      const availableQty = inventory.availableQty;

      if (existingItem) {
        if (existingItem.quantity >= availableQty) {
          setMessage({
            type: 'error',
            text: `Only ${availableQty} ${product.name} available.`
          });
          return;
        }

        saveCart(
          cart.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  availableQty
                }
              : item
          )
        );
      } else {
        saveCart([
          ...cart,
          {
            productId: product.id,
            name: product.name,
            priceCents: product.priceCents,
            quantity: 1,
            availableQty
          }
        ]);
      }

      setMessage({ type: 'success', text: `${product.name} added to cart.` });
    } catch {
      setMessage({ type: 'error', text: 'Could not update the cart.' });
    }
  };

  return (
    <main className="page page-wide">
      <section className="panel panel-wide">
        <Navigation />
        <h1>Products</h1>
        {isLoading ? <p className="muted">Loading...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {message ? (
          <p className={message.type} role="status">
            {message.text}
          </p>
        ) : null}
        {!isLoading && !error && products.length === 0 ? <p className="muted">No products available.</p> : null}
        <div className="product-list">
          {products.map((product) => {
            const inventory = inventoryByProduct[product.id];

            return (
              <article className="product-card" key={product.id}>
                <div>
                  <h2>{product.name}</h2>
                  <p className="muted">{product.description ?? 'No description provided.'}</p>
                </div>
                <div className="product-meta">
                  <strong>{formatPrice(product.priceCents)}</strong>
                  <span className="muted">
                    {inventory ? `${inventory.availableQty} available` : 'Availability not set'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product, inventory)}
                    disabled={isLoading || !inventory || inventory.availableQty <= 0}
                  >
                    Add to cart
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};
