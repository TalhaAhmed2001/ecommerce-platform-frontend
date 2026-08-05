import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { User } from '../api/client';
import { CART_UPDATED_EVENT, getCartQuantity, loadCart } from '../cart';

type NavigationProps = {
  isAdmin?: boolean;
  user?: User | null;
};

export const Navigation = ({ isAdmin = false, user }: NavigationProps) => {
  const [cartQuantity, setCartQuantity] = useState(() => getCartQuantity(loadCart()));

  useEffect(() => {
    const updateCartQuantity = (): void => {
      setCartQuantity(getCartQuantity(loadCart()));
    };

    window.addEventListener(CART_UPDATED_EVENT, updateCartQuantity);
    window.addEventListener('storage', updateCartQuantity);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, updateCartQuantity);
      window.removeEventListener('storage', updateCartQuantity);
    };
  }, []);

  return (
    <nav className="navigation" aria-label="Main navigation">
      <NavLink to="/products">Products</NavLink>
      <NavLink to="/cart">Cart ({cartQuantity})</NavLink>
      <NavLink to="/dashboard">Dashboard</NavLink>
      {isAdmin || user?.role === 'ADMIN' ? (
        <NavLink to="/admin/products">Admin Products</NavLink>
      ) : null}
    </nav>
  );
};
