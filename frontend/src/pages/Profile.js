import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave, FiShield, FiCalendar } from 'react-icons/fi';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: ''
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
    }
  }, [user]);

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
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { color: 'bg-red-100 text-red-700 border-red-200', icon: '👑', label: 'Administrator' },
      doctor: { color: 'bg-green-100 text-green-700 border-green-200', icon: '👨‍⚕️', label: 'Doctor' },
      store_manager: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '📊', label: 'Store Manager' },
      customer: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '👤', label: 'Customer' },
    };
    return badges[role] || badges.customer;
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      
      {/* Hero Section */}
      <section 
        className="relative py-20 overflow-hidden"
        style={{
          backgroundImage: 'url(/assets/images/doctors-bg.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/80"></div>
        
        <div className="relative z-10 container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-6xl shadow-2xl border-4 border-white/30">
              {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '👤'}
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold text-white mb-2">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-white/70 text-lg mb-3">@{user?.username}</p>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${roleBadge.color}`}>
                {roleBadge.icon} {roleBadge.label}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiUser className="text-blue-600" /> Profile Information
              </h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <FiEdit2 size={16} /> Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="email"
                        className="w-full pl-12 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <div className="relative">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="tel"
                        className="w-full pl-12 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-4 top-4 text-gray-400" size={20} />
                      <textarea
                        className="w-full pl-12 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                        rows="3"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
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
                  <InfoCard icon={<FiMapPin />} label="Address" value={user?.address || '-'} fullWidth />
                </div>
              )}
            </div>
          </div>

          {/* Account Stats */}
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-blue-100 text-sm">Total Orders</p>
              <p className="text-3xl font-bold">-</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="text-4xl mb-2">❓</div>
              <p className="text-purple-100 text-sm">Questions Asked</p>
              <p className="text-3xl font-bold">-</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="text-4xl mb-2">⭐</div>
              <p className="text-green-100 text-sm">Member Since</p>
              <p className="text-xl font-bold">2024</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon, label, value, fullWidth }) => (
  <div className={`bg-gray-50 rounded-xl p-4 ${fullWidth ? 'md:col-span-2' : ''}`}>
    <div className="flex items-center gap-3 mb-1">
      <span className="text-blue-600">{icon}</span>
      <span className="text-sm font-medium text-gray-500">{label}</span>
    </div>
    <p className="text-lg font-semibold text-gray-800 ml-8">{value}</p>
  </div>
);

export default Profile;
