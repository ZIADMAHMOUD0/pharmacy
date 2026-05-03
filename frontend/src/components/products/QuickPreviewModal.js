import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiX,
  FiShoppingCart,
  FiLoader,
  FiBriefcase,
  FiDroplet,
  FiImage,
  FiAlertTriangle,
  FiPackage,
} from 'react-icons/fi';
import StockIndicator from './StockIndicator';

const placeholderFor = (name) =>
  `https://via.placeholder.com/600x600/e0f2fe/0d9488?text=${encodeURIComponent(name || 'Product')}`;

const QuickPreviewModal = ({ product, onClose, onAddToCart, addingToCart }) => {
  // Lock body scroll while open
  useEffect(() => {
    if (!product) return undefined;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [product]);

  // Close on ESC
  useEffect(() => {
    if (!product) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, onClose]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="qp-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Quick preview: ${product.name}`}
        >
          <motion.div
            key="qp-card"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-auto"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-md hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
            >
              <FiX size={20} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Image */}
              <div className="relative aspect-square md:aspect-auto md:min-h-[420px] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {product.image_url ? (
                  <motion.img
                    key={product.id}
                    initial={{ scale: 1.05, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.35 }}
                    src={product.image_url}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = placeholderFor(product.name);
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    <FiImage size={56} />
                  </div>
                )}
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.requires_prescription && (
                    <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                      <FiAlertTriangle size={12} /> Prescription
                    </span>
                  )}
                  {product.total_stock <= 5 && product.total_stock > 0 && (
                    <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                      Low Stock
                    </span>
                  )}
                  {product.total_stock === 0 && (
                    <span className="bg-slate-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="p-6 md:p-8 flex flex-col">
                {product.category_name && (
                  <span className="self-start inline-block bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    {product.category_name}
                  </span>
                )}

                <h2 className="text-3xl font-display font-bold text-slate-800 dark:text-slate-100 mb-2 leading-tight">
                  {product.name}
                </h2>

                {product.manufacturer && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                    <FiBriefcase size={14} />
                    {product.manufacturer}
                  </p>
                )}

                {product.active_ingredient && (
                  <div className="bg-teal-50 border border-teal-100 dark:bg-teal-500/10 dark:border-teal-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <FiDroplet className="text-teal-600 dark:text-teal-300 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                        Active ingredient
                      </p>
                      <p className="text-sm text-teal-800 dark:text-teal-200 font-medium">
                        {product.active_ingredient}
                      </p>
                    </div>
                  </div>
                )}

                {product.description && (
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">{product.description}</p>
                )}

                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-end justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Price</p>
                      <p className="text-4xl font-display font-bold text-teal-600 dark:text-teal-300">
                        ${product.price}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center gap-1 justify-end">
                        <FiPackage size={12} /> Stock
                      </p>
                      <StockIndicator stock={product.total_stock} />
                    </div>
                  </div>

                  <motion.button
                    onClick={onAddToCart}
                    disabled={!product.total_stock || addingToCart}
                    whileHover={{ scale: !product.total_stock || addingToCart ? 1 : 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative w-full overflow-hidden py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-teal-500/30 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                    />
                    {addingToCart ? (
                      <>
                        <FiLoader className="animate-spin" size={18} />
                        Adding…
                      </>
                    ) : (
                      <>
                        <FiShoppingCart size={20} />
                        Add to Cart
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickPreviewModal;
