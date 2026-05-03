import { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Scroll-to-and-highlight a row when the page is opened from the global Ctrl+K
 * palette with `?<param>=<id>` in the URL.
 *
 * The destination page just needs to:
 *   1. Set `data-focus-id={item.id}` on each row's wrapper element.
 *   2. Call this hook with the query-param name and a `ready` flag (typically
 *      `!loading && items.length > 0`) so we wait until the rows actually exist
 *      before trying to scroll.
 *
 * After the highlight runs once, the param is stripped from the URL so a back
 * navigation or refresh doesn't re-trigger the animation. The ring class is
 * applied directly to the DOM node (not via React state) — this keeps the hook
 * data-store-agnostic and avoids forcing every list page through a focus-aware
 * render path.
 *
 * @param {string} paramName    URL query param to read (default: "focus")
 * @param {boolean} ready       Whether the list is rendered and addressable
 * @param {object} [options]
 * @param {string} [options.attr]      Data attribute to match (default
 *                                     "data-focus-id"). Pass a different one if
 *                                     the page hosts multiple focusable lists,
 *                                     e.g. `data-focus-batch-id`.
 * @param {string} [options.ringClass] Tailwind classes applied during the
 *                                     highlight pulse.
 * @param {number} [options.duration]  How long the highlight stays visible.
 */
const DEFAULT_RING =
  'ring-4 ring-teal-400/60 dark:ring-teal-300/60 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 transition-shadow';

export const useFocusOnArrival = (paramName = 'focus', ready = false, options = {}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const focusId = searchParams.get(paramName);
  const attr = options.attr || 'data-focus-id';
  const ringClass = options.ringClass || DEFAULT_RING;
  const duration = options.duration ?? 3500;

  useEffect(() => {
    if (!ready || !focusId) return;

    // Defer to next paint so freshly-rendered rows are mounted.
    const raf = requestAnimationFrame(() => {
      const node = document.querySelector(`[${attr}="${focusId}"]`);
      if (!node) return;

      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const ringTokens = ringClass.split(/\s+/).filter(Boolean);
      node.classList.add(...ringTokens);

      const removeTimer = setTimeout(() => {
        node.classList.remove(...ringTokens);
      }, duration);

      // Strip the param from the URL so reload/back doesn't re-trigger the
      // animation. Preserve any other query params the page relies on.
      const next = new URLSearchParams(searchParams);
      next.delete(paramName);
      navigate(
        { pathname: location.pathname, search: next.toString() ? `?${next}` : '' },
        { replace: true }
      );

      return () => clearTimeout(removeTimer);
    });

    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, focusId, attr]);
};
