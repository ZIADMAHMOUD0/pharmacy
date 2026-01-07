import React, { useState, useEffect } from 'react';
import { productAPI, categoryAPI } from '../../services/api';
import { FiPackage, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiAlertTriangle } from 'react-icons/fi';
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
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', manufacturer: '', requires_prescription: false, low_stock_threshold: 10, image: null
  });

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    });

    try {
      if (editingProduct) {
        await productAPI.update(editingProduct.id, data);
        toast.success('Product updated!');
      } else {
        await productAPI.create(data);
        toast.success('Product created!');
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name, description: product.description || '', price: product.price,
      category: product.category || '', manufacturer: product.manufacturer || '',
      requires_prescription: product.requires_prescription, low_stock_threshold: product.low_stock_threshold, image: null
    });
    setShowModal(true);
  };

  const handleDelete = (product) => {
    setConfirmModal({
      isOpen: true, title: 'Delete Product', message: `Delete "${product.name}"? This cannot be undone.`, type: 'danger', confirmText: 'Delete',
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
    setFormData({ name: '', description: '', price: '', category: '', manufacturer: '', requires_prescription: false, low_stock_threshold: 10, image: null });
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={closeConfirmModal} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmText={confirmModal.confirmText} loading={actionLoading} />

      {/* Hero */}
      <section className="relative py-12 overflow-hidden" style={{ backgroundImage: 'url(/assets/images/pharmacy-bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/80"></div>
        <div className="relative z-10 container mx-auto px-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3"><FiPackage size={36} /> Manage Products</h1>
            <p className="text-white/70">{products.length} products in catalog</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg">
            <FiPlus /> Add Product
          </button>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {categories.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <FiAlertTriangle className="text-amber-600" size={24} />
            <p className="text-amber-800">Please create categories first before adding products.</p>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search products..." className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Product</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Category</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Price</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Stock</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr key={product.id} className="border-t hover:bg-gray-50 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">💊</div>
                        <div>
                          <p className="font-semibold text-gray-800">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.manufacturer}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{product.category_name || 'Uncategorized'}</span></td>
                    <td className="px-6 py-4 font-bold text-gray-800">${product.price}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${product.total_stock <= product.low_stock_threshold ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {product.total_stock || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><FiEdit2 size={18} /></button>
                        <button onClick={() => handleDelete(product)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500"><FiPackage className="mx-auto mb-4 text-gray-300" size={48} /><p>No products found</p></div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Name *</label>
                <input type="text" className="w-full p-3 border rounded-xl" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Category *</label>
                <select className="w-full p-3 border rounded-xl" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Price *</label>
                  <input type="number" step="0.01" className="w-full p-3 border rounded-xl" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Low Stock Threshold</label>
                  <input type="number" className="w-full p-3 border rounded-xl" value={formData.low_stock_threshold} onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Manufacturer</label>
                <input type="text" className="w-full p-3 border rounded-xl" value={formData.manufacturer} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea className="w-full p-3 border rounded-xl resize-none" rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Image</label>
                <input type="file" accept="image/*" className="w-full p-3 border rounded-xl" onChange={(e) => setFormData({...formData, image: e.target.files[0]})} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.requires_prescription} onChange={(e) => setFormData({...formData, requires_prescription: e.target.checked})} className="w-5 h-5 rounded" />
                <span className="font-medium">Requires Prescription</span>
              </label>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold">{editingProduct ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;
