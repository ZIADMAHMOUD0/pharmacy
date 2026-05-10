import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Generic "pending count" badge hook.
 *
 * Calls `fetcher()` and counts how many items in the response have
 * `status === 'pending'`. Re-fetches on route change so the badge stays
 * roughly in sync as the user navigates around — no new endpoint, no
 * polling, and no impact when the consumer is disabled.
 *
 * Mirrors `useCartCount`'s ergonomics so all the navbar badges share the
 * same fetch-on-route-change behavior.
 *
 * @param {() => Promise<{data: any}>} fetcher  Axios-style API call.
 * @param {boolean} enabled                     Skip entirely when false.
 */
export const usePendingCount = (fetcher, enabled = true) => {
  const location = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled || typeof fetcher !== 'function') return undefined;
    let cancelled = false;
    fetcher()
      .then((res) => {
        if (cancelled) return;
        const data = res?.data;
        const list = Array.isArray(data) ? data : data?.results || [];
        const pending = list.reduce(
          (n, item) => (item?.status === 'pending' ? n + 1 : n),
          0
        );
        setCount(pending);
      })
      .catch(() => {
        // Silently degrade — no badge is better than a broken one.
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, location.pathname, fetcher]);

  return count;
};

export default usePendingCount;
