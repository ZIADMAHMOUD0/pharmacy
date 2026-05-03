import React, { useState, useEffect } from 'react';
import { stockRequestAPI } from '../../services/api';
import { FiCheck, FiX, FiPackage, FiUser, FiCalendar, FiClipboard, FiSearch, FiFilter } from 'react-icons/fi';
import ConfirmModal from '../../components/ConfirmModal';
import ToastContainer from '../../components/ToastContainer';
import { useToast } from '../../hooks/useToast';

const ManageStockRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await stockRequestAPI.getAll();
      setRequests(response.data);
    } catch (error) {
      toast.error('Failed to load stock requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Stock Request',
      message: `Approve request for ${request.quantity} units of "${request.product_name}"? This will create a new batch.`,
      type: 'success',
      confirmText: 'Approve',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await stockRequestAPI.approve(request.id);
          toast.success('Stock request approved! Batch created.');
          fetchRequests();
        } catch (error) {
          toast.error(error.response?.data?.error || 'Error approving request');
        } finally {
          setActionLoading(false);
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
  };

  const handleReject = (request) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Stock Request',
      message: `Are you sure you want to reject this request for "${request.product_name}"?`,
      type: 'danger',
      confirmText: 'Reject',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await stockRequestAPI.reject(request.id);
          toast.success('Stock request rejected');
          fetchRequests();
        } catch (error) {
          toast.error('Error rejecting request');
        } finally {
          setActionLoading(false);
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-300',
      approved: 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300 border-green-300',
      rejected: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-300',
    };
    return colors[status] || 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200';
  };

  const getStatusIcon = (status) => {
    if (status === 'approved') return '✅';
    if (status === 'rejected') return '❌';
    return '⏳';
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.requested_by_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || req.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

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
                <FiClipboard className="text-blue-300" /> Stock Requests
              </h1>
              <p className="text-white/70">Review and manage stock requests from store managers</p>
            </div>
            {stats.pending > 0 && (
              <div className="px-4 py-2 bg-yellow-500/20 backdrop-blur-sm rounded-xl text-yellow-200 font-medium flex items-center gap-2">
                ⏳ {stats.pending} pending request{stats.pending > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <p className="text-white/70 text-sm">Total Requests</p>
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
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {/* Filters and Search */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All', color: 'blue' },
              { key: 'pending', label: 'Pending', color: 'yellow' },
              { key: 'approved', label: 'Approved', color: 'green' },
              { key: 'rejected', label: 'Rejected', color: 'red' }
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
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
                }`}
              >
                <FiFilter size={14} /> {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-12 text-center">
            <FiClipboard className="mx-auto mb-4 text-gray-300 dark:text-slate-600" size={64} />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-slate-300 mb-2">No Stock Requests</h3>
            <p className="text-gray-400 dark:text-slate-500">No requests match your current filters</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((req, index) => (
              <div 
                key={req.id} 
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left: Product Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                        <FiPackage className="text-blue-600 dark:text-blue-300" size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-xl text-gray-800 dark:text-slate-100">{req.product_name}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(req.status)}`}>
                            {getStatusIcon(req.status)} {req.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-slate-400 mt-2">
                          <span className="flex items-center gap-1">
                            <FiUser size={14} /> {req.requested_by_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiCalendar size={14} /> {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity */}
                  <div className="text-center md:text-right">
                    <p className="text-sm text-gray-500 dark:text-slate-400">Quantity Requested</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                      {req.quantity}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">units</p>
                  </div>
                </div>

                {/* Reason */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Reason for Request:</p>
                  <p className="text-gray-700 dark:text-slate-200">{req.reason || 'No reason provided'}</p>
                </div>

                {/* Batch Info (if provided) */}
                {(req.batch_number || req.expiry_date) && (
                  <div className="mt-3 flex gap-4 text-sm">
                    {req.batch_number && (
                      <span className="text-gray-500 dark:text-slate-400">
                        Batch: <span className="font-mono text-gray-700 dark:text-slate-200">{req.batch_number}</span>
                      </span>
                    )}
                    {req.expiry_date && (
                      <span className="text-gray-500 dark:text-slate-400">
                        Expiry: <span className="text-gray-700 dark:text-slate-200">{new Date(req.expiry_date).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => handleApprove(req)}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <FiCheck size={18} /> Approve & Create Batch
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <FiX size={18} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStockRequests;