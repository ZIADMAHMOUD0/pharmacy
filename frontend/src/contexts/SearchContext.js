import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const SearchContext = createContext({ open: false, openPalette: () => {}, closePalette: () => {} });

export const useSearchPalette = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);

  // Global Ctrl+K / Cmd+K shortcut to toggle the palette.
  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const triggered = (isMac ? e.metaKey : e.ctrlKey) && (e.key === 'k' || e.key === 'K');
      if (triggered) {
        e.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <SearchContext.Provider value={{ open, openPalette, closePalette }}>
      {children}
    </SearchContext.Provider>
  );
};
