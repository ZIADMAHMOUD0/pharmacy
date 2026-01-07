import React, { useState, useEffect } from 'react';
import { batchAPI, productAPI } from '../../services/api';
import { FiEdit, FiTrash2, FiPlus, FiAlertTriangle, FiPackage, FiSearch, FiX, FiCalendar } from 'react-icons/fi';
import ConfirmModal from '../../components/ConfirmModal';
import ToastContainer from '../../components/ToastContainer';
import { useToast } from '../../hooks/useToast';

const ManageBatches = () => {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    product: '', batch_number: '', quantity: '', expiry_date: '', cost_price: ''
  });

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  useEffect(() => { fetchBatches(); fetchProducts(); }, []);
  useEffect(() => { fetchBatches(); }, [filter]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      let response;
      if (filter === 'expired') {
        response = await batchAPI.getExpired();
      } else if (filter === 'expiring') {
        response = await batchAPI.getExpiringSoon(30);
      } else {
        response = await batchAPI.getAll();
      }
      setBatches(response.data);
    } catch (error) {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleDelete = (batch) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Batch',
      message: `Are you sure you want to delete batch "${batch.batch_number}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await batchAPI.delete(batch.id);
          toast.success('Batch deleted successfully!');
          fetchBatches();
        } catch (error) {
          toast.error('Error deleting batch');
        } finally {
          setActionLoading(false);
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBatch) {
        await batchAPI.update(editingBatch.id, formData);
        toast.success('Batch updated successfully!');
      } else {
        await batchAPI.create(formData);
        toast.success('Batch created successfully!');
      }
      setShowModal(false);
      setEditingBatch(null);
      setFormData({ product: '', batch_number: '', quantity: '', expiry_date: '', cost_price: '' });
      fetchBatches();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error saving batch');
    }
  };

  const openModal = (batch = null) => {
    if (batch) {
      setEditingBatch(batch);
      setFormData({
        product: batch.product,
        batch_number: batch.batch_number,
        quantity: batch.quantity,
        expiry_date: batch.expiry_date,
        cost_price: batch.cost_price || ''
      });
    } else {
      setFormData({ product: '', batch_number: '', quantity: '', expiry_date: '', cost_price: '' });
    }
    setShowModal(true);
  };

  const isExpiringSoon = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const filteredBatches = batches.filter(batch =>
    batch.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.batch_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: batches.length,
    expired: batches.filter(b => b.is_expired).length,
    expiring: batches.filter(b => !b.is_expired && isExpiringSoon(b.expiry_date)).length,
    valid: batches.filter(b => !b.is_expired && !isExpiringSoon(b.expiry_date)).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmText={confirmModal.confirmText} loading={actionLoading} />

      {/* Hero Section */}
      <section className="relative py-12 overflow-hidden" style={{ backgroundImage: 'url(/assets/images/pharmacy-bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/80"></div>
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FiPackage className="text-blue-300" /> Manage Batches
              </h1>
              <p className="text-white/70">Track inventory batches and expiry dates</p>
            </div>
            <button onClick={() => openModal()} className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg w-fit">
              <FiPlus /> Add New Batch
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-white/70 text-sm">Total Batches</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-green-200 text-sm">Valid</p>
              <p className="text-3xl font-bold text-green-300">{stats.valid}</p>
            </div>
            <div className="bg-yellow-500/20 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-yellow-200 text-sm">Expiring Soon</p>
              <p className="text-3xl font-bold text-yellow-300">{stats.expiring}</p>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-red-200 text-sm">Expired</p>
              <p className="text-3xl font-bold text-red-300">{stats.expired}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All Batches', color: 'blue' },
              { key: 'expiring', label: 'Expiring Soon', color: 'yellow' },
              { key: 'expired', label: 'Expired', color: 'red' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === f.key
                    ? f.color === 'blue' ? 'bg-blue-600 text-white' : f.color === 'yellow' ? 'bg-yellow-500 text-white' : 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Batches Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Product</th>
                  <th className="px-6 py-4 text-left font-semibold">Batch Number</th>
                  <th className="px-6 py-4 text-left font-semibold">Quantity</th>
                  <th className="px-6 py-4 text-left font-semibold">Expiry Date</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <FiPackage className="mx-auto mb-4 text-gray-300" size={48} />
                      <p>No batches found</p>
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch, index) => (
                    <tr key={batch.id} className={`border-t hover:bg-gray-50 animate-fade-in ${batch.is_expired ? 'bg-red-50' : isExpiringSoon(batch.expiry_date) ? 'bg-yellow-50' : ''}`} style={{ animationDelay: `${index * 0.03}s` }}>
                      <td className="px-6 py-4 font-medium text-gray-800">{batch.product_name}</td>
                      <td className="px-6 py-4 font-mono text-sm bg-gray-100 rounded">{batch.batch_number}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-lg">{batch.quantity}</span>
                        <span className="text-gray-500 text-sm ml-1">units</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="text-gray-400" />
                          {new Date(batch.expiry_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {batch.is_expired ? (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                            <FiAlertTriangle /> Expired
                          </span>
                        ) : isExpiringSoon(batch.expiry_date) ? (
                          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
                            <FiAlertTriangle /> Expiring Soon
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Valid</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openModal(batch)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" title="Edit">
                            <FiEdit size={18} />
                          </button>
                          <button onClick={() => handleDelete(batch)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all" title="Delete">
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{editingBatch ? 'Edit Batch' : 'Add New Batch'}</h2>
              <button onClick={() => { setShowModal(false); setEditingBatch(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Product</label>
                <select
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  required
                  disabled={editingBatch}
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Batch Number</label>
                <input type="text" placeholder="e.g., BATCH-2024-001" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" value={formData.batch_number} onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                <input type="number" min="0" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
                <input type="date" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cost Price (Optional)</label>
                <input type="number" step="0.01" placeholder="0.00" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingBatch(null); }} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg">
                  {editingBatch ? 'Update' : 'Create'} Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBatches;