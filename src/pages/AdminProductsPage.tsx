import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { apiClient, type Product, type ProductStatus } from '../api/client';

const formatPrice = (priceCents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(priceCents / 100);
};

export const AdminProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProducts = async (): Promise<void> => {
    const response = await apiClient.listAdminProducts();
    setProducts(response.products);
  };

  useEffect(() => {
    let isMounted = true;

    const load = async (): Promise<void> => {
      try {
        const response = await apiClient.listAdminProducts();
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

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const description = String(formData.get('description') ?? '').trim();

    try {
      await apiClient.createProduct({
        name: String(formData.get('name')),
        description: description || null,
        priceCents: Math.round(Number(formData.get('priceDollars')) * 100),
        status: String(formData.get('status')) as ProductStatus
      });
      form.reset();
      await loadProducts();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (product: Product): Promise<void> => {
    setError(null);
    const status: ProductStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      const response = await apiClient.updateProduct(product.id, { status });
      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct.id === product.id ? response.product : currentProduct
        )
      );
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not update product');
    }
  };

  return (
    <main className="page page-wide">
      <section className="panel panel-wide">
        <h1>Admin Products</h1>
        <form className="product-form" onSubmit={(event) => void handleCreate(event)}>
          <label>
            Name
            <input name="name" required />
          </label>
          <label>
            Description
            <textarea name="description" rows={3} />
          </label>
          <label>
            Price
            <input name="priceDollars" type="number" min="0.01" step="0.01" required />
          </label>
          <label>
            Status
            <select name="status" defaultValue="ACTIVE">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create product'}
          </button>
        </form>
        {isLoading ? <p className="muted">Loading...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        <div className="product-list">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div>
                <h2>{product.name}</h2>
                <p className="muted">{product.description ?? 'No description provided.'}</p>
                <p className="muted">
                  {formatPrice(product.priceCents)} - {product.status}
                </p>
              </div>
              <button type="button" onClick={() => void handleToggleStatus(product)}>
                {product.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};
