import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cartAPI } from '../services/api';

// Lightweight read-only hook that fetches the customer's current cart count.
// Re-fetches whenever the route changes so the badge stays roughly in sync with
// add/remove actions across pages. No new endpoint — reuses cartAPI.getCart.
export const useCartCount = (enabled = true) => {
  const location = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    cartAPI
      .getCart()
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        if (Array.isArray(data)) {
          setCount(data.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0));
        } else if (data && Array.isArray(data.items)) {
          setCount(data.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0));
        } else if (typeof data?.count === 'number') {
          setCount(data.count);
        } else {
          setCount(0);
        }
      })
      .catch(() => {
        // Quietly degrade — badge just won't show.
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, location.pathname]);

  return count;
};

export default useCartCount;
