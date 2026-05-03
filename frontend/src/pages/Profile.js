import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave, FiShield, FiAward, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ old: false, new: false, confirm: false });
  const [stats, setStats] = useState({
    total_orders: 0,
    total_questions: 0,
    member_since: '',
    member_since_year: null
  });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const toast = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
      // Fetch user stats
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await authAPI.getMyStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(formData);
      if (updateUser) {
        updateUser(response.data);
      }
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setPasswordLoading(true);
    try {
      await authAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error changing password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { color: 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30', icon: '👑', label: 'Administrator', gradient: 'from-rose-500 to-red-500' },
      doctor: { color: 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30', icon: '👨‍⚕️', label: 'Doctor', gradient: 'from-cyan-500 to-teal-500' },
      store_manager: { color: 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30', icon: '📊', label: 'Store Manager', gradient: 'from-violet-500 to-purple-500' },
      customer: { color: 'bg-teal-100 text-teal-700 dark:text-teal-300 border-teal-200', icon: '👤', label: 'Customer', gradient: 'from-teal-500 to-cyan-500' },
    };
    return badges[role] || badges.customer;
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 pattern-pharmacy opacity-5"></div>
        
        {/* Animated blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className={`w-32 h-32 bg-gradient-to-br ${roleBadge.gradient} rounded-3xl flex items-center justify-center text-5xl font-display font-bold text-white shadow-2xl ring-4 ring-white/20`}>
              {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '👤'}
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-display font-bold text-white mb-2">
                {user?.first_name || user?.username} {user?.last_name}
              </h1>
              <p className="text-white/50 text-lg mb-4">@{user?.username}</p>
              <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border ${roleBadge.color}`}>
                {roleBadge.icon} {roleBadge.label}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden border border-slate-100 dark:border-slate-800">
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 dark:bg-teal-500/15 rounded-xl flex items-center justify-center">
                  <FiUser className="text-teal-600 dark:text-teal-300" size={20} />
                </div>
                Profile Information
              </h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-glow transition-all flex items-center gap-2"
                >
                  <FiEdit2 size={16} /> Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => setEditing(false)}
                  className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">First Name</label>
                      <input
                        type="text"
                        className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Last Name</label>
                      <input
                        type="text"
                        className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Email</label>
                    <div className="relative group">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-teal-500 transition-colors" size={20} />
                      <input
                        type="email"
                        className="w-full pl-12 p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Phone</label>
                    <div className="relative group">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-teal-500 transition-colors" size={20} />
                      <input
                        type="tel"
                        className="w-full pl-12 p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Address</label>
                    <div className="relative group">
                      <FiMapPin className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within:text-teal-500 transition-colors" size={20} />
                      <textarea
                        className="w-full pl-12 p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none transition-all"
                        rows="3"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-glow disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave /> Save Changes
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <InfoCard icon={<FiUser />} label="Full Name" value={`${user?.first_name || '-'} ${user?.last_name || ''}`} />
                    <InfoCard icon={<FiMail />} label="Email" value={user?.email || '-'} />
                    <InfoCard icon={<FiPhone />} label="Phone" value={user?.phone || '-'} />
                    <InfoCard icon={<FiShield />} label="Role" value={roleBadge.label} />
                  </div>
                  <InfoCard icon={<FiMapPin />} label="Address" value={user?.address || 'No address provided'} fullWidth />
                </div>
              )}
            </div>
          </div>

          {/* Account Stats */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-soft border border-slate-100 dark:border-slate-800 group hover:shadow-soft-xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-teal-500/30">
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-display font-bold text-slate-800 dark:text-slate-100">{stats.total_orders}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-soft border border-slate-100 dark:border-slate-800 group hover:shadow-soft-xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/30">
                <span className="text-2xl">❓</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Questions Asked</p>
              <p className="text-3xl font-display font-bold text-slate-800 dark:text-slate-100">{stats.total_questions}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-soft border border-slate-100 dark:border-slate-800 group hover:shadow-soft-xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/30">
                <FiAward className="text-white" size={24} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Member Since</p>
              <p className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">{stats.member_since || 'N/A'}</p>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft overflow-hidden border border-slate-100 dark:border-slate-800 mt-8">
            <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/15 rounded-xl flex items-center justify-center">
                  <FiLock className="text-rose-600 dark:text-rose-300" size={20} />
                </div>
                Security
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Password</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Change your account password</p>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-rose-500/30 transition-all flex items-center gap-2"
                >
                  <FiLock size={16} /> Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/15 rounded-xl flex items-center justify-center">
                <FiLock className="text-rose-600 dark:text-rose-300" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">Change Password</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Enter your current and new password</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Current Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                  <input
                    type={showPasswords.old ? 'text' : 'password'}
                    className="w-full pl-12 pr-12 p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                    placeholder="Enter current password"
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, old: !showPasswords.old})}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300"
                  >
                    {showPasswords.old ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    className="w-full pl-12 pr-12 p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                    placeholder="Enter new password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300"
                  >
                    {showPasswords.new ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Confirm New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    className="w-full pl-12 pr-12 p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                    placeholder="Confirm new password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300"
                  >
                    {showPasswords.confirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
                  }}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-rose-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {passwordLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Changing...
                    </>
                  ) : (
                    <>
                      <FiLock size={16} /> Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ icon, label, value, fullWidth }) => (
  <div className={`bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-800 ${fullWidth ? 'md:col-span-2' : ''}`}>
    <div className="flex items-center gap-3 mb-2">
      <span className="text-teal-600 dark:text-teal-300">{icon}</span>
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
    </div>
    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 ml-8">{value}</p>
  </div>
);

export default Profile;
