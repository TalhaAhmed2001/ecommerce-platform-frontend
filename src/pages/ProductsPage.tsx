import { useEffect, useState } from 'react';
import { apiClient, type Product } from '../api/client';

const formatPrice = (priceCents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(priceCents / 100);
};

export const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async (): Promise<void> => {
      try {
        const response = await apiClient.listProducts();
        if (isMounted) {
          setProducts(response.products);
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

  return (
    <main className="page page-wide">
      <section className="panel panel-wide">
        <h1>Products</h1>
        {isLoading ? <p className="muted">Loading...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!isLoading && !error && products.length === 0 ? <p className="muted">No products available.</p> : null}
        <div className="product-list">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div>
                <h2>{product.name}</h2>
                <p className="muted">{product.description ?? 'No description provided.'}</p>
              </div>
              <strong>{formatPrice(product.priceCents)}</strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};
