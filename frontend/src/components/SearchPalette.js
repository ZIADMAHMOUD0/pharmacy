import React, { useEffect, useMemo, useRef, useState, useCallback, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiSearch,
  FiX,
  FiClock,
  FiCornerDownLeft,
  FiArrowUp,
  FiArrowDown,
  FiPackage,
  FiFileText,
  FiHash,
  FiUsers,
  FiShoppingCart,
} from 'react-icons/fi';
import { useProductsCache } from '../contexts/ProductsCacheContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getStaticEntriesForRole,
  getPlaceholderForRole,
  getDynamicLoadersForRole,
  getPermissionsForRole,
  matchesEntry,
  groupEntries,
} from '../lib/searchProviders';
import { userAPI, orderAPI, batchAPI } from '../services/api';

const MAX_RECENTS = 5;
const MAX_RESULTS_PER_GROUP = 6;
const TOTAL_RESULTS_CAP = 24;

// Recent searches are stored per authenticated user (or 'public' when not
// signed in) so search history never leaks across roles or accounts using
// the same browser. This is a UX/privacy guard — the backend has no concept
// of search history.
const recentsKeyFor = (user) => {
  if (user?.id != null) return `pharmacare:recent-searches:user-${user.id}`;
  return 'pharmacare:recent-searches:public';
};

