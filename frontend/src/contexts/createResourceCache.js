import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * Factory for stale-while-revalidate React contexts that wrap a single network
 * resource (products, categories, batches, …).
 *
 * Why this exists
 * ---------------
 * Every admin/manager page used to fetch its own copy of the same lists on
 * every mount, so navigating between (e.g.) ManageProducts → ManageBatches
 * → ManageCategories triggered three full refetches even though the data
 * rarely changes during a session. This factory lets us mount one provider
 * per resource at the app shell so:
 *
 *   • The first mount of any consumer primes the cache.
 *   • Every later consumer reads instantly (no spinner, no network).
 *   • A background refetch only happens when the cached data is older than
 *     STALE_MS, and never blocks the UI when there's already something to
 *     show.
 *   • An idle pre-fetch on app boot warms the cache before the user clicks
 *     anything, so even the *first* opener feels instant.
 *
 * Anti-staleness invalidation
 * ---------------------------
 * Mutations (create / update / delete) call `invalidate()` to force the next
 * read to go to the network. We deliberately do not auto-invalidate on
 * mutations the consumer didn't tell us about — that would mask bugs.
 */

const DEFAULTS = {
  staleMs: 60 * 1000, // background refetch threshold
  idleMs: 1500, // delay before idle prefetch
};

const scheduleIdle = (cb, timeout) => {
  if (typeof window === 'undefined') return () => {};
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(cb, { timeout });
    return () => window.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, timeout);
  return () => window.clearTimeout(id);
};

/**
 * @param {object} options
 * @param {() => Promise<{data: any}>} options.fetcher  Axios-style API call.
 * @param {string} options.label                        Diagnostic label.
 * @param {boolean} [options.prefetchOnMount=true]      Idle prefetch on boot.
 * @param {(d: any) => any[]} [options.normalize]       Normalizer for paginated payloads.
 * @param {number} [options.staleMs]
 * @param {number} [options.idleMs]
 */
export const createResourceCache = ({
  fetcher,
  label,
  prefetchOnMount = true,
  normalize = (d) => (Array.isArray(d) ? d : d?.results || []),
  staleMs = DEFAULTS.staleMs,
  idleMs = DEFAULTS.idleMs,
}) => {
  const Context = createContext({
    items: [],
    loading: false,
    error: null,
    ready: false,
    refetch: async () => {},
    invalidate: () => {},
    byId: new Map(),
  });

  const Provider = ({ children }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ready, setReady] = useState(false);

    const lastFetchedAt = useRef(0);
    const inFlight = useRef(null);
    // Tracks whether a write happened that the cache hasn't reconciled yet.
    const dirty = useRef(false);

    const doFetch = useCallback(async () => {
      if (inFlight.current) return inFlight.current;
      inFlight.current = (async () => {
        try {
          setLoading((prev) => (items.length === 0 ? true : prev));
          setError(null);
          const res = await fetcher();
          const data = normalize(res?.data);
          setItems(data);
          lastFetchedAt.current = Date.now();
          dirty.current = false;
          setReady(true);
          return data;
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(`[cache:${label}] fetch failed`, err);
          }
          setError(err);
          return null;
        } finally {
          setLoading(false);
          inFlight.current = null;
        }
      })();
      return inFlight.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.length]);

    const refetch = useCallback(async () => {
      const age = Date.now() - lastFetchedAt.current;
      if (items.length === 0 || dirty.current || age > staleMs) {
        return doFetch();
      }
      return items;
    }, [doFetch, items]);

    // Forces the next refetch() to actually go to the network.
    const invalidate = useCallback(() => {
      dirty.current = true;
      lastFetchedAt.current = 0;
    }, []);

    useEffect(() => {
      if (!prefetchOnMount) return undefined;
      return scheduleIdle(() => {
        doFetch();
      }, idleMs);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const byId = useMemo(() => {
      const map = new Map();
      for (const it of items) {
        if (it && it.id != null) map.set(String(it.id), it);
      }
      return map;
    }, [items]);

    const value = useMemo(
      () => ({ items, loading, error, ready, refetch, invalidate, byId }),
      [items, loading, error, ready, refetch, invalidate, byId]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  const useCache = () => useContext(Context);
  return { Provider, useCache, Context };
};
