import React from 'react';
import { motion } from 'framer-motion';
import {
  FiShoppingCart,
  FiLoader,
  FiHeart,
  FiImage,
  FiBriefcase,
  FiDroplet,
  FiEye,
} from 'react-icons/fi';
import StockIndicator from './StockIndicator';
import { useWishlist } from '../../contexts/WishlistContext';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

const placeholderFor = (name) =>
  `https://via.placeholder.com/400x300/e0f2fe/0d9488?text=${encodeURIComponent(name || 'Product')}`;

const ProductCard = React.memo(({ product, viewMode, addingToCart, onAddToCart, onQuickView, isFocused = false }) => {
  const { has: isWishlisted, toggle: toggleWishlist } = useWishlist();
  const wished = isWishlisted(product.id);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -2 }}
        data-product-id={product.id}
        className={`group bg-white dark:bg-slate-900 rounded-2xl shadow-soft hover:shadow-soft-xl transition-all duration-300 border overflow-hidden flex ${
          isFocused
            ? 'border-teal-500 ring-2 ring-teal-400/40 dark:ring-teal-300/40'
            : 'border-slate-100 dark:border-slate-800'
        }`}
      >
        <div className="relative w-48 h-48 flex-shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = placeholderFor(product.name);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <FiImage size={40} />
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.requires_prescription && (
              <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                ℞ Rx
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            {product.category_name && (
              <span className="inline-block bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                {product.category_name}
              </span>
            )}
            <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">
              {product.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <FiBriefcase size={14} /> {product.manufacturer}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{product.description}</p>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-2xl font-display font-bold text-teal-600 dark:text-teal-300">${product.price}</p>
              <StockIndicator stock={product.total_stock} />
            </div>
            <motion.button
              onClick={onAddToCart}
              disabled={!product.total_stock || addingToCart}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/30 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
            >
              {addingToCart ? (
                <FiLoader className="animate-spin" size={18} />
              ) : (
                <>
                  <FiShoppingCart size={18} />
                  Add
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      data-product-id={product.id}
      className={`group bg-white dark:bg-slate-900 rounded-2xl shadow-soft hover:shadow-soft-xl overflow-hidden transition-all duration-500 border ${
        isFocused
          ? 'border-teal-500 ring-2 ring-teal-400/40 dark:ring-teal-300/40'
          : 'border-slate-100 dark:border-slate-800'
      }`}
    >
      <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = placeholderFor(product.name);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <FiImage size={48} className="mx-auto mb-2" />
              <p className="text-sm">No Image</p>
            </div>
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.requires_prescription && (
            <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              ℞ Prescription
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

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView();
              }}
              aria-label="Quick view"
              title="Quick view"
              className="w-10 h-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-teal-600 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
            >
              <FiEye size={18} />
            </button>
          )}
          <motion.button
            type="button"
            onClick={handleWishlist}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={wished}
            title={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            whileTap={{ scale: 0.85 }}
            animate={wished ? { scale: [1, 1.25, 1] } : { scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`w-10 h-10 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors shadow-lg ${
              wished
                ? 'opacity-100 bg-rose-50 dark:bg-rose-500/15 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/25'
                : 'opacity-0 group-hover:opacity-100 bg-white/95 dark:bg-slate-800/95 text-slate-400 dark:text-slate-300 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <FiHeart size={20} fill={wished ? 'currentColor' : 'none'} />
          </motion.button>
        </div>

        {/* Quick view bar — slides up on hover, full-width tap target */}
        {onQuickView && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView();
            }}
            className="absolute bottom-0 left-0 right-0 py-3 bg-slate-900/85 backdrop-blur-sm text-white text-sm font-semibold flex items-center justify-center gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          >
            <FiEye size={16} /> Quick View
          </button>
        )}
      </div>

      <div className="p-5">
        {product.category_name && (
          <span className="inline-block bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            {product.category_name}
          </span>
        )}

        <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100 mb-2 line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
          {product.name}
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
          <FiBriefcase size={14} /> {product.manufacturer}
        </p>
        {product.active_ingredient && (
          <p className="text-sm text-teal-600 dark:text-teal-300 mb-1 flex items-center gap-1.5">
            <FiDroplet size={14} />
            <span className="font-medium">{product.active_ingredient}</span>
          </p>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">{product.description}</p>

        <div className="mb-4">
          <StockIndicator stock={product.total_stock} />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-2xl font-display font-bold text-teal-600 dark:text-teal-300">${product.price}</p>

          <motion.button
            onClick={onAddToCart}
            disabled={!product.total_stock || addingToCart}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/30 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
          >
            {addingToCart ? (
              <FiLoader className="animate-spin" size={18} />
            ) : (
              <>
                <FiShoppingCart size={18} />
                Add
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
