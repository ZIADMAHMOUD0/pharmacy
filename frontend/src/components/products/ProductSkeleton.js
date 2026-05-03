import React from 'react';

const ProductSkeleton = ({ viewMode }) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex animate-pulse">
        <div className="w-48 h-48 flex-shrink-0 skeleton" />
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="w-24 h-6 rounded-full skeleton mb-3" />
            <div className="w-3/4 h-6 skeleton mb-2" />
            <div className="w-1/3 h-4 skeleton mb-4" />
            <div className="w-2/3 h-4 skeleton mb-1" />
            <div className="w-1/2 h-4 skeleton" />
          </div>
          <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="w-20 h-8 skeleton mb-2" />
              <div className="w-24 h-4 skeleton" />
            </div>
            <div className="w-24 h-10 rounded-xl skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="h-52 skeleton" />
      <div className="p-5">
        <div className="w-24 h-6 rounded-full skeleton mb-3" />
        <div className="w-3/4 h-6 skeleton mb-2" />
        <div className="w-1/3 h-4 skeleton mb-4" />
        <div className="w-full h-4 skeleton mb-1" />
        <div className="w-2/3 h-4 skeleton mb-4" />
        <div className="w-24 h-4 skeleton mb-4" />
        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="w-20 h-8 skeleton" />
          <div className="w-24 h-10 rounded-xl skeleton" />
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;
