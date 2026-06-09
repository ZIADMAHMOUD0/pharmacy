import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from 'react';
import { useLocation } from 'react-router-dom';
import { productAPI } from '../../services/api';
import {
  FiPackage, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX,
  FiAlertTriangle, FiImage, FiUpload, FiFilter
} from 'react-icons/fi';
import ConfirmModal from '../../components/ConfirmModal';
import ToastContainer from '../../components/ToastContainer';
import { useToast } from '../../hooks/useToast';
import { useFocusOnArrival } from '../../hooks/useFocusOnArrival';
import { useProductsCache } from '../../contexts/ProductsCacheContext';
import { useCategoriesCache } from '../../contexts/CategoriesCacheContext';
import CardGridSkeleton from '../../components/skeletons/CardGridSkeleton';

const ManageProducts = () => {
  const location = useLocation();
  // Shared SWR caches — products and categories are read by multiple admin
  // pages, so the second visit is instant and the first visit is usually warm
  // thanks to the idle prefetch the providers run on app boot.
  const {
    items: products,
    loading: productsLoading,
    refetch: refetchProducts,
    invalidate: invalidateProducts,
  } = useProductsCache();
  const {
    items: categories,
    refetch: refetchCategories,
  } = useCategoriesCache();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  // 'all' | 'low' | 'out' — controlled by the clickable stat cards below.
  // Resets to 'all' whenever the underlying products array changes (e.g. cache
  // refetch) so a refresh never leaves the UI stranded in an empty filter.
  const [stockFilter, setStockFilter] = useState('all');
  // Only show the skeleton when there's nothing to render yet — background
  // revalidation must never replace cards with a spinner.
  const loading = productsLoading && products.length === 0;
  
  // Image handling
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    manufacturer: '',
    active_ingredient: '',
    requires_prescription: false,
    low_stock_threshold: 10
  });

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  // Scroll-to + highlight when arriving from Ctrl+K with ?focus=<id>
  useFocusOnArrival('focus', !loading && products.length > 0);

  useEffect(() => {
    refetchProducts().catch(() => toast.error('Failed to load products'));
    refetchCategories().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize category filter from URL query (?categoryId=123)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryId = params.get('categoryId');
    if (categoryId) {
      setFilterCategory(categoryId);
    }
  }, [location.search]);

  // After a write, force the next read to skip the cache and pick up the
  // server-side change. We do not rely on optimistic updates here because
  // the backend may also recompute fields like is_low_stock and total_stock.
  const refreshProducts = useCallback(async () => {
    invalidateProducts();
    await refetchProducts();
  }, [invalidateProducts, refetchProducts]);

  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setActionLoading(false);
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create FormData for file upload
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', parseFloat(formData.price));
    data.append('category', parseInt(formData.category));
    data.append('manufacturer', formData.manufacturer);
    data.append('active_ingredient', formData.active_ingredient);
    data.append('requires_prescription', formData.requires_prescription);
    data.append('low_stock_threshold', parseInt(formData.low_stock_threshold));
    
    // Add image if selected
    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      if (editingProduct) {
        await productAPI.update(editingProduct.id, data);
        toast.success('Product updated successfully!');
      } else {
        await productAPI.create(data);
        toast.success('Product created successfully!');
      }
      closeModal();
      refreshProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category || '',
      manufacturer: product.manufacturer || '',
      active_ingredient: product.active_ingredient || '',
      requires_prescription: product.requires_prescription,
      low_stock_threshold: product.low_stock_threshold
    });
    // Set existing image preview
    if (product.image_url) {
      setImagePreview(product.image_url);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = (product) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product',
      message: `Delete "${product.name}"? This cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await productAPI.delete(product.id);
          toast.success('Product deleted!');
          refreshProducts();
        } catch (error) {
          toast.error('Error deleting product');
        } finally {
          closeConfirmModal();
        }
      },
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      manufacturer: '',
      active_ingredient: '',
      requires_prescription: false,
      low_stock_threshold: 10
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingProduct(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Defer the search query so typing doesn't re-run filtering on every keystroke.
  // The input stays responsive; the grid catches up on the next idle frame.
  const deferredSearch = useDeferredValue(searchQuery);

  const filteredProducts = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const cat = filterCategory ? parseInt(filterCategory, 10) : null;
    if (!q && cat == null && stockFilter === 'all') return products;
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.manufacturer?.toLowerCase().includes(q);
      const matchesCategory = cat == null || p.category === cat;
      // Mutually exclusive stock buckets — see the stats memo below for the
      // matching definition (out-of-stock is NOT a sub-case of low-stock).
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && p.is_low_stock && p.total_stock > 0) ||
        (stockFilter === 'out' && p.total_stock === 0);
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, deferredSearch, filterCategory, stockFilter]);

  // Single pass over the products list to compute all three stats at once,
  // memoized so it only recomputes when the products array reference changes.
  // The buckets are mutually exclusive: a product with `total_stock === 0`
  // counts only towards `out`, never `low`, even though the backend's
  // `is_low_stock` is True for it (since `total_stock <= threshold`).
  const stats = useMemo(() => {
    let low = 0;
    let out = 0;
    for (const p of products) {
      if (p.total_stock === 0) out += 1;
      else if (p.is_low_stock) low += 1;
    }
    return { total: products.length, low, out };
  }, [products]);
  const totalProducts = stats.total;
  const lowStockProducts = stats.low;
  const outOfStock = stats.out;

  // Reset the stock filter whenever the products list itself changes
  // (e.g. cache refetch after a write). Otherwise a stale filter could keep
  // the grid empty after a deletion.
  useEffect(() => {
    setStockFilter('all');
  }, [products]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        onClose={closeConfirmModal} 
        onConfirm={confirmModal.onConfirm} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        type={confirmModal.type} 
        confirmText={confirmModal.confirmText} 
        loading={actionLoading} 
      />

      {/* Hero */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700"></div>
        <div className="absolute inset-0 pattern-pharmacy opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <FiPackage className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold text-white">Manage Products</h1>
                <p className="text-white/60">{products.length} products in catalog</p>
              </div>
            </div>
            <button 
              onClick={() => { resetForm(); setShowModal(true); }} 
              className="px-6 py-3 bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-300 rounded-xl font-semibold hover:bg-teal-50 dark:bg-teal-500/15 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <FiPlus /> Add Product
            </button>
          </div>

          {/* Stats — each card doubles as a filter toggle for the grid below.
              Clicking the same card again, or the "Total Products" card,
              clears the stock filter back to All. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-3xl">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              aria-pressed={stockFilter === 'all'}
              className={`text-left bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 transition-all hover:bg-white/15 ${
                stockFilter === 'all' ? 'ring-2 ring-white/50 bg-white/15' : ''
              }`}
            >
              <p className="text-4xl font-display font-bold text-white">{totalProducts}</p>
              <p className="text-white/60 text-sm font-medium">Total Products</p>
            </button>
            <button
              type="button"
              onClick={() => setStockFilter((prev) => (prev === 'low' ? 'all' : 'low'))}
              aria-pressed={stockFilter === 'low'}
              className={`text-left bg-amber-500/20 backdrop-blur-sm rounded-2xl p-5 border border-amber-400/20 transition-all hover:bg-amber-500/30 ${
                stockFilter === 'low' ? 'ring-2 ring-amber-200/70 bg-amber-500/30' : ''
              }`}
            >
              <p className="text-4xl font-display font-bold text-amber-100">{lowStockProducts}</p>
              <p className="text-amber-200/70 text-sm font-medium">Low Stock</p>
            </button>
            <button
              type="button"
              onClick={() => setStockFilter((prev) => (prev === 'out' ? 'all' : 'out'))}
              aria-pressed={stockFilter === 'out'}
              className={`text-left bg-rose-500/20 backdrop-blur-sm rounded-2xl p-5 border border-rose-400/20 transition-all hover:bg-rose-500/30 ${
                stockFilter === 'out' ? 'ring-2 ring-rose-200/70 bg-rose-500/30' : ''
              }`}
            >
              <p className="text-4xl font-display font-bold text-rose-100">{outOfStock}</p>
              <p className="text-rose-200/70 text-sm font-medium">Out of Stock</p>
            </button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        {categories.length === 0 && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <FiAlertTriangle className="text-amber-600 dark:text-amber-300" size={24} />
            </div>
            <div>
              <p className="font-semibold text-amber-800">Categories Required</p>
              <p className="text-amber-700 dark:text-amber-300 text-sm">Please create categories first before adding products.</p>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft p-5 mb-6 border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
              <input
                type="text"
                placeholder="Search products by name or manufacturer..."
                className="w-full pl-12 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-12 pr-8 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white dark:bg-slate-900 appearance-none min-w-[200px]"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Active-stock-filter chip — only visible when a stat card is
              selected, so the admin can still see (and clear) the filter
              after scrolling past the hero. */}
          {stockFilter !== 'all' && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-500 dark:text-slate-400">Filtered by:</span>
              <button
                type="button"
                onClick={() => setStockFilter('all')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  stockFilter === 'low'
                    ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/25'
                    : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/25'
                }`}
                aria-label="Clear stock filter"
              >
                {stockFilter === 'low' ? 'Low Stock' : 'Out of Stock'}
                <FiX size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <CardGridSkeleton count={8} />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiPackage className="text-slate-400 dark:text-slate-500" size={40} />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium mb-2">No products found</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                data-focus-id={product.id}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden hover:shadow-soft-xl transition-all duration-300 group border border-slate-100 dark:border-slate-800 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Product Image */}
                <div className="relative h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-center text-slate-400 dark:text-slate-500">
                      <FiImage size={48} className="mx-auto mb-2" />
                      <p className="text-sm">No Image</p>
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.requires_prescription && (
                      <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        ℞ Rx Required
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {product.is_low_stock && product.total_stock > 0 && (
                      <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
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

                {/* Product Info */}
                <div className="p-5">
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100 mb-2 line-clamp-1 group-hover:text-teal-600 dark:text-teal-300 transition-colors">{product.name}</h3>
                  {product.category_name && (
                    <span className="inline-block bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                      {product.category_name}
                    </span>
                  )}
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">🏭 {product.manufacturer || 'Unknown'}</p>
                  {product.active_ingredient && (
                    <p className="text-teal-600 dark:text-teal-300 text-xs mb-3 flex items-center gap-1">
                      💊 <span className="font-medium">{product.active_ingredient}</span>
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700 border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-2xl font-display font-bold text-teal-600 dark:text-teal-300">${product.price}</p>
                      <p className={`text-sm font-medium ${product.total_stock === 0 ? 'text-rose-500 dark:text-rose-400' : product.is_low_stock ? 'text-amber-600 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        Stock: {product.total_stock || 0}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2.5 text-teal-600 dark:text-teal-300 hover:bg-teal-50 dark:bg-teal-500/15 rounded-xl transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="p-2.5 text-rose-500 dark:text-rose-400 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg my-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <FiPackage className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors">
                <FiX size={20} className="text-slate-400 dark:text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Product Image (Optional)</label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-center hover:border-teal-400 transition-colors">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-h-40 rounded-xl mx-auto shadow-md"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 hover:bg-rose-600 shadow-lg"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer py-6"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-14 h-14 bg-teal-50 dark:bg-teal-500/15 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <FiUpload className="text-teal-600 dark:text-teal-300" size={24} />
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 font-medium">Click to upload image</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Name *</label>
                <input 
                  type="text" 
                  className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Category *</label>
                <select 
                  className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white dark:bg-slate-900" 
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value})} 
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Price & Low Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Price ($) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Low Stock Alert</label>
                  <input 
                    type="number" 
                    className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" 
                    value={formData.low_stock_threshold} 
                    onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})} 
                  />
                </div>
              </div>

              {/* Manufacturer */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Manufacturer</label>
                <input 
                  type="text" 
                  className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" 
                  value={formData.manufacturer} 
                  onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} 
                />
              </div>

              {/* Active Ingredient */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Active Ingredient(s)</label>
                <input 
                  type="text" 
                  className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" 
                  placeholder="e.g., Paracetamol, Ibuprofen (separate with comma)"
                  value={formData.active_ingredient} 
                  onChange={(e) => setFormData({...formData, active_ingredient: e.target.value})} 
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                  💊 Used to warn users with allergies to these ingredients
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Description</label>
                <textarea 
                  className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" 
                  rows="3" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              {/* Requires Prescription */}
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.requires_prescription} 
                  onChange={(e) => setFormData({...formData, requires_prescription: e.target.checked})} 
                  className="w-5 h-5 rounded border-slate-300 text-teal-600 dark:text-teal-300 focus:ring-teal-500" 
                />
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Requires Prescription</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">This product needs a valid prescription</p>
                </div>
              </label>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-glow transition-all"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>

            {!editingProduct && (
              <div className="mt-6 p-4 bg-teal-50 dark:bg-teal-500/15 rounded-xl border border-teal-100">
                <p className="text-sm text-teal-700 dark:text-teal-300 flex items-center gap-2">
                  💡 <span>After creating the product, go to <strong>Manage Batches</strong> to add stock.</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;
