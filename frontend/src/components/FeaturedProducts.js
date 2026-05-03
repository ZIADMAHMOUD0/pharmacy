import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiStar, FiShoppingCart, FiPackage, FiAlertCircle } from 'react-icons/fi';
import { productAPI } from '../services/api';

// Curated fallback shown only if the backend is unreachable / returns nothing.
// After Step 5 the products endpoint is publicly readable, so under normal
// conditions visitors see real data.
const FALLBACK = [
  {
    id: 'f1',
    name: 'Vitamin C Complex',
    manufacturer: 'PharmaCare Wellness',
    category_name: 'Vitamins & Supplements',
    price: '12.99',
    image_url: '/assets/images/categories/vitamins.jpg',
    badge: 'Best Seller',
  },
  {
    id: 'f2',
    name: 'Pain Relief Tablets',
    manufacturer: 'MediHealth',
    category_name: 'OTC Medicine',
    price: '8.49',
    image_url: '/assets/images/categories/otc.jpg',
    badge: 'Popular',
  },
  {
    id: 'f3',
    name: 'Allergy Relief 24h',
    manufacturer: 'HealNow',
    category_name: 'Prescription',
    price: '24.99',
    image_url: '/assets/images/categories/prescription.jpg',
    badge: 'New',
  },
  {
    id: 'f4',
    name: 'Gentle Skin Moisturizer',
    manufacturer: 'DermaCare',
    category_name: 'Personal Care',
    price: '15.50',
    image_url: '/assets/images/categories/personal-care.jpg',
  },
  {
    id: 'f5',
    name: 'Baby Fever Drops',
    manufacturer: 'KidsHealth',
    category_name: 'Baby & Kids',
    price: '11.20',
    image_url: '/assets/images/categories/baby.jpg',
    badge: 'Trusted',
  },
  {
    id: 'f6',
    name: 'Digital Blood Pressure Monitor',
    manufacturer: 'VitalCheck',
    category_name: 'Medical Devices',
    price: '49.00',
    image_url: '/assets/images/categories/medical-devices.jpg',
  },
];

const DISPLAY_COUNT = 6;
const CATEGORY_FALLBACKS = [
  '/assets/images/categories/vitamins.jpg',
  '/assets/images/categories/otc.jpg',
  '/assets/images/categories/prescription.jpg',
  '/assets/images/categories/personal-care.jpg',
  '/assets/images/categories/baby.jpg',
  '/assets/images/categories/medical-devices.jpg',
];

// A real backend product may not have an image; substitute one of the curated
// category images so the card never renders broken.
const resolveImage = (product, idx) => {
  if (product.image_url) return product.image_url;
  return CATEGORY_FALLBACKS[idx % CATEGORY_FALLBACKS.length];
};

// Pick a 1-decimal "rating" deterministically from the id so a given product
// always shows the same stars across reloads. Pure cosmetic (no backend field).
const ratingFor = (id) => {
  const seed = String(id).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return (4.4 + (seed % 6) * 0.1).toFixed(1);
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const ProductCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-soft animate-pulse">
    <div className="h-56 skeleton" />
    <div className="p-5">
      <div className="w-24 h-6 rounded-full skeleton mb-3" />
      <div className="w-3/4 h-5 skeleton mb-2" />
      <div className="w-1/2 h-4 skeleton mb-4" />
      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <div className="w-20 h-8 skeleton" />
        <div className="w-32 h-10 rounded-xl skeleton" />
      </div>
    </div>
  </div>
);

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    productAPI
      .getAll()
      .then((res) => {
        if (cancelled) return;
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        // Newest first — backend default is `-created_at`, but be defensive in
        // case any caller reorders. This also gracefully handles empty arrays.
        const sorted = [...data].sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at) - new Date(a.created_at);
          }
          return 0;
        });

        if (sorted.length === 0) {
          setProducts(FALLBACK);
          setUsingFallback(true);
        } else {
          setProducts(sorted.slice(0, DISPLAY_COUNT));
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Backend not yet upgraded, network down, or auth-gated — show curated set.
        setProducts(FALLBACK);
        setUsingFallback(true);
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="featured" className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 section-padding scroll-mt-24">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 text-sm font-medium mb-4">
              Featured Products
            </span>
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-slate-800 dark:text-slate-100 mb-4">
              {loading ? 'Loading our latest picks…' : 'Trusted picks, ready to ship'}
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
              {usingFallback
                ? 'A curated selection of our customers’ favorites — sign in to browse the full catalog.'
                : 'Fresh from our catalog — sign in to add to cart and view full details.'}
            </p>
          </div>
          <Link
            to="/login"
            className="hidden md:inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors font-semibold text-teal-700 dark:text-teal-300 shadow-soft"
          >
            View all products <FiArrowRight />
          </Link>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: DISPLAY_COUNT }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state — only reachable if both real fetch and FALLBACK ever fail */}
        {!loading && products.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {error ? (
                <FiAlertCircle className="text-slate-400 dark:text-slate-500" size={32} />
              ) : (
                <FiPackage className="text-slate-400 dark:text-slate-500" size={32} />
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium mb-2">
              {error ? 'Could not load products right now.' : 'No products available yet.'}
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm">Please check back shortly.</p>
          </div>
        )}

        {/* Loaded grid */}
        {!loading && products.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {products.map((p, idx) => {
              const imageSrc = resolveImage(p, idx);
              const rating = ratingFor(p.id);
              const isLowStock =
                typeof p.total_stock === 'number' && p.total_stock > 0 && p.total_stock <= 5;
              const isOutOfStock = typeof p.total_stock === 'number' && p.total_stock === 0;
              const showBadge = p.badge || (isLowStock && 'Low Stock') || null;

              return (
                <motion.article
                  key={p.id}
                  variants={cardVariants}
                  whileHover={{ y: -6 }}
                  className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-soft-xl transition-all duration-500"
                >
                  <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={imageSrc}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = CATEGORY_FALLBACKS[idx % CATEGORY_FALLBACKS.length];
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {showBadge && (
                      <span
                        className={`absolute top-4 left-4 px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-bold shadow-md ${
                          isLowStock
                            ? 'bg-rose-500/95 text-white'
                            : 'bg-white/95 text-teal-700'
                        }`}
                      >
                        {showBadge}
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-slate-700/95 text-white text-xs font-bold shadow-md">
                        Out of Stock
                      </span>
                    )}

                    <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm shadow-md">
                      <FiStar size={12} className="text-amber-500" fill="currentColor" />
                      <span className="text-xs font-bold text-slate-700">{rating}</span>
                    </div>
                  </div>

                  <div className="p-5">
                    {p.category_name && (
                      <span className="inline-block bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                        {p.category_name}
                      </span>
                    )}
                    <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100 mb-1 line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-1">
                      {p.manufacturer || ' '}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-2xl font-display font-bold text-teal-600 dark:text-teal-300">${p.price}</p>
                      <Link
                        to="/login"
                        className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-300 flex items-center gap-2 text-sm"
                      >
                        <FiShoppingCart size={16} />
                        Sign in to buy
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}

        <div className="mt-10 text-center md:hidden">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-colors font-semibold text-teal-700 shadow-soft"
          >
            View all products <FiArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
