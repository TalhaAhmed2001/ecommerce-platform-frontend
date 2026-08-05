import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import {
  ApiError,
  apiClient,
  type InventoryItem,
  type Product,
  type ProductStatus
} from '../api/client';
import { Navigation } from '../components/Navigation';

type InventorySummary = Pick<InventoryItem, 'availableQty' | 'reservedQty'>;

const formatPrice = (priceCents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(priceCents / 100);
};

export const AdminProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryByProduct, setInventoryByProduct] = useState<
    Record<string, InventorySummary | null>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockSubmittingFor, setStockSubmittingFor] = useState<string | null>(null);

  const loadProducts = async (): Promise<void> => {
    const response = await apiClient.listAdminProducts();
    setProducts(response.products);
    await loadInventory(response.products);
  };

  const loadInventory = async (productsToLoad: Product[]): Promise<void> => {
    const entries = await Promise.all(
      productsToLoad.map(async (product) => {
        try {
          const response = await apiClient.getAdminInventory(product.id);
          return [product.id, response.inventory] as const;
        } catch (inventoryError) {
          if (inventoryError instanceof ApiError && inventoryError.status === 404) {
            return [product.id, null] as const;
          }
          throw inventoryError;
        }
      })
    );
    setInventoryByProduct(Object.fromEntries(entries));
  };

  useEffect(() => {
    let isMounted = true;

    const load = async (): Promise<void> => {
      try {
        const response = await apiClient.listAdminProducts();
        if (isMounted) {
          setProducts(response.products);
        }
        const inventoryEntries = await Promise.all(
          response.products.map(async (product) => {
            try {
              const inventoryResponse = await apiClient.getAdminInventory(product.id);
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

  const handleSetStock = async (
    event: FormEvent<HTMLFormElement>,
    productId: string
  ): Promise<void> => {
    event.preventDefault();
    setError(null);
    setStockSubmittingFor(productId);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await apiClient.setInventory(
        productId,
        Number(formData.get('availableQty'))
      );
      setInventoryByProduct((current) => ({
        ...current,
        [productId]: response.inventory
      }));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not update stock');
    } finally {
      setStockSubmittingFor(null);
    }
  };

  return (
    <main className="page page-wide">
      <section className="panel panel-wide">
        <Navigation isAdmin />
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
          {products.map((product) => {
            const inventory = inventoryByProduct[product.id];

            return (
              <article className="product-card" key={product.id}>
                <div>
                  <h2>{product.name}</h2>
                  <p className="muted">{product.description ?? 'No description provided.'}</p>
                  <p className="muted">
                    {formatPrice(product.priceCents)} - {product.status}
                  </p>
                  <p className="muted">
                    {inventory
                      ? `Available: ${inventory.availableQty} - Reserved: ${inventory.reservedQty}`
                      : 'Inventory not set'}
                  </p>
                </div>
                <div className="product-actions">
                  <form
                    className="stock-form"
                    onSubmit={(event) => void handleSetStock(event, product.id)}
                  >
                    <input
                      key={`${product.id}-${inventory?.availableQty ?? 'unset'}`}
                      aria-label={`Available quantity for ${product.name}`}
                      name="availableQty"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={inventory?.availableQty ?? 0}
                      required
                    />
                    <button type="submit" disabled={stockSubmittingFor === product.id}>
                      {stockSubmittingFor === product.id ? 'Saving...' : 'Set stock'}
                    </button>
                  </form>
                  <button type="button" onClick={() => void handleToggleStatus(product)}>
                    {product.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
