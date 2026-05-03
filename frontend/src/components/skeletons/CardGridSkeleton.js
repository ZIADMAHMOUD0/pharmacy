import React from 'react';

/**
 * Card-grid skeleton — used while ManageProducts / ManageCategories load.
 * Mirrors the eventual grid (image area + meta lines + button row) so the
 * page doesn't reflow when the real cards arrive.
 */
const CardGridSkeleton = ({ count = 8, withImage = true }) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 overflow-hidden"
        >
          {withImage && (
            <div className="h-48 bg-slate-100 dark:bg-slate-800" />
          )}
          <div className="p-5 space-y-3">
            <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-8 w-20 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardGridSkeleton;
