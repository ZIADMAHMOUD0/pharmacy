import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiSearch, FiShield, FiX } from 'react-icons/fi';
import ConfirmModal from '../../components/ConfirmModal';
import ToastContainer from '../../components/ToastContainer';
import { useToast } from '../../hooks/useToast';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '', role: 'customer', phone: '', address: ''
  });

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {} });
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setActionLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await userAPI.updateProfile(editingUser.id, formData);
        toast.success('User updated!');
      } else {
        await userAPI.createUser(formData);
        toast.success('User created!');
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ username: user.username, email: user.email, password: '', first_name: user.first_name || '', last_name: user.last_name || '', role: user.role, phone: user.phone || '', address: user.address || '' });
    setShowModal(true);
  };

  const handleDelete = (user) => {
    setConfirmModal({
      isOpen: true, title: 'Delete User', message: `Delete "${user.username}"? This cannot be undone.`, type: 'danger', confirmText: 'Delete',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await userAPI.deleteUser(user.id);
          toast.success('User deleted!');
          fetchUsers();
        } catch (error) {
          toast.error('Error deleting user');
        } finally {
          closeConfirmModal();
        }
      },
    });
  };

  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', first_name: '', last_name: '', role: 'customer', phone: '', address: '' });
    setEditingUser(null);
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-700', doctor: 'bg-green-100 text-green-700',
      store_manager: 'bg-purple-100 text-purple-700', customer: 'bg-blue-100 text-blue-700'
    };
    return badges[role] || 'bg-gray-100 text-gray-700';
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3"><FiUsers size={36} /> Manage Users</h1>
            <p className="text-white/70">{users.length} users registered</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg">
            <FiPlus /> Add User
          </button>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search users..." className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">User</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Email</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Role</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Phone</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className="border-t hover:bg-gray-50 transition-colors animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.first_name?.[0] || user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadge(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><FiEdit2 size={18} /></button>
                        <button onClick={() => handleDelete(user)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FiUsers className="mx-auto mb-4 text-gray-300" size={48} />
                <p>No users found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                  <input type="text" className="w-full p-3 border border-gray-200 rounded-xl" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                  <input type="text" className="w-full p-3 border border-gray-200 rounded-xl" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username *</label>
                <input type="text" className="w-full p-3 border border-gray-200 rounded-xl" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input type="email" className="w-full p-3 border border-gray-200 rounded-xl" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password {editingUser ? '(leave blank to keep)' : '*'}</label>
                <input type="password" className="w-full p-3 border border-gray-200 rounded-xl" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!editingUser} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role *</label>
                <select className="w-full p-3 border border-gray-200 rounded-xl" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                  <option value="customer">Customer</option>
                  <option value="doctor">Doctor</option>
                  <option value="store_manager">Store Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input type="tel" className="w-full p-3 border border-gray-200 rounded-xl" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg">{editingUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;