const readRecents = (user) => {
  try {
    const raw = localStorage.getItem(recentsKeyFor(user));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
};

const writeRecents = (user, list) => {
  try {
    localStorage.setItem(recentsKeyFor(user), JSON.stringify(list.slice(0, MAX_RECENTS)));
  } catch {
    // ignore quota
  }
};

// Highlight occurrences of `query` in `text` (case-insensitive)
const Highlight = ({ text = '', query = '' }) => {
  if (!query) return text;
  const trimmed = query.trim();
  if (!trimmed) return text;
  const parts = String(text).split(
    new RegExp(`(${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig')
  );
  return parts.map((part, i) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <mark
        key={i}
        className="bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200 rounded px-0.5"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

const KIND_ICON = {
  page: <FiFileText size={16} />,
  section: <FiHash size={16} />,
  product: <FiPackage size={16} />,
  user: <FiUsers size={16} />,
  order: <FiShoppingCart size={16} />,
  batch: <FiPackage size={16} />,
};

const ResultRow = ({ entry, query, isActive, onHover, onSelect }) => {
  const accent = isActive ? 'bg-teal-50 dark:bg-teal-500/15' : 'hover:bg-slate-50 dark:hover:bg-slate-800';
  const titleColor = isActive
    ? 'text-teal-700 dark:text-teal-300'
    : 'text-slate-800 dark:text-slate-100';

  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${accent}`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isActive
            ? 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        {entry.image ? (
          <img src={entry.image} alt="" className="w-full h-full object-cover rounded-lg" />
        ) : (
          KIND_ICON[entry.kind] || KIND_ICON.page
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate ${titleColor}`}>
          <Highlight text={entry.title} query={query} />
        </p>
        {entry.subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            <Highlight text={entry.subtitle} query={query} />
          </p>
        )}
      </div>
      {entry.priceLabel && (
        <span
          className={`font-display font-bold text-sm flex-shrink-0 ${
            isActive ? 'text-teal-700 dark:text-teal-300' : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          {entry.priceLabel}
        </span>
      )}
      {entry.badgeLabel && (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 flex-shrink-0">
          {entry.badgeLabel}
        </span>
      )}
      {isActive && (
        <FiCornerDownLeft className="text-teal-500 dark:text-teal-300 flex-shrink-0" size={14} />
      )}
    </button>
  );
};

const SearchPalette = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.role || 'public';
  const placeholder = getPlaceholderForRole(role);
  const staticEntries = useMemo(() => getStaticEntriesForRole(role), [role]);
  const loaders = useMemo(() => getDynamicLoadersForRole(role), [role]);
  const permissions = useMemo(() => getPermissionsForRole(role), [role]);

  // Recents key is bound to the authenticated user — switching accounts shows
  // an isolated history.
  const [recents, setRecents] = useState(() => readRecents(user));
  useEffect(() => {
    setRecents(readRecents(user));
  }, [user?.id]);

  // Products: shared cache so this is usually instant
  const { items: allProducts, loading: productsLoading, refetch: refetchProducts } =
    useProductsCache();

  // Role-scoped lazy data. These are CLEARED on every user.id change so a
  // previous admin's cached users/orders never bleed into a doctor/customer
  // session that opens the palette later.
  const [scopedUsers, setScopedUsers] = useState([]);
  const [scopedOrders, setScopedOrders] = useState([]);
  const [scopedBatches, setScopedBatches] = useState([]);
  const fetchedKeysRef = useRef({ users: false, orders: false, batches: false });

  // Hard reset whenever the active user changes — security boundary.
  useEffect(() => {
    setScopedUsers([]);
    setScopedOrders([]);
    setScopedBatches([]);
    fetchedKeysRef.current = { users: false, orders: false, batches: false };
  }, [user?.id]);

  // Lazy fetch on open, gated by the role's loader flags.
  useEffect(() => {
    if (!open) return;
    refetchProducts().catch(() => {});

    if (loaders.users && !fetchedKeysRef.current.users) {
      fetchedKeysRef.current.users = true;
      userAPI
        .getAllUsers()
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
          setScopedUsers(list);
        })
        .catch(() => {
          fetchedKeysRef.current.users = false; // allow retry on next open
        });
    }

    if (loaders.orders && !fetchedKeysRef.current.orders) {
      fetchedKeysRef.current.orders = true;
      orderAPI
        .getAll()
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
          setScopedOrders(list);
        })
        .catch(() => {
          fetchedKeysRef.current.orders = false;
        });
    }

    if (loaders.batches && !fetchedKeysRef.current.batches) {
      fetchedKeysRef.current.batches = true;
      batchAPI
        .getAll()
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
          setScopedBatches(list);
        })
        .catch(() => {
          fetchedKeysRef.current.batches = false;
        });
    }
  }, [open, loaders.users, loaders.orders, loaders.batches, refetchProducts]);

  // Combined entries — built once whenever any source changes.
  // Role gate: if the role's permissions disallow products entirely, this
  // collapses to an empty array. If a `productsFilter` is set (e.g. doctor
  // sees prescription-only) the catalog is narrowed before search.
  const productEntries = useMemo(() => {
    if (!permissions.products) return [];
    const buildSubtitle = permissions.productSubtitle || ((p) =>
      [p?.category_name, p?.manufacturer].filter(Boolean).join(' · '));
    const showPrice = permissions.showProductPrice !== false;
    return allProducts
      .filter((p) => permissions.productsFilter(p))
      .map((p) => ({
        id: `product-${p.id}`,
        kind: 'product',
        group: permissions.productsLabel,
        title: p.name,
        subtitle: buildSubtitle(p),
        synonyms: [p.category_name, p.manufacturer, p.active_ingredient].filter(Boolean),
        image: p.image_url,
        priceLabel: showPrice && p.price ? `$${p.price}` : '',
        // Doctors get a small "Rx" pill instead of a price tag — keeps the
        // medication entry distinctly clinical.
        badgeLabel: !showPrice && p?.requires_prescription ? 'Rx' : '',
        rawProduct: p,
      }));
  }, [allProducts, permissions]);

  // Role gate: only build user entries if the role can see them. This means a
  // stale `scopedUsers` (e.g. from a previous admin session that hasn't
  // cleared yet) STILL produces zero searchable entries for a doctor.
  const userEntries = useMemo(() => {
    if (!permissions.users) return [];
    return scopedUsers.map((u) => ({
      id: `user-${u.id}`,
      kind: 'user',
      group: 'Users',
      title: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username,
      subtitle: `@${u.username}${u.email ? ` · ${u.email}` : ''}${u.role ? ` · ${u.role.replace('_', ' ')}` : ''}`,
      synonyms: [u.username, u.email, u.role, u.phone].filter(Boolean),
      rawUser: u,
    }));
  }, [scopedUsers, permissions.users]);

  const orderEntries = useMemo(() => {
    if (!permissions.orders) return [];
    return scopedOrders.map((o) => {
      const customerName = o.customer_name || o.customer || `User #${o.user || ''}`;
      return {
        id: `order-${o.id}`,
        kind: 'order',
        group: 'Orders',
        title: `Order #${o.id}`,
        subtitle: `${customerName}${o.status ? ` · ${o.status}` : ''}${o.total ? ` · $${o.total}` : ''}`,
        synonyms: [String(o.id), o.status, o.customer_name, o.customer].filter(Boolean),
        rawOrder: o,
      };
    });
  }, [scopedOrders, permissions.orders]);

  const batchEntries = useMemo(() => {
    if (!permissions.batches) return [];
    return scopedBatches.map((b) => {
      const productName = b.product_name || b.product?.name || (b.product ? `Product #${b.product}` : '');
      const expiry = b.expiry_date ? new Date(b.expiry_date).toLocaleDateString() : '';
      const status = b.is_expired ? 'expired' : '';
      return {
        id: `batch-${b.id}`,
        kind: 'batch',
        group: 'Batches',
        title: b.batch_number ? `Batch ${b.batch_number}` : `Batch #${b.id}`,
        subtitle: [productName, expiry && `expires ${expiry}`, b.quantity != null && `${b.quantity} units`, status]
          .filter(Boolean)
          .join(' · '),
        synonyms: [b.batch_number, productName, String(b.id), status].filter(Boolean),
        rawBatch: b,
      };
    });
  }, [scopedBatches, permissions.batches]);

  // Decouple expensive list filtering from input keystrokes
  const deferredQuery = useDeferredValue(query);

  // Filter + cap per group + cap overall
  const grouped = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return [];

    // Order matters: Pages/Sections first (fast nav targets users expect to
    // see immediately), then role-scoped lists, then products.
    const allEntries = [
      ...staticEntries,
      ...userEntries,
      ...orderEntries,
      ...batchEntries,
      ...productEntries,
    ];

    const matches = [];
    for (let i = 0; i < allEntries.length && matches.length < TOTAL_RESULTS_CAP * 4; i++) {
      if (matchesEntry(allEntries[i], q)) matches.push(allEntries[i]);
    }

    // Group, cap each group, then enforce overall cap while preserving group order
    const groups = groupEntries(matches);
    let remaining = TOTAL_RESULTS_CAP;
    return groups
      .map((g) => {
        const items = g.items.slice(0, MAX_RESULTS_PER_GROUP);
        const trimmed = items.slice(0, Math.max(0, remaining));
        remaining -= trimmed.length;
        return { ...g, items: trimmed };
      })
      .filter((g) => g.items.length > 0);
  }, [deferredQuery, staticEntries, userEntries, orderEntries, batchEntries, productEntries]);

  // Flat list for keyboard nav
  const flatResults = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // Focus input on open + reset on close
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const persistRecent = useCallback(
    (term) => {
      const cleaned = (term || '').trim();
      if (!cleaned) return;
      setRecents((prev) => {
        const next = [
          cleaned,
          ...prev.filter((r) => r.toLowerCase() !== cleaned.toLowerCase()),
        ].slice(0, MAX_RECENTS);
        writeRecents(user, next);
        return next;
      });
    },
    [user]
  );

  // Action dispatcher — every kind has slightly different navigation
  // semantics, and product/user/order/batch destinations come from the
  // per-role permissions object so a click NEVER lands a role on a route
  // they're not authorized for (which would bounce them back to /).
  const performEntry = useCallback(
    (entry) => {
      if (!entry) return;
      persistRecent(entry.title);
      onClose();
      switch (entry.kind) {
        case 'product': {
          const target = permissions.productAction?.(entry.rawProduct);
          if (target) navigate(target);
          // null means the role has no listing destination — palette just
          // closes after surfacing the info inline (e.g. doctor lookup).
          return;
        }
        case 'section': {
          navigate(`${entry.to || '/'}${entry.hash || ''}`);
          return;
        }
        case 'user': {
          const target = permissions.userAction?.(entry.rawUser);
          if (target) navigate(target);
          return;
        }
        case 'order': {
          const target = permissions.orderAction?.(entry.rawOrder);
          if (target) navigate(target);
          return;
        }
        case 'batch': {
          const target = permissions.batchAction?.(entry.rawBatch);
          if (target) navigate(target);
          return;
        }
        case 'page':
        default:
          navigate(entry.to || '/');
      }
    },
    [navigate, onClose, persistRecent, permissions]
  );

  // "Search the full catalog →" link — also role-aware so admins / managers
  // don't get bounced to '/' from a customer-only route.
  const goToFreeText = useCallback(
    (term) => {
      const cleaned = (term || '').trim();
      if (cleaned) persistRecent(cleaned);
      onClose();
      // Pretend we're clicking a synthetic product entry just to reuse the
      // role-aware product target. If the role has no product page (doctor),
      // we just close.
      const target = permissions.productAction?.({ name: cleaned, id: '' });
      if (target) {
        // strip any focus param since we don't have one
        const url = target.includes('?')
          ? `${target}${cleaned ? '' : ''}` // already has q/etc
          : `${target}${cleaned ? `?q=${encodeURIComponent(cleaned)}` : ''}`;
        navigate(url);
      }
    },
    [navigate, onClose, persistRecent, permissions]
  );

  // Keyboard navigation
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (flatResults.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        goToFreeText(query);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(flatResults.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      performEntry(flatResults[activeIndex]);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector(`[data-flat-idx="${activeIndex}"]`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const clearRecents = () => {
    setRecents([]);
    writeRecents(user, []);
  };

  const initialLoading = productsLoading && allProducts.length === 0;
  const totalIndexed =
    productEntries.length +
    userEntries.length +
    orderEntries.length +
    batchEntries.length +
    staticEntries.length;

  // Track flat index across groups for keyboard nav data attributes
  let flatIndex = 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[120] bg-slate-900/70 dark:bg-black/70 backdrop-blur-md flex items-start justify-center pt-[12vh] sm:pt-[18vh] px-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <motion.div
            key="palette-card"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/70 dark:border-slate-700/70 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <FiSearch className="text-slate-400 dark:text-slate-500 flex-shrink-0" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-lg focus:outline-none"
                autoComplete="off"
                spellCheck="false"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <FiX size={18} />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                Esc
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[55vh] overflow-y-auto">
              {/* Initial loading */}
              {initialLoading && (
                <div className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                  <div className="inline-block w-6 h-6 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin mb-3" />
                  <p className="text-sm">Loading…</p>
                </div>
              )}

              {/* No query: recent searches */}
              {!initialLoading && !query && (
                <div className="px-2 py-3">
                  {recents.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                          <FiClock size={12} /> Recent searches
                        </span>
                        <button
                          type="button"
                          onClick={clearRecents}
                          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          Clear
                        </button>
                      </div>
                      <ul className="space-y-1">
                        {recents.map((r) => (
                          <li key={r}>
                            <button
                              type="button"
                              onClick={() => goToFreeText(r)}
                              className="w-full text-left px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
                            >
                              <FiClock size={14} className="text-slate-400" />
                              <span>{r}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <FiSearch className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={28} />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Start typing to search across the site
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Has query, has results — grouped */}
              {!initialLoading && query && grouped.length > 0 && (
                <div className="py-2">
                  {grouped.map((group) => (
                    <div key={group.group} className="px-2 mb-1">
                      <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        {group.group}
                      </div>
                      <ul>
                        {group.items.map((entry) => {
                          const idx = flatIndex++;
                          return (
                            <li key={entry.id} data-flat-idx={idx}>
                              <ResultRow
                                entry={entry}
                                query={query}
                                isActive={idx === activeIndex}
                                onHover={() => setActiveIndex(idx)}
                                onSelect={() => performEntry(entry)}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Has query, no matches */}
              {!initialLoading && query && grouped.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <FiSearch className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={28} />
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    No matches for &ldquo;<span className="font-semibold">{query}</span>&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => goToFreeText(query)}
                    className="text-sm font-semibold text-teal-600 dark:text-teal-300 hover:underline"
                  >
                    Search the full catalog →
                  </button>
                </div>
              )}
            </div>

            {/* Footer with key hints */}
            <div className="hidden sm:flex items-center justify-between gap-4 px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <kbd className="inline-flex items-center px-1.5 py-0.5 font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                    <FiArrowUp size={10} />
                  </kbd>
                  <kbd className="inline-flex items-center px-1.5 py-0.5 font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                    <FiArrowDown size={10} />
                  </kbd>
                  navigate
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <kbd className="inline-flex items-center px-1.5 py-0.5 font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                    <FiCornerDownLeft size={10} />
                  </kbd>
                  open
                </span>
              </div>
              <span>{totalIndexed > 0 ? `${totalIndexed} items indexed` : ''}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchPalette;
