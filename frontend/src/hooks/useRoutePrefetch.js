import { useEffect } from 'react';

// Schedule a callback during browser idle time. Falls back to setTimeout for
// browsers without requestIdleCallback (Safari, older WebKit).
const scheduleIdle = (cb, timeout = 2000) => {
  if (typeof window === 'undefined') return () => {};
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(cb, { timeout });
    return () => window.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, timeout);
  return () => window.clearTimeout(id);
};

// Prefetch helper. Each entry returns a dynamic import; results are ignored —
// we only care about populating Webpack's chunk cache so the eventual lazy()
// resolves instantly. Entries that fail (offline, chunk renamed) are swallowed
// silently because prefetching is best-effort.
const runPrefetch = (importers) => {
  importers.forEach((fn) => {
    try {
      const p = fn();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {
      // ignore
    }
  });
};

/**
 * Prefetch important route chunks after the browser is idle.
 * Honors `Save-Data` header when set, and skips on slow connections so we don't
 * eat mobile data plans for a marginal UX improvement.
 *
 * @param {Array<() => Promise<any>>} importers — same `() => import(path)`
 *   shape used by React.lazy. Pass identical paths so the chunk is shared.
 */
export const useRoutePrefetch = (importers) => {
  useEffect(() => {
    if (!importers || importers.length === 0) return undefined;

    // Respect data-saver / 2g connections when the browser exposes it.
    const conn =
      typeof navigator !== 'undefined' &&
      (navigator.connection || navigator.mozConnection || navigator.webkitConnection);
    if (conn?.saveData) return undefined;
    if (conn?.effectiveType && /(^|-)(slow-)?2g$/.test(conn.effectiveType)) return undefined;

    let cancelled = false;
    const cancelIdle = scheduleIdle(() => {
      if (!cancelled) runPrefetch(importers);
    }, 2500);

    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [importers]);
};

export default useRoutePrefetch;
