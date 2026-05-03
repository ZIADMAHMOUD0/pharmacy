import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext({
  ids: [],
  has: () => false,
  toggle: () => {},
  clear: () => {},
  count: 0,
});

// Wishlist is bound to the authenticated user. Logged-out browsing uses a
// separate 'guest' bucket so two real users never see each other's data on
// shared devices.
const storageKeyFor = (user) => {
  if (user?.id != null) return `pharmacare:wishlist:user-${user.id}`;
  return 'pharmacare:wishlist:guest';
};

const readStored = (user) => {
  try {
    const raw = localStorage.getItem(storageKeyFor(user));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map((v) => String(v)))];
  } catch {
    return [];
  }
};

const writeStored = (user, ids) => {
  try {
    localStorage.setItem(storageKeyFor(user), JSON.stringify(ids));
  } catch {
    // privacy mode / quota — ignore
  }
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [ids, setIds] = useState(() => readStored(user));

  // Reload whenever the active user changes (login, logout, account switch)
  useEffect(() => {
    setIds(readStored(user));
  }, [user?.id]);

  // Persist on every change, scoped to the active user's key
  useEffect(() => {
    writeStored(user, ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  // Cross-tab sync — only mirror events for the CURRENT user's key
  useEffect(() => {
    const myKey = storageKeyFor(user);
    const onStorage = (e) => {
      if (e.key !== myKey) return;
      try {
        const parsed = e.newValue ? JSON.parse(e.newValue) : [];
        if (Array.isArray(parsed)) {
          setIds([...new Set(parsed.map((v) => String(v)))]);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user?.id]);

  const has = useCallback(
    (id) => {
      if (id === undefined || id === null) return false;
      return ids.includes(String(id));
    },
    [ids]
  );

  const toggle = useCallback((id) => {
    if (id === undefined || id === null) return;
    const key = String(id);
    setIds((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({ ids, has, toggle, clear, count: ids.length }),
    [ids, has, toggle, clear]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => useContext(WishlistContext);
