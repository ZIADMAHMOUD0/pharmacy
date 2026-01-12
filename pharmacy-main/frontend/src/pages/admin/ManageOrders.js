import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import { FiCheck, FiX, FiPackage, FiSearch, FiFilter, FiUser, FiCalendar, FiMapPin, FiCreditCard, FiTruck, FiEye, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import ConfirmModal from '../../components/ConfirmModal';
import ToastContainer from '../../components/ToastContainer';
import { useToast } from '../../hooks/useToast';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getAll();
      // Sort by newest first
      const sortedOrders = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (order) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Order',
      message: `Approve order #${order.id} for ${order.customer_name}? Total: $${order.total_amount}`,
      type: 'success',
      confirmText: 'Approve',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await orderAPI.approve(order.id);
          toast.success(`Order #${order.id} approved successfully!`);
          fetchOrders();
        } catch (error) {
          console.error('Approve error:', error);
          toast.error(error.response?.data?.error || 'Error approving order');
        } finally {
          setActionLoading(false);
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
  };

  const handleReject = (order) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Order',
      message: `Are you sure you want to reject order #${order.id}? Stock will be returned.`,
      type: 'danger',
      confirmText: 'Reject',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await orderAPI.reject(order.id);
          toast.success(`Order #${order.id} rejected. Stock returned.`);
          fetchOrders();
        } catch (error) {
          console.error('Reject error:', error);
          toast.error(error.response?.data?.error || 'Error rejecting order');
        } finally {
          setActionLoading(false);
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', icon: '⏳' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', icon: '✅' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', icon: '❌' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', icon: '🔄' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', icon: '🚚' },
      delivered: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', icon: '📦' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', icon: '🚫' },
    };
    return configs[status] || configs.pending;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toString().includes(searchTerm) ||
      order.shipping_address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || order.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    approved: orders.filter(o => o.status === 'approved').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
    totalRevenue: orders.filter(o => o.status === 'approved' || o.status === 'delivered').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
        onConfirm={confirmModal.onConfirm} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        type={confirmModal.type} 
        confirmText={confirmModal.confirmText} 
        loading={actionLoading} 
      />

      {/* Hero Section */}
      <section className="relative py-12 overflow-hidden" style={{ backgroundImage: 'url(/assets/images/pharmacy-bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/80"></div>
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FiPackage className="text-blue-300" /> Manage Orders
              </h1>
              <p className="text-white/70">Review and process customer orders</p>
            </div>
            {stats.pending > 0 && (
              <div className="px-4 py-2 bg-yellow-500/20 backdrop-blur-sm rounded-xl text-yellow-200 font-medium flex items-center gap-2 animate-pulse">
                ⏳ {stats.pending} order{stats.pending > 1 ? 's' : ''} awaiting approval
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-white/70 text-sm">Total Orders</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-yellow-500/20 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-yellow-200 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-300">{stats.pending}</p>
            </div>
            <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-green-200 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-300">{stats.approved}</p>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-red-200 text-sm">Rejected</p>
              <p className="text-3xl font-bold text-red-300">{stats.rejected}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white col-span-2 md:col-span-1">
              <p className="text-white/70 text-sm">Revenue</p>
              <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All', color: 'blue' },
              { key: 'pending', label: 'Pending', color: 'yellow' },
              { key: 'approved', label: 'Approved', color: 'green' },
              { key: 'rejected', label: 'Rejected', color: 'red' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  filter === f.key
                    ? f.color === 'blue' ? 'bg-blue-600 text-white' 
                    : f.color === 'yellow' ? 'bg-yellow-500 text-white' 
                    : f.color === 'green' ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FiFilter size={14} /> {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FiPackage className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Found</h3>
            <p className="text-gray-400">No orders match your current filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              const isExpanded = expandedOrder === order.id;
              
              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Order Header */}
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Left Side */}
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                          <FiPackage className="text-blue-600" size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-xl text-gray-800">Order #{order.id}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                              {statusConfig.icon} {order.status?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <FiUser size={14} /> {order.customer_name || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiCalendar size={14} /> {new Date(order.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Total */}
                      <div className="text-center md:text-right">
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ${parseFloat(order.total_amount || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiMapPin className="text-gray-400" />
                        <span className="text-sm truncate">{order.shipping_address || 'No address'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiCreditCard className="text-gray-400" />
                        <span className="text-sm capitalize">{order.payment_method || 'Cash'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiPackage className="text-gray-400" />
                        <span className="text-sm">{order.items?.length || 0} item(s)</span>
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button 
                      onClick={() => toggleExpand(order.id)}
                      className="mt-4 w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <FiEye size={16} />
                      {isExpanded ? 'Hide Details' : 'View Details'}
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="bg-gray-50 p-6 border-t border-gray-100">
                      {/* Items List */}
                      {order.items && order.items.length > 0 ? (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-700 mb-3">Order Items:</h4>
                          <div className="bg-white rounded-xl overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Product</th>
                                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-600">Qty</th>
                                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">Price</th>
                                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map(item => (
                                  <tr key={item.id} className="border-t border-gray-100">
                                    <td className="px-4 py-3 text-gray-800">{item.product_name}</td>
                                    <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right text-gray-600">${parseFloat(item.price || 0).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                                      ${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-gray-50">
                                <tr>
                                  <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-700">Total:</td>
                                  <td className="px-4 py-3 text-right font-bold text-blue-600">
                                    ${parseFloat(order.total_amount || 0).toFixed(2)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No items in this order</p>
                      )}

                      {/* Notes */}
                      {order.notes && (
                        <div className="bg-white rounded-xl p-4 mb-4">
                          <h4 className="font-semibold text-gray-700 mb-2">Notes:</h4>
                          <p className="text-gray-600">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {order.status === 'pending' && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                      <button
                        onClick={() => handleApprove(order)}
                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <FiCheck size={18} /> Approve Order
                      </button>
                      <button
                        onClick={() => handleReject(order)}
                        className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <FiX size={18} /> Reject Order
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageOrders;