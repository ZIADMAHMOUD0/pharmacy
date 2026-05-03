import React from 'react';

/**
 * Lightweight table skeleton — renders N pulsing rows with the same column
 * count as the real table, so the layout doesn't jump when data arrives.
 *
 * Used by admin/manager pages while the cache is cold. We deliberately do
 * NOT animate per-row independently (single shared `animate-pulse` group)
 * so the skeleton stays cheap on slower devices.
 */
const TableSkeleton = ({ columns = 5, rows = 6 }) => {
  return (
    <div
      role="status"
      aria-label="Loading data"
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 overflow-hidden animate-pulse"
    >
      {/* Header bar */}
      <div className="bg-slate-100 dark:bg-slate-800 h-12" />
      {/* Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4 flex items-center gap-4">
            {Array.from({ length: columns }).map((__, c) => (
              <div
                key={c}
                className={`h-3.5 rounded bg-slate-200 dark:bg-slate-700 ${
                  c === 0 ? 'flex-1' : 'w-24'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;
