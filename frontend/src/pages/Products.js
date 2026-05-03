import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiShoppingCart,
  FiSearch,
  FiFilter,
  FiX,
  FiPackage,
  FiAlertTriangle,
  FiGrid,
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
} from 'react-icons/fi';
import { cartAPI, categoryAPI } from '../services/api';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';
import ProductCard from '../components/products/ProductCard';
import ProductSkeleton from '../components/products/ProductSkeleton';
import SortDropdown, { sortProducts } from '../components/products/SortDropdown';
import QuickPreviewModal from '../components/products/QuickPreviewModal';
import { useProductsCache } from '../contexts/ProductsCacheContext';

const PAGE_SIZE = 12;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initial state from URL deep-links: /products?category=3, ?q=foo, ?focus=42
  const initialCategory = searchParams.get('category') || 'all';
  const initialQuery = searchParams.get('q') || '';
  const initialFocus = searchParams.get('focus') || '';

  // Shared cache across pages — instant render if already loaded by palette/idle
  const { items: allProducts, loading: cacheLoading, ready: cacheReady, refetch } = useProductsCache();

  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortKey, setSortKey] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState({});
  const [previewProduct, setPreviewProduct] = useState(null);
  const [focusedId, setFocusedId] = useState(initialFocus);
  const [allergyWarning, setAllergyWarning] = useState({
    show: false,
    product: null,
    matchingAllergies: [],
    activeIngredient: '',
  });
  const toast = useToast();

  // Show skeletons only on the very first cold load (before any data arrives).
  const loading = cacheLoading && allProducts.length === 0;

  // Refresh on mount in the background (stale-while-revalidate handled by cache)
  useEffect(() => {
    refetch().catch(() => toast.error('Failed to load products'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Reset to page 1 whenever any filter/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortKey]);

  // Keep the URL in sync with the selected category & search for shareable links.
  // Preserve `focus` while it's still relevant.
  useEffect(() => {
    const next = {};
    if (selectedCategory && selectedCategory !== 'all') next.category = selectedCategory;
    if (searchQuery) next.q = searchQuery;
    if (focusedId) next.focus = focusedId;
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery, focusedId]);

  // ---- Derived (filter -> sort -> paginate) ----------------------------
  const filteredProducts = useMemo(() => {
    let list = allProducts;

    if (selectedCategory && selectedCategory !== 'all') {
      const id = String(selectedCategory);
      list = list.filter((p) => String(p.category_id ?? p.category) === id);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.manufacturer || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [allProducts, selectedCategory, searchQuery]);

  const sortedProducts = useMemo(
    () => sortProducts(filteredProducts, sortKey),
    [filteredProducts, sortKey]
  );

  const totalProducts = allProducts.length;
  const filteredCount = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  const pageProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedProducts.slice(start, start + PAGE_SIZE);
  }, [sortedProducts, currentPage]);

  // Ctrl+K → click result behavior:
  // 1. When focusedId is set, find which page the product lives on and jump there.
  // 2. After render, scroll the card into view.
  // 3. After 3.5s, clear the highlight ring + drop ?focus from the URL.
  useEffect(() => {
    if (!focusedId || !cacheReady || sortedProducts.length === 0) return undefined;
    const idx = sortedProducts.findIndex((p) => String(p.id) === String(focusedId));
    if (idx === -1) return undefined;

    const targetPage = Math.floor(idx / PAGE_SIZE) + 1;
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
      return undefined; // Wait for re-render — effect re-runs once page matches
    }

    // We're on the right page — scroll the card into view next frame
    const raf = window.requestAnimationFrame(() => {
      const el = document.querySelector(`[data-product-id="${focusedId}"]`);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    const timer = setTimeout(() => setFocusedId(''), 3500);
    return () => {
      window.cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [focusedId, cacheReady, sortedProducts, currentPage]);

  // Derive a count per category for the sidebar (always reflects full catalog)
  const categoryCounts = useMemo(() => {
    const counts = new Map();
    allProducts.forEach((p) => {
      const id = String(p.category_id ?? p.category ?? '');
      counts.set(id, (counts.get(id) || 0) + 1);
    });
    return counts;
  }, [allProducts]);

  // ---- Cart actions (unchanged backend contract) -----------------------
  const addToCart = async (productId, forceAdd = false) => {
    const product = allProducts.find((p) => p.id === productId);

    if (!forceAdd && product) {
      try {
        const response = await cartAPI.checkAllergy(productId);
        if (response.data.has_allergy) {
          setAllergyWarning({
            show: true,
            product,
            matchingAllergies: response.data.allergies,
            activeIngredient: response.data.active_ingredient,
          });
          return;
        }
      } catch (error) {
        console.error('Error checking allergy:', error);
      }
    }

    try {
      setAddingToCart((prev) => ({ ...prev, [productId]: true }));
      await cartAPI.addToCart({ product: productId, quantity: 1 });
      toast.success('Added to cart successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add item to cart');
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleConfirmAddToCart = async () => {
    if (allergyWarning.product) {
      await addToCart(allergyWarning.product.id, true);
    }
    setAllergyWarning({ show: false, product: null, matchingAllergies: [], activeIngredient: '' });
  };

  const getSeverityColor = (severity) => {
    const colors = {
      mild: 'bg-amber-50 text-amber-700 border-amber-200',
      moderate: 'bg-orange-50 text-orange-700 border-orange-200',
      severe: 'bg-rose-50 text-rose-700 border-rose-200',
      life_threatening: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[severity] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const goToPage = (next) => {
    setCurrentPage(next);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // ---- UI --------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      <QuickPreviewModal
        product={previewProduct}
        onClose={() => setPreviewProduct(null)}
        addingToCart={previewProduct ? addingToCart[previewProduct.id] : false}
        onAddToCart={() => {
          if (previewProduct) addToCart(previewProduct.id);
        }}
      />

      {/* Allergy Warning Modal */}
      {allergyWarning.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FiAlertTriangle className="text-rose-600" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-rose-600">Allergy Warning!</h2>
                <p className="text-slate-500 text-sm">Potential allergen detected</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6">
              <p className="text-slate-700 mb-4">
                <strong className="text-slate-800">{allergyWarning.product?.name}</strong> contains
                ingredients you may be allergic to:
              </p>

              {(allergyWarning.activeIngredient || allergyWarning.product?.active_ingredient) && (
                <div className="bg-white border border-teal-200 rounded-xl p-4 mb-4">
                  <p className="text-teal-700 text-sm font-medium mb-1">Active Ingredient</p>
                  <p className="text-teal-800 font-semibold">
                    {allergyWarning.activeIngredient || allergyWarning.product?.active_ingredient}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {allergyWarning.matchingAllergies.map((allergy, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${getSeverityColor(allergy.severity)}`}>
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">{allergy.allergen}</span>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/50">
                        {allergy.severity_display || allergy.severity}
                      </span>
                    </div>
                    {allergy.reaction && (
                      <p className="text-sm mt-2 opacity-80">Reaction: {allergy.reaction}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-slate-500 text-sm mb-6">
              Please consult with a healthcare professional before using this product.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setAllergyWarning({
                    show: false,
                    product: null,
                    matchingAllergies: [],
                    activeIngredient: '',
                  })
                }
                className="flex-1 py-3.5 bg-slate-100 rounded-xl font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddToCart}
                className="flex-1 py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-rose-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30"
              >
                <FiShoppingCart size={18} />
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700"></div>
        <div className="absolute inset-0 pattern-pharmacy opacity-10"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-10 right-20 w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl animate-float animation-delay-1000"></div>

        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              {totalProducts} products available
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Our Products
            </h1>
            <p className="text-xl text-white/70 mb-8">
              Discover quality pharmaceutical products for your health needs
            </p>

            <div className="relative max-w-2xl">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
              <input
                type="text"
                placeholder="Search products, categories, manufacturers..."
                className="w-full pl-14 pr-14 py-4 bg-white rounded-2xl shadow-soft-xl text-slate-800 text-lg focus:outline-none focus:ring-4 focus:ring-teal-500/30 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1.5 transition-colors"
                  aria-label="Clear search"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        {/* Mobile Filters Toggle */}
        <button
          onClick={() => setMobileFiltersOpen((v) => !v)}
          className="lg:hidden w-full mb-4 flex items-center justify-between px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-soft text-slate-700 dark:text-slate-200 font-semibold"
          aria-expanded={mobileFiltersOpen}
        >
          <span className="flex items-center gap-2">
            <FiFilter className="text-teal-600" /> Categories &amp; Filters
          </span>
          <FiChevronDown
            className={`transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className={`lg:w-72 flex-shrink-0 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft p-6 lg:sticky lg:top-24 border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FiFilter className="text-teal-600 dark:text-teal-400" /> Categories
                </h3>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full px-4 py-3.5 rounded-xl text-left font-medium transition-all duration-300 flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>All Products</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-sm font-semibold ${
                      selectedCategory === 'all' ? 'bg-white/20' : 'bg-white text-slate-600'
                    }`}
                  >
                    {totalProducts}
                  </span>
                </button>

                {categories.map((category) => {
                  const idStr = category.id.toString();
                  const isActive = selectedCategory === idStr;
                  const count = category.product_count ?? categoryCounts.get(idStr) ?? 0;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(idStr)}
                      className={`w-full px-4 py-3.5 rounded-xl text-left font-medium transition-all duration-300 flex items-center justify-between ${
                        isActive
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{category.name}</span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-sm font-semibold ${
                          isActive ? 'bg-white/20' : 'bg-white text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Stats */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-display font-semibold text-slate-800 dark:text-slate-100 mb-4">Quick Stats</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Total Products</span>
                    <span className="font-bold text-teal-600 dark:text-teal-300">{totalProducts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Categories</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-300">{categories.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">In Stock</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {allProducts.filter((p) => p.total_stock > 0).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-soft border border-slate-100 dark:border-slate-800 transition-colors">
              <p className="text-slate-600 dark:text-slate-300">
                Showing{' '}
                <span className="font-bold text-slate-800 dark:text-slate-100">{pageProducts.length}</span> of{' '}
                <span className="font-bold text-slate-800 dark:text-slate-100">{filteredCount}</span> products
                {searchQuery && <span className="text-teal-600 dark:text-teal-300"> for "{searchQuery}"</span>}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <SortDropdown value={sortKey} onChange={setSortKey} />
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <FiGrid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <FiList size={20} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {Array.from({ length: 9 }).map((_, index) => (
                  <ProductSkeleton key={index} viewMode={viewMode} />
                ))}
              </div>
            ) : pageProducts.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-800 transition-colors">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FiPackage className="text-slate-400 dark:text-slate-500" size={40} />
                </div>
                <h3 className="text-xl font-display font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  No products found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSortKey('featured');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  // Re-trigger stagger when sort/filter/page changes
                  key={`${sortKey}-${selectedCategory}-${currentPage}-${searchQuery}`}
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {pageProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                      viewMode={viewMode}
                      addingToCart={addingToCart[product.id]}
                      onAddToCart={() => addToCart(product.id)}
                      onQuickView={() => setPreviewProduct(product)}
                      isFocused={String(focusedId) === String(product.id)}
                    />
                  ))}
                </motion.div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-12 gap-4">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => goToPage(currentPage - 1)}
                      className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-teal-600 dark:text-teal-300"
                      aria-label="Previous page"
                    >
                      <FiChevronLeft size={24} />
                    </button>
                    <span className="px-5 py-2.5 bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 rounded-xl font-bold border border-teal-100 dark:border-teal-500/30">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => goToPage(currentPage + 1)}
                      className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-teal-600 dark:text-teal-300"
                      aria-label="Next page"
                    >
                      <FiChevronRight size={24} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
