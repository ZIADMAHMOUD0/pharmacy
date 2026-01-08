import React, { useState, useEffect, useRef } from 'react';
import { productAPI, categoryAPI } from '../../services/api';
import { 
  FiPackage, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, 
  FiAlertTriangle, FiImage, FiUpload 
} from 'react-icons/fi';
import ConfirmModal from '../../components/ConfirmModal';
import ToastContainer from '../../components/ToastContainer';
import { useToast } from '../../hooks/useToast';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
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
    requires_prescription: false,
    low_stock_threshold: 10
  });

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  useEffect(() => { 
    fetchProducts(); 
    fetchCategories(); 
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

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
      fetchProducts();
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
          fetchProducts();
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

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || p.category === parseInt(filterCategory);
    return matchesSearch && matchesCategory;
  });

  // Stats
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.is_low_stock).length;
  const outOfStock = products.filter(p => p.total_stock === 0).length;

  return (
    <div className="min-h-screen bg-gray-50">
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
      <section className="relative py-12 overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FiPackage size={36} /> Manage Products
              </h1>
              <p className="text-white/70">{products.length} products in catalog</p>
            </div>
            <button 
              onClick={() => { resetForm(); setShowModal(true); }} 
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg"
            >
              <FiPlus /> Add Product
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white text-center">
              <p className="text-3xl font-bold">{totalProducts}</p>
              <p className="text-white/70 text-sm">Total Products</p>
            </div>
            <div className="bg-yellow-500/20 backdrop-blur-sm rounded-xl p-4 text-white text-center">
              <p className="text-3xl font-bold">{lowStockProducts}</p>
              <p className="text-yellow-200 text-sm">Low Stock</p>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 text-white text-center">
              <p className="text-3xl font-bold">{outOfStock}</p>
              <p className="text-red-200 text-sm">Out of Stock</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {categories.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <FiAlertTriangle className="text-amber-600" size={24} />
            <p className="text-amber-800">Please create categories first before adding products.</p>
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 border rounded-xl"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <FiPackage className="mx-auto mb-4 text-gray-300" size={64} />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all group">
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <FiImage size={48} className="mx-auto mb-2" />
                      <p className="text-sm">No Image</p>
                    </div>
                  )}
                  {product.requires_prescription && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      Rx Required
                    </span>
                  )}
                  {product.is_low_stock && product.total_stock > 0 && (
                    <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                      Low Stock
                    </span>
                  )}
                  {product.total_stock === 0 && (
                    <span className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-1 truncate">{product.name}</h3>
                  {product.category_name && (
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full mb-2">
                      {product.category_name}
                    </span>
                  )}
                  <p className="text-gray-500 text-sm mb-2">{product.manufacturer}</p>
                  
                  <div className="flex justify-between items-center mt-3">
                    <div>
                      <p className="text-2xl font-bold text-green-600">${product.price}</p>
                      <p className={`text-sm ${product.total_stock === 0 ? 'text-red-500' : product.is_low_stock ? 'text-yellow-600' : 'text-gray-500'}`}>
                        Stock: {product.total_stock || 0}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold mb-2">Product Image (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-h-40 rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer py-8"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FiUpload className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-gray-500">Click to upload image</p>
                      <p className="text-gray-400 text-sm">PNG, JPG up to 5MB</p>
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
                <label className="block text-sm font-semibold mb-1">Name *</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-xl" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-1">Category *</label>
                <select 
                  className="w-full p-3 border rounded-xl" 
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
                  <label className="block text-sm font-semibold mb-1">Price *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full p-3 border rounded-xl" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Low Stock Threshold</label>
                  <input 
                    type="number" 
                    className="w-full p-3 border rounded-xl" 
                    value={formData.low_stock_threshold} 
                    onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})} 
                  />
                </div>
              </div>

              {/* Manufacturer */}
              <div>
                <label className="block text-sm font-semibold mb-1">Manufacturer</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-xl" 
                  value={formData.manufacturer} 
                  onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} 
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea 
                  className="w-full p-3 border rounded-xl resize-none" 
                  rows="3" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              {/* Requires Prescription */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.requires_prescription} 
                  onChange={(e) => setFormData({...formData, requires_prescription: e.target.checked})} 
                  className="w-5 h-5 rounded" 
                />
                <span className="font-medium">Requires Prescription</span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="flex-1 py-3 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700"
                >
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>

            {!editingProduct && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                💡 After creating the product, go to <strong>Manage Batches</strong> to add stock.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;