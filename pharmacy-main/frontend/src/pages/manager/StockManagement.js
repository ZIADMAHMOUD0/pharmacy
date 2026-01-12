import React, { useState, useEffect } from 'react';
import { productAPI, stockRequestAPI, batchAPI } from '../../services/api';
import { FiAlertTriangle, FiPlus, FiPackage, FiClipboard, FiTrash2, FiX, FiCalendar, FiEye } from 'react-icons/fi';
import ConfirmModal from '../../components/ConfirmModal';
import ToastContainer from '../../components/ToastContainer';
import { useToast } from '../../hooks/useToast';

const StockManagement = () => {
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showMyRequestsModal, setShowMyRequestsModal] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductBatches, setSelectedProductBatches] = useState([]);
  const [requestForm, setRequestForm] = useState({ quantity: '', reason: '', batch_number: '', expiry_date: '' });

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  useEffect(() => { fetchProducts(); fetchLowStock(); fetchMyRequests(); }, []);

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

  const fetchLowStock = async () => {
    try {
      const response = await productAPI.getLowStock();
      setLowStockProducts(response.data);
    } catch (error) {
      console.error('Error fetching low stock:', error);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await stockRequestAPI.getAll();
      setMyRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchProductBatches = async (productId) => {
    try {
      const response = await batchAPI.getByProduct(productId);
      setSelectedProductBatches(response.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setSelectedProductBatches([]);
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setActionLoading(false);
  };

  const handleRequestStock = (product) => {
    setSelectedProduct(product);
    setRequestForm({ quantity: '', reason: '', batch_number: '', expiry_date: '' });
    setShowRequestModal(true);
  };

  const handleViewBatches = async (product) => {
    setSelectedProduct(product);
    await fetchProductBatches(product.id);
    setShowBatchModal(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      await stockRequestAPI.create({
        product: selectedProduct.id, quantity: parseInt(requestForm.quantity),
        reason: requestForm.reason, batch_number: requestForm.batch_number, expiry_date: requestForm.expiry_date || null
      });
      toast.success('Stock request submitted!');
      setShowRequestModal(false);
      setSelectedProduct(null);
      fetchMyRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error submitting request');
    }
  };

  const handleDeleteRequest = (request) => {
    setConfirmModal({
      isOpen: true, title: 'Delete Stock Request',
      message: `Delete request for "${request.product_name}" (${request.quantity} units)? This cannot be undone.`,
      type: 'danger', confirmText: 'Delete',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await stockRequestAPI.delete(request.id);
          toast.success('Request deleted!');
          fetchMyRequests();
        } catch (error) {
          toast.error('Error deleting request');
        } finally {
          closeConfirmModal();
        }
      },
    });
  };

  const isExpiringSoon = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const getStatusColor = (status) => {
    const colors = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const pendingRequestsCount = myRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={closeConfirmModal} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmText={confirmModal.confirmText} loading={actionLoading} />

      {/* Hero */}
      <section className="relative py-12 overflow-hidden" style={{ backgroundImage: 'url(/assets/images/pharmacy-bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/80"></div>
        <div className="relative z-10 container mx-auto px-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">📊 Stock Management</h1>
            <p className="text-white/70">{products.length} products • {lowStockProducts.length} low stock</p>
          </div>
          <button onClick={() => setShowMyRequestsModal(true)} className="relative px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 flex items-center gap-2 shadow-lg">
            <FiClipboard /> My Requests
            {pendingRequestsCount > 0 && <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{pendingRequestsCount}</span>}
          </button>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <FiAlertTriangle className="text-red-500" size={24} />
            <div><p className="font-bold text-red-800">Low Stock Alert</p><p className="text-red-700 text-sm">{lowStockProducts.length} product(s) need restocking</p></div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Product</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Category</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Stock</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Batches</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.id} className={`border-t hover:bg-gray-50 animate-fade-in ${product.is_low_stock ? 'bg-red-50' : ''}`} style={{ animationDelay: `${index * 0.03}s` }}>
                    <td className="px-6 py-4 font-medium text-gray-800">{product.name}</td>
                    <td className="px-6 py-4"><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{product.category_name || 'N/A'}</span></td>
                    <td className="px-6 py-4"><span className={`font-bold text-xl ${product.is_low_stock ? 'text-red-600' : 'text-green-600'}`}>{product.total_stock || 0}</span></td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleViewBatches(product)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
                        <FiEye size={16} /> View Batches
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {product.is_low_stock ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold"><FiAlertTriangle size={14} /> Low Stock</span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">In Stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleRequestStock(product)} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg flex items-center gap-1 text-sm">
                        <FiPlus size={16} /> Request
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Batches Modal */}
      {showBatchModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedProduct.name}</h2>
                <p className="text-gray-500">Batch Details</p>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX size={24} /></button>
            </div>

            {/* Product Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Stock</p>
                <p className="text-2xl font-bold text-blue-600">{selectedProduct.total_stock || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Threshold</p>
                <p className="text-xl font-semibold text-gray-800">{selectedProduct.low_stock_threshold}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-semibold text-gray-800">{selectedProduct.category_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="font-semibold text-gray-800">${selectedProduct.price}</p>
              </div>
            </div>

            {/* Batches List */}
            {selectedProductBatches.length === 0 ? (
              <div className="text-center py-12">
                <FiPackage className="mx-auto mb-4 text-gray-300" size={48} />
                <p className="text-gray-500 text-lg">No batches found for this product</p>
                <p className="text-sm text-gray-400 mt-1">Request stock to create new batches</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Available Batches ({selectedProductBatches.length})</h3>
                {selectedProductBatches.map((batch, index) => (
                  <div 
                    key={batch.id} 
                    className={`border rounded-xl p-4 transition-all ${
                      isExpired(batch.expiry_date) ? 'bg-red-50 border-red-300' :
                      isExpiringSoon(batch.expiry_date) ? 'bg-yellow-50 border-yellow-300' :
                      'bg-white border-gray-200 hover:shadow-md'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <FiPackage className="text-blue-600" size={20} />
                        <div>
                          <h4 className="font-bold text-gray-800">Batch: {batch.batch_number}</h4>
                          <p className="text-sm text-gray-500">Received: {new Date(batch.received_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-blue-600">{batch.quantity}</p>
                        <p className="text-xs text-gray-500">units</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Expiry Date</p>
                          <p className={`font-semibold ${
                            isExpired(batch.expiry_date) ? 'text-red-600' :
                            isExpiringSoon(batch.expiry_date) ? 'text-yellow-600' :
                            'text-gray-800'
                          }`}>
                            {new Date(batch.expiry_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {isExpired(batch.expiry_date) ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                          <FiAlertTriangle size={14} /> EXPIRED
                        </span>
                      ) : isExpiringSoon(batch.expiry_date) ? (
                        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
                          <FiAlertTriangle size={14} /> Expiring Soon
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Valid</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setShowBatchModal(false); handleRequestStock(selectedProduct); }}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg flex items-center justify-center gap-2"
              >
                <FiPlus /> Request More Stock
              </button>
              <button onClick={() => setShowBatchModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Stock Modal */}
      {showRequestModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Request Stock</h2>
              <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX size={20} /></button>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl mb-4">
              <p className="font-semibold text-blue-800">{selectedProduct.name}</p>
              <p className="text-sm text-blue-600">Current Stock: {selectedProduct.total_stock || 0}</p>
            </div>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Quantity *</label>
                <input type="number" min="1" className="w-full p-3 border rounded-xl" value={requestForm.quantity} onChange={(e) => setRequestForm({...requestForm, quantity: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Batch Number (Optional)</label>
                <input type="text" placeholder="e.g., BATCH-2024-001" className="w-full p-3 border rounded-xl" value={requestForm.batch_number} onChange={(e) => setRequestForm({...requestForm, batch_number: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Expected Expiry Date (Optional)</label>
                <input type="date" className="w-full p-3 border rounded-xl" value={requestForm.expiry_date} onChange={(e) => setRequestForm({...requestForm, expiry_date: e.target.value})} />
                <p className="text-xs text-gray-500 mt-1">Defaults to 1 year from approval if not provided</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Reason *</label>
                <textarea className="w-full p-3 border rounded-xl resize-none" rows="3" placeholder="Explain why stock is needed..." value={requestForm.reason} onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})} required />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* My Requests Modal */}
      {showMyRequestsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">My Stock Requests</h2>
              <button onClick={() => setShowMyRequestsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX size={20} /></button>
            </div>
            {myRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500"><FiClipboard className="mx-auto mb-4 text-gray-300" size={48} /><p>No requests yet</p></div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((request, i) => (
                  <div key={request.id} className="bg-gray-50 p-4 rounded-xl" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{request.product_name}</h3>
                        <p className="text-sm text-gray-600">Qty: {request.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>{request.status}</span>
                        {request.status === 'pending' && (
                          <button onClick={() => handleDeleteRequest(request)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><FiTrash2 size={16} /></button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{request.reason}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(request.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;