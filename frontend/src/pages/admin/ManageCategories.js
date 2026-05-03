import React, { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import { Link } from 'react-router-dom';
import { categoryAPI } from '../../services/api';
import { FiEdit, FiTrash2, FiPlus, FiGrid, FiSearch, FiX, FiPackage, FiTag } from 'react-icons/fi';
import ConfirmModal from '../../components/ConfirmModal';
import ToastContainer from '../../components/ToastContainer';
import { useToast } from '../../hooks/useToast';
import { useCategoriesCache } from '../../contexts/CategoriesCacheContext';
import CardGridSkeleton from '../../components/skeletons/CardGridSkeleton';

const ManageCategories = () => {
  // Shared SWR cache — first read may show a brief skeleton; later visits
  // (and visits after the idle prefetch) are instant.
  const { items: categories, loading: cacheLoading, refetch, invalidate } = useCategoriesCache();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '' });

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  // Only show the spinner state when there's nothing to display yet —
  // background revalidation should never replace rendered content with a spinner.
  const loading = cacheLoading && categories.length === 0;

  useEffect(() => {
    refetch().catch(() => toast.error('Failed to load categories'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual reload — used after create/update/delete so we definitely
  // get a fresh server payload instead of the pre-mutation cache.
  const fetchCategories = async () => {
    invalidate();
    try {
      await refetch();
    } catch {
      toast.error('Failed to load categories');
    }
  };

  // useCallback so the prop identity passed into memoized cards stays stable
  // across renders that don't change the underlying logic. Without this, every
  // keystroke in the search bar would invalidate React.memo on every card.
  const handleDelete = useCallback((category) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete "${category.name}"? This will affect all products in this category!`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await categoryAPI.delete(category.id);
          toast.success('Category deleted successfully!');
          invalidate();
          await refetch();
        } catch (error) {
          toast.error('Error deleting category. It may have products assigned.');
        } finally {
          setActionLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidate, refetch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoryAPI.update(editingCategory.id, formData);
        toast.success('Category updated successfully!');
      } else {
        await categoryAPI.create(formData);
        toast.success('Category created successfully!');
      }
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
      fetchCategories();
    } catch (error) {
      toast.error('Error saving category');
    }
  };

  const openModal = useCallback((category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description || '' });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    }
    setShowModal(true);
  }, []);

  // Decouple typing from filtering so the input stays smooth on long lists.
  const deferredSearch = useDeferredValue(searchTerm);

  const filteredCategories = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.description?.toLowerCase().includes(q)
    );
  }, [categories, deferredSearch]);

  // Single pass instead of one per stat — re-runs only when categories actually change.
  const totalProducts = useMemo(
    () => categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0),
    [categories]
  );

  // Color palette for category cards
  const colors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-green-500 to-green-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmText={confirmModal.confirmText} loading={actionLoading} />

      {/* Hero Section */}
      <section className="relative py-12 overflow-hidden" style={{ backgroundImage: 'url(/assets/images/pharmacy-bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-900/80 to-slate-900"></div>
        <div className="absolute inset-0 pattern-pharmacy opacity-10"></div>
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FiGrid className="text-blue-300" /> Manage Categories
              </h1>
              <p className="text-white/70">Organize your products into categories</p>
            </div>
            <button onClick={() => openModal()} className="px-6 py-3 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-300 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg w-fit">
              <FiPlus /> Add Category
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-white/70 text-sm">Total Categories</p>
              <p className="text-3xl font-bold">{categories.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-white/70 text-sm">Total Products</p>
              <p className="text-3xl font-bold">{totalProducts}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white col-span-2 md:col-span-1">
              <p className="text-white/70 text-sm">Avg Products/Category</p>
              <p className="text-3xl font-bold">{categories.length ? (totalProducts / categories.length).toFixed(1) : 0}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-4 mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-gray-500 dark:text-slate-400 text-sm">{filteredCategories.length} categories</span>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <CardGridSkeleton count={8} withImage={false} />
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-12 text-center">
            <FiGrid className="mx-auto mb-4 text-gray-300 dark:text-slate-600" size={64} />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-slate-300 mb-2">No Categories Found</h3>
            <p className="text-gray-400 dark:text-slate-500 mb-6">Get started by creating your first category</p>
            <button onClick={() => openModal()} className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg">
              <FiPlus className="inline mr-2" /> Add Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                colorClass={colors[index % colors.length]}
                animationDelay={index * 0.05}
                onEdit={openModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingCategory(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Pain Relief, Vitamins..."
                  className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">Description</label>
                <textarea
                  placeholder="Brief description of this category..."
                  className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Preview */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                    <FiTag size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-slate-100">{formData.name || 'Category Name'}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{formData.description || 'Description'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setEditingCategory(null); setFormData({ name: '', description: '' }); }} 
                  className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  {editingCategory ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Card extracted + memoized so typing in the search bar (which only changes
// `filteredCategories`) doesn't force every visible card to re-render. With
// `React.memo`, a card only re-renders when its own `category` reference or
// the bound callback changes.
const CategoryCard = React.memo(function CategoryCard({
  category,
  colorClass,
  animationDelay,
  onEdit,
  onDelete,
}) {
  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all animate-fade-in group"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <div className={`bg-gradient-to-r ${colorClass} p-6 text-white relative`}>
        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={() => onEdit(category)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm" title="Edit">
            <FiEdit size={16} />
          </button>
          <button onClick={() => onDelete(category)} className="p-2 bg-white/20 hover:bg-red-500 rounded-lg backdrop-blur-sm" title="Delete">
            <FiTrash2 size={16} />
          </button>
        </div>
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
          <FiTag size={28} />
        </div>
        <h3 className="font-bold text-xl">{category.name}</h3>
      </div>
      <div className="p-5">
        <p className="text-gray-600 dark:text-slate-300 text-sm mb-4 line-clamp-2 h-10">
          {category.description || 'No description provided'}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
            <FiPackage size={16} />
            <span className="text-sm">{category.product_count || 0} products</span>
          </div>
          <Link
            to={`/admin/products?categoryId=${category.id}`}
            className="text-blue-600 dark:text-blue-300 hover:text-blue-800 text-sm font-semibold"
            title="View products in this category"
          >
            View Products
          </Link>
        </div>
      </div>
    </div>
  );
});

export default ManageCategories;