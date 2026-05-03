import React from 'react';

const StockIndicator = ({ stock }) => {
  if (stock > 5) {
    return (
      <span className="inline-flex items-center gap-2 text-emerald-600 text-sm font-medium">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
        In Stock
      </span>
    );
  }
  if (stock > 0) {
    return (
      <span className="inline-flex items-center gap-2 text-amber-600 text-sm font-medium">
        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
        Only {stock} left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-rose-600 text-sm font-medium">
      <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
      Out of Stock
    </span>
  );
};

export default StockIndicator;
