import React, { useState, useEffect, useMemo } from 'react';
import { stockRequestAPI, batchAPI } from '../../services/api';
import { FiAlertTriangle, FiPlus, FiPackage, FiClipboard, FiTrash2, FiX, FiCalendar, FiEye } from 'react-icons/fi';
import ConfirmModal from '../../components/ConfirmModal';
import ToastContainer from '../../components/ToastContainer';
import { useToast } from '../../hooks/useToast';
import { useFocusOnArrival } from '../../hooks/useFocusOnArrival';
import { useProductsCache } from '../../contexts/ProductsCacheContext';
import TableSkeleton from '../../components/skeletons/TableSkeleton';

const StockManagement = () => {
  // Shared SWR cache for products. Replaces the previous per-mount fetch and
  // the separate /products/low-stock call (low-stock can be derived from the
  // is_low_stock flag the API already returns on each product row).
  const {
    items: products,
    loading: productsLoading,
    refetch: refetchProducts,
  } = useProductsCache();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showMyRequestsModal, setShowMyRequestsModal] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductBatches, setSelectedProductBatches] = useState([]);
  const [requestBatches, setRequestBatches] = useState([]); // Batches for request modal
  const [stockMode, setStockMode] = useState('new'); // 'new' or 'existing'
  const [requestForm, setRequestForm] = useState({ quantity: '', reason: '', batch_number: '', expiry_date: '', existing_batch_id: '' });

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  // Keep the same loading semantics other code expects: skeleton only when
  // there's nothing to show yet.
  const loading = productsLoading && products.length === 0;

  // Mutually-exclusive low / out partitions derived in a single pass. The
  // backend's `is_low_stock` is True whenever `total_stock <= threshold`
  // (including zero), so we must explicitly split the zero-stock products
  // out of the low-stock bucket to avoid double counting them.
  const { lowStockProducts, outOfStockProducts } = useMemo(() => {
    const low = [];
    const out = [];
    for (const p of products) {
      if (p.total_stock === 0) out.push(p);
      else if (p.is_low_stock) low.push(p);
    }
    return { lowStockProducts: low, outOfStockProducts: out };
  }, [products]);

  // 'all' | 'low' | 'out' — drives the filter chip row + table body.
  const [stockFilter, setStockFilter] = useState('all');

  // Resolve the rows the table actually renders. Memoised so it only
  // recomputes when the filter or the source arrays change.
  const filteredProducts = useMemo(() => {
    if (stockFilter === 'low') return lowStockProducts;
    if (stockFilter === 'out') return outOfStockProducts;
    return products;
  }, [stockFilter, products, lowStockProducts, outOfStockProducts]);

  // Reset the filter whenever the products list reference changes (cache
  // refetch after a write). Without this, a refresh that empties the bucket
  // the user was filtering on would leave the table stranded with no rows.
  useEffect(() => {
    setStockFilter('all');
  }, [products]);

  // Two focus channels for the manager: ?focus=<product-id> for the inventory
  // table (data-focus-id), and ?focusBatch=<batch-id> for the batch modal —
  // separate data attribute so the two don't collide. The batch focus also
  // auto-opens the modal so the highlighted row is reachable.
  useFocusOnArrival('focus', !loading && products.length > 0);

  // When ?focusBatch=<id> is in the URL, auto-open the batch modal for the
  // product that owns the batch so the user actually sees the highlighted row.
  // We do this before the highlight hook fires so the modal exists.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const focusBatch = params.get('focusBatch');
    if (!focusBatch || products.length === 0 || showBatchModal) return;
    // Find the product by walking each product's batches once.
    (async () => {
      for (const product of products) {
        try {
          const res = await batchAPI.getByProduct(product.id);
          if ((res.data || []).some((b) => String(b.id) === String(focusBatch))) {
            setSelectedProduct(product);
            setSelectedProductBatches(res.data);
            setShowBatchModal(true);
            return;
          }
        } catch {
          // skip silently — surface focus is best-effort
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  // Once the modal is open and rows are rendered, the focus hook can target
  // them via data-focus-batch-id.
  useFocusOnArrival('focusBatch', showBatchModal && selectedProductBatches.length > 0, {
    attr: 'data-focus-batch-id',
  });

  // Single mount-time effect: prime the products cache (no network if it's
  // already warm thanks to the idle prefetch on app boot) and load the
  // manager's own request list. The previous version made three independent
  // round-trips on every visit.
  useEffect(() => {
    refetchProducts().catch(() => toast.error('Failed to load products'));
    fetchMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleRequestStock = async (product) => {
    setSelectedProduct(product);
    setRequestForm({ quantity: '', reason: '', batch_number: '', expiry_date: '', existing_batch_id: '' });
    setStockMode('new');
    // Fetch batches for this product
    try {
      const response = await batchAPI.getByProduct(product.id);
      const validBatches = response.data.filter(b => new Date(b.expiry_date) > new Date()); // Only non-expired
      setRequestBatches(validBatches);
      // Default to existing if batches exist
      if (validBatches.length > 0) {
        setStockMode('existing');
      }
    } catch (error) {
      setRequestBatches([]);
    }
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
      const requestData = {
        product: selectedProduct.id,
        quantity: parseInt(requestForm.quantity),
        reason: requestForm.reason,
      };
      
      if (stockMode === 'existing' && requestForm.existing_batch_id) {
        // Add to existing batch
        const selectedBatch = requestBatches.find(b => b.id === parseInt(requestForm.existing_batch_id));
        requestData.batch_number = selectedBatch?.batch_number || '';
        requestData.expiry_date = selectedBatch?.expiry_date || null;
        requestData.existing_batch_id = requestForm.existing_batch_id;
      } else {
        // Create new batch
        requestData.batch_number = requestForm.batch_number;
        requestData.expiry_date = requestForm.expiry_date || null;
      }
      
      await stockRequestAPI.create(requestData);
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
    const colors = { pending: 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300', approved: 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300', rejected: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300' };
    return colors[status] || 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200';
  };

  const pendingRequestsCount = myRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={closeConfirmModal} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} confirmText={confirmModal.confirmText} loading={actionLoading} />

      {/* Hero */}
      <section className="relative py-12 overflow-hidden" style={{ backgroundImage: 'url(/assets/images/pharmacy-bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-violet-900/80 to-slate-900"></div>
        <div className="absolute inset-0 pattern-pharmacy opacity-10"></div>
        <div className="relative z-10 container mx-auto px-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">📊 Stock Management</h1>
            <p className="text-white/70">
              {products.length} products
              {' · '}
              {lowStockProducts.length} low stock
              {' · '}
              {outOfStockProducts.length} out of stock
            </p>
          </div>
          <button onClick={() => setShowMyRequestsModal(true)} className="relative px-6 py-3 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-300 rounded-xl font-semibold hover:bg-blue-50 flex items-center gap-2 shadow-lg">
            <FiClipboard /> My Requests
            {pendingRequestsCount > 0 && <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{pendingRequestsCount}</span>}
          </button>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {/* Low Stock Alert — products that still have stock but are below threshold */}
        {lowStockProducts.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <FiAlertTriangle className="text-amber-500 dark:text-amber-400" size={24} />
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-200">Low Stock Alert</p>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                {lowStockProducts.length} product(s) need restocking soon
              </p>
            </div>
          </div>
        )}

        {/* Out of Stock Alert — products with total_stock === 0. Separate
            banner so the manager can act on the more urgent case first. */}
        {outOfStockProducts.length > 0 && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <FiAlertTriangle className="text-rose-500 dark:text-rose-400" size={24} />
            <div>
              <p className="font-bold text-rose-800 dark:text-rose-200">Out of Stock</p>
              <p className="text-rose-700 dark:text-rose-300 text-sm">
                {outOfStockProducts.length} product(s) have no remaining stock
              </p>
            </div>
          </div>
        )}

        {/* Filter chips — All / Low Stock / Out of Stock with live counts.
            Clicking the active chip resets to All. */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm text-slate-500 dark:text-slate-400 mr-1">Filter:</span>
          {[
            { key: 'all', label: 'All', count: products.length, activeClass: 'bg-teal-500 text-white border-teal-500 dark:bg-teal-500 dark:border-teal-500', idleClass: 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800' },
            { key: 'low', label: 'Low Stock', count: lowStockProducts.length, activeClass: 'bg-amber-500 text-white border-amber-500', idleClass: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/25' },
            { key: 'out', label: 'Out of Stock', count: outOfStockProducts.length, activeClass: 'bg-rose-500 text-white border-rose-500', idleClass: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/25' },
          ].map((chip) => {
            const isActive = stockFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStockFilter(isActive && chip.key !== 'all' ? 'all' : chip.key)}
                aria-pressed={isActive}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  isActive ? chip.activeClass : chip.idleClass
                }`}
              >
                {chip.label}
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-white/25' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}>
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <TableSkeleton columns={6} rows={8} />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600 dark:text-slate-300">Product</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600 dark:text-slate-300">Category</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600 dark:text-slate-300">Stock</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600 dark:text-slate-300">Batches</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600 dark:text-slate-300">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No products match this filter.
                    </td>
                  </tr>
                )}
                {filteredProducts.map((product, index) => {
                  const isOutOfStock = product.total_stock === 0;
                  // is_low_stock is True for zero-stock rows too — exclude
                  // those so the row tint and badge match the partitions.
                  const isLowStock = product.is_low_stock && !isOutOfStock;
                  const rowTint = isOutOfStock
                    ? 'bg-rose-50 dark:bg-rose-500/10'
                    : isLowStock
                    ? 'bg-amber-50 dark:bg-amber-500/10'
                    : '';
                  const stockColor = isOutOfStock
                    ? 'text-rose-600 dark:text-rose-300'
                    : isLowStock
                    ? 'text-amber-600 dark:text-amber-300'
                    : 'text-green-600 dark:text-green-300';
                  return (
                  <tr key={product.id} data-focus-id={product.id} className={`border-t border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 animate-fade-in ${rowTint}`} style={{ animationDelay: `${index * 0.03}s` }}>
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-slate-100">{product.name}</td>
                    <td className="px-6 py-4"><span className="bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">{product.category_name || 'N/A'}</span></td>
                    <td className="px-6 py-4"><span className={`font-bold text-xl ${stockColor}`}>{product.total_stock || 0}</span></td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleViewBatches(product)} className="flex items-center gap-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 font-medium">
                        <FiEye size={16} /> View Batches
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 px-3 py-1 rounded-full text-sm font-semibold"><FiAlertTriangle size={14} /> Out of Stock</span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full text-sm font-semibold"><FiAlertTriangle size={14} /> Low Stock</span>
                      ) : (
                        <span className="bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold">In Stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleRequestStock(product)} className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg flex items-center gap-1 text-sm">
                        <FiPlus size={16} /> Request
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Batches Modal */}
      {showBatchModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">{selectedProduct.name}</h2>
                <p className="text-gray-500 dark:text-slate-400">Batch Details</p>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX size={24} /></button>
            </div>

            {/* Product Summary */}
            <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 border border-blue-200 dark:border-blue-500/30">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-300">Total Stock</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{selectedProduct.total_stock || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-300">Threshold</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-slate-100">{selectedProduct.low_stock_threshold}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-300">Category</p>
                <p className="font-semibold text-gray-800 dark:text-slate-100">{selectedProduct.category_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-300">Price</p>
                <p className="font-semibold text-gray-800 dark:text-slate-100">${selectedProduct.price}</p>
              </div>
            </div>

            {/* Batches List */}
            {selectedProductBatches.length === 0 ? (
              <div className="text-center py-12">
                <FiPackage className="mx-auto mb-4 text-gray-300 dark:text-slate-600" size={48} />
                <p className="text-gray-500 dark:text-slate-400 text-lg">No batches found for this product</p>
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Request stock to create new batches</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 dark:text-slate-100">Available Batches ({selectedProductBatches.length})</h3>
                {selectedProductBatches.map((batch, index) => (
                  <div
                    key={batch.id}
                    data-focus-batch-id={batch.id}
                    className={`border rounded-xl p-4 transition-all ${
                      isExpired(batch.expiry_date) ? 'bg-red-50 dark:bg-red-500/10 border-red-300' :
                      isExpiringSoon(batch.expiry_date) ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-300' :
                      'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:shadow-md'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <FiPackage className="text-blue-600 dark:text-blue-300" size={20} />
                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-slate-100">Batch: {batch.batch_number}</h4>
                          <p className="text-sm text-gray-500 dark:text-slate-400">Received: {new Date(batch.received_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">{batch.quantity}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">units</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-gray-400 dark:text-slate-500" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-slate-400">Expiry Date</p>
                          <p className={`font-semibold ${
                            isExpired(batch.expiry_date) ? 'text-red-600 dark:text-red-300' :
                            isExpiringSoon(batch.expiry_date) ? 'text-yellow-600 dark:text-yellow-300' :
                            'text-gray-800 dark:text-slate-100'
                          }`}>
                            {new Date(batch.expiry_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {isExpired(batch.expiry_date) ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-sm font-semibold">
                          <FiAlertTriangle size={14} /> EXPIRED
                        </span>
                      ) : isExpiringSoon(batch.expiry_date) ? (
                        <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full text-sm font-semibold">
                          <FiAlertTriangle size={14} /> Expiring Soon
                        </span>
                      ) : (
                        <span className="bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold">Valid</span>
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
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg flex items-center justify-center gap-2"
              >
                <FiPlus /> Request More Stock
              </button>
              <button onClick={() => setShowBatchModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Stock Modal */}
      {showRequestModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Request Stock</h2>
              <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX size={20} /></button>
            </div>
            <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl mb-4">
              <p className="font-semibold text-blue-800">{selectedProduct.name}</p>
              <p className="text-sm text-blue-600 dark:text-blue-300">Current Stock: {selectedProduct.total_stock || 0}</p>
            </div>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold mb-1">Quantity *</label>
                <input type="number" min="1" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" value={requestForm.quantity} onChange={(e) => setRequestForm({...requestForm, quantity: e.target.value})} required />
              </div>

              {/* Batch Mode Toggle */}
              <div>
                <label className="block text-sm font-semibold mb-2">Add Stock To</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStockMode('existing')}
                    disabled={requestBatches.length === 0}
                    className={`p-3 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                      stockMode === 'existing' 
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300' 
                        : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:border-slate-600'
                    } ${requestBatches.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FiPackage size={18} />
                    Existing Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockMode('new')}
                    className={`p-3 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                      stockMode === 'new' 
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300' 
                        : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:border-slate-600'
                    }`}
                  >
                    <FiPlus size={18} />
                    New Batch
                  </button>
                </div>
              </div>

              {/* Existing Batch Selection */}
              {stockMode === 'existing' && requestBatches.length > 0 && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold mb-1">Select Batch *</label>
                  <select
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    value={requestForm.existing_batch_id}
                    onChange={(e) => setRequestForm({...requestForm, existing_batch_id: e.target.value})}
                    required
                  >
                    <option value="">Choose a batch...</option>
                    {requestBatches.map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batch_number} — {batch.quantity} units — Exp: {new Date(batch.expiry_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  {requestForm.existing_batch_id && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/30">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✓ Stock will be added to the selected batch
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* New Batch Fields */}
              {stockMode === 'new' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Batch Number (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g., BATCH-2024-001" 
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                      value={requestForm.batch_number} 
                      onChange={(e) => setRequestForm({...requestForm, batch_number: e.target.value})} 
                    />
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Auto-generated if left empty</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Expected Expiry Date (Optional)</label>
                    <input 
                      type="date" 
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                      value={requestForm.expiry_date} 
                      onChange={(e) => setRequestForm({...requestForm, expiry_date: e.target.value})} 
                    />
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Defaults to 1 year from approval if not provided</p>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold mb-1">Reason *</label>
                <textarea 
                  className="w-full p-3 border rounded-xl resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
                  rows="3" 
                  placeholder="Explain why stock is needed..." 
                  value={requestForm.reason} 
                  onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})} 
                  required 
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* My Requests Modal */}
      {showMyRequestsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">My Stock Requests</h2>
              <button onClick={() => setShowMyRequestsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX size={20} /></button>
            </div>
            {myRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-slate-400"><FiClipboard className="mx-auto mb-4 text-gray-300 dark:text-slate-600" size={48} /><p>No requests yet</p></div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((request, i) => (
                  <div key={request.id} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{request.product_name}</h3>
                        <p className="text-sm text-gray-600 dark:text-slate-300">Qty: {request.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>{request.status}</span>
                        {request.status === 'pending' && (
                          <button onClick={() => handleDeleteRequest(request)} className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:text-red-300 rounded-lg"><FiTrash2 size={16} /></button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{request.reason}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{new Date(request.created_at).toLocaleDateString()}</p>
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