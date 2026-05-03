import React, { useState, useEffect } from 'react';
import { orderAPI, productAPI } from '../services/api';
import { FiTrash2, FiEdit2, FiPlus, FiX, FiPackage, FiClock, FiCheck, FiTruck, FiShoppingBag } from 'react-icons/fi';
import ConfirmModal from '../components/ConfirmModal';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
  });
  const [actionLoading, setActionLoading] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getAll();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
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

  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setActionLoading(false);
  };

  const handleCancelOrder = (orderId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? The stock will be restored.',
      type: 'warning',
      confirmText: 'Yes, Cancel Order',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await orderAPI.cancel(orderId);
          toast.success('Order cancelled successfully!');
          fetchOrders();
        } catch (error) {
          toast.error(error.response?.data?.error || 'Error cancelling order');
        } finally {
          closeConfirmModal();
        }
      },
    });
  };

  const handleDeleteOrder = (order) => {
    if (order.status === 'pending') {
      toast.warning('You cannot delete a pending order. Please cancel it instead.');
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete Order',
      message: 'Delete this order from your history? This cannot be undone.',
      type: 'danger',
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await orderAPI.delete(order.id);
          toast.success('Order deleted successfully!');
          fetchOrders();
        } catch (error) {
          toast.error(error.response?.data?.error || 'Error deleting order');
        } finally {
          closeConfirmModal();
        }
      },
    });
  };

  const handleRemoveItem = (orderId, itemId, itemName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Item',
      message: `Remove "${itemName}" from this order?`,
      type: 'warning',
      confirmText: 'Yes, Remove',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await orderAPI.removeItem(orderId, { item_id: itemId });
          toast.success('Item removed!');
          fetchOrders();
        } catch (error) {
          toast.error(error.response?.data?.error || 'Error removing item');
        } finally {
          closeConfirmModal();
        }
      },
    });
  };

  const handleUpdateQuantity = async (orderId, itemId, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;

    try {
      await orderAPI.updateItemQuantity(orderId, { item_id: itemId, quantity: newQty });
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error updating quantity');
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProduct || quantity < 1) {
      toast.warning('Please select a product and quantity');
      return;
    }

    try {
      await orderAPI.addItem(editingOrder.id, { product_id: selectedProduct, quantity: quantity });
      toast.success('Product added!');
      setShowAddProduct(false);
      setSelectedProduct('');
      setQuantity(1);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error adding product');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30', icon: <FiClock />, label: 'Pending', gradient: 'from-amber-500 to-orange-500' },
      approved: { color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', icon: <FiCheck />, label: 'Approved', gradient: 'from-emerald-500 to-teal-500' },
      rejected: { color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30', icon: <FiX />, label: 'Rejected', gradient: 'from-rose-500 to-red-500' },
      processing: { color: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30', icon: <FiPackage />, label: 'Processing', gradient: 'from-cyan-500 to-sky-500' },
      shipped: { color: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30', icon: <FiTruck />, label: 'Shipped', gradient: 'from-violet-500 to-purple-500' },
      delivered: { color: 'bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30', icon: <FiCheck />, label: 'Delivered', gradient: 'from-teal-500 to-cyan-500' },
      cancelled: { color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700', icon: <FiX />, label: 'Cancelled', gradient: 'from-slate-500 to-slate-600' },
    };
    return configs[status] || configs.pending;
  };

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

      {/* Hero Section */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600"></div>
        <div className="absolute inset-0 pattern-pharmacy opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <FiPackage className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold text-white">My Orders</h1>
              <p className="text-white/60">{orders.length} {orders.length === 1 ? 'order' : 'orders'} in history</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-300 font-medium">Loading orders...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-800">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FiPackage className="text-slate-400 dark:text-slate-500" size={40} />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100 mb-2">No orders yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Your order history will appear here</p>
            <a 
              href="/products" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-glow transition-all"
            >
              <FiShoppingBag /> Start Shopping
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <div 
                  key={order.id} 
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden hover:shadow-soft-xl transition-all duration-300 border border-slate-100 dark:border-slate-800 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Order Header */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${statusConfig.gradient} flex items-center justify-center text-white shadow-lg`}>
                          {statusConfig.icon}
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-xl text-slate-800 dark:text-slate-100">Order #{order.id}</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${statusConfig.color}`}>
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setEditingOrder(editingOrder?.id === order.id ? null : order)}
                              className={`p-2.5 rounded-xl transition-all ${editingOrder?.id === order.id ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-300' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-300'}`}
                              title="Edit Order"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all"
                              title="Cancel Order"
                            >
                              <FiX size={18} />
                            </button>
                          </>
                        )}
                        {order.status !== 'pending' && (
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                            title="Delete from History"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-teal-50 dark:bg-teal-500/10 p-5 rounded-xl border border-teal-100 dark:border-teal-500/30">
                        <p className="text-sm text-teal-700 dark:text-teal-300 font-medium mb-1">Total Amount</p>
                        <p className="text-2xl font-display font-bold text-teal-700 dark:text-teal-200">${order.total_amount}</p>
                      </div>
                      <div className="bg-violet-50 dark:bg-violet-500/10 p-5 rounded-xl border border-violet-100 dark:border-violet-500/30">
                        <p className="text-sm text-violet-700 dark:text-violet-300 font-medium mb-1">Payment</p>
                        <p className="text-lg font-semibold text-violet-700 dark:text-violet-200 capitalize flex items-center gap-2">
                          {order.payment_method === 'cash' ? '💵' : '💳'} {order.payment_method}
                        </p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-500/30">
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium mb-1">Shipping</p>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200 line-clamp-2">{order.shipping_address || 'No address provided'}</p>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div>
                        <h4 className="font-display font-semibold text-slate-800 dark:text-slate-100 mb-4">Order Items ({order.items.length})</h4>
                        <div className="space-y-3">
                          {order.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-teal-100 dark:bg-teal-500/20 rounded-xl flex items-center justify-center text-2xl">
                                  💊
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800 dark:text-slate-100">{item.product_name}</p>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">${item.price} × {item.quantity}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="font-display font-bold text-lg text-teal-600 dark:text-teal-300">${(item.price * item.quantity).toFixed(2)}</p>
                                {order.status === 'pending' && editingOrder?.id === order.id && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleUpdateQuantity(order.id, item.id, item.quantity, -1)}
                                      disabled={item.quantity <= 1}
                                      className="w-8 h-8 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center font-semibold text-slate-700 dark:text-slate-200">{item.quantity}</span>
                                    <button
                                      onClick={() => handleUpdateQuantity(order.id, item.id, item.quantity, 1)}
                                      className="w-8 h-8 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                      +
                                    </button>
                                    <button
                                      onClick={() => handleRemoveItem(order.id, item.id, item.product_name)}
                                      className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                    >
                                      <FiTrash2 size={16} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Product */}
                    {order.status === 'pending' && editingOrder?.id === order.id && (
                      <div className="mt-6">
                        {!showAddProduct ? (
                          <button
                            onClick={() => setShowAddProduct(true)}
                            className="px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-glow transition-all flex items-center gap-2"
                          >
                            <FiPlus /> Add Product
                          </button>
                        ) : (
                          <div className="bg-teal-50 dark:bg-teal-500/15 p-5 rounded-xl border border-teal-200 animate-fade-in">
                            <p className="text-sm font-medium text-teal-700 dark:text-teal-300 mb-3">Add a product to this order</p>
                            <div className="flex flex-wrap gap-3">
                              <select
                                className="flex-1 min-w-[200px] p-3 border border-teal-200 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                              >
                                <option value="">Select Product</option>
                                {products.map(product => (
                                  <option key={product.id} value={product.id}>
                                    {product.name} - ${product.price}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                                className="w-24 p-3 border border-teal-200 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="Qty"
                              />
                              <button 
                                onClick={handleAddProduct}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                              >
                                Add
                              </button>
                              <button 
                                onClick={() => setShowAddProduct(false)} 
                                className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
