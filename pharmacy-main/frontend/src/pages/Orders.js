import React, { useState, useEffect } from 'react';
import { orderAPI, productAPI } from '../services/api';
import { FiTrash2, FiEdit2, FiPlus, FiX, FiPackage, FiClock, FiCheck, FiTruck } from 'react-icons/fi';
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
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <FiClock />, label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: <FiCheck />, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: <FiX />, label: 'Rejected' },
      processing: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <FiPackage />, label: 'Processing' },
      shipped: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: <FiTruck />, label: 'Shipped' },
      delivered: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <FiCheck />, label: 'Delivered' },
      cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <FiX />, label: 'Cancelled' },
    };
    return configs[status] || configs.pending;
  };

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

      {/* Hero Section */}
      <section 
        className="relative py-12 overflow-hidden"
        style={{
          backgroundImage: 'url(/assets/images/pharmacy-bg.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/80"></div>
        <div className="relative z-10 container mx-auto px-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <FiPackage size={36} /> My Orders
          </h1>
          <p className="text-white/70">Track and manage your orders</p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <FiPackage className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Your order history will appear here</p>
            <a href="/products" className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              Start Shopping
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-xl text-gray-800">Order #{order.id}</h3>
                        <p className="text-gray-500 text-sm">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${statusConfig.color}`}>
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setEditingOrder(editingOrder?.id === order.id ? null : order)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Order"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Cancel Order"
                            >
                              <FiX size={18} />
                            </button>
                          </>
                        )}
                        {order.status !== 'pending' && (
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                        <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                        <p className="text-2xl font-bold text-blue-800">${order.total_amount}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                        <p className="text-sm text-purple-600 font-medium">Payment</p>
                        <p className="text-lg font-semibold text-purple-800 capitalize">{order.payment_method}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                        <p className="text-sm text-green-600 font-medium">Shipping</p>
                        <p className="text-sm font-medium text-green-800 truncate">{order.shipping_address}</p>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                        <div className="space-y-3">
                          {order.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                                  💊
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800">{item.product_name}</p>
                                  <p className="text-sm text-gray-500">${item.price} × {item.quantity}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="font-bold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                                {order.status === 'pending' && editingOrder?.id === order.id && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleUpdateQuantity(order.id, item.id, item.quantity, -1)}
                                      disabled={item.quantity <= 1}
                                      className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center disabled:opacity-50"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                    <button
                                      onClick={() => handleUpdateQuantity(order.id, item.id, item.quantity, 1)}
                                      className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
                                    >
                                      +
                                    </button>
                                    <button
                                      onClick={() => handleRemoveItem(order.id, item.id, item.product_name)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                      <div className="mt-4">
                        {!showAddProduct ? (
                          <button
                            onClick={() => setShowAddProduct(true)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
                          >
                            <FiPlus /> Add Product
                          </button>
                        ) : (
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex flex-wrap gap-3">
                              <select
                                className="flex-1 min-w-[200px] p-3 border border-blue-200 rounded-xl"
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
                                className="w-24 p-3 border border-blue-200 rounded-xl"
                                placeholder="Qty"
                              />
                              <button onClick={handleAddProduct} className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">
                                Add
                              </button>
                              <button onClick={() => setShowAddProduct(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300">
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
