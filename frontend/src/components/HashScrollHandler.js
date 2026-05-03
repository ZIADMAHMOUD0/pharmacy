import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Smoothly scroll to `#section-id` whenever the URL hash changes — including
 * after a route push that targets the same path with a different hash. React
 * Router 6 does not do this automatically.
 */
const HashScrollHandler = () => {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return;
    // Wait one frame so the destination route has rendered its anchors.
    const id = window.requestAnimationFrame(() => {
      const target = document.querySelector(hash);
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [hash, pathname]);

  return null;
};

export default HashScrollHandler;
