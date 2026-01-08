import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import AskDoctor from './pages/AskDoctor';
import Profile from './pages/Profile';
import Chatbot from './pages/Chatbot';
import ManageUsers from './pages/admin/ManageUsers';
import ManageProducts from './pages/admin/ManageProducts';
import ManageOrders from './pages/admin/ManageOrders';
import StockManagement from './pages/manager/StockManagement';
import DoctorQuestions from './pages/doctor/DoctorQuestions';
import ManageStockRequests from './pages/admin/ManageStockRequests';
import ManageCategories from './pages/admin/ManageCategories';
import ManageBatches from './pages/admin/ManageBatches';
import MedicalHistory from './pages/MedicalHistory';
import PatientMedicalRecords from './pages/doctor/PatientMedicalRecords';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <div 
        className="relative overflow-hidden"
        style={{
          backgroundImage: user ? 'none' : 'url(/assets/images/pharmacy-bg.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay for non-logged in users */}
        {!user && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/80 to-purple-900/70"></div>
        )}
        
        {/* Animated Background (for logged in users) */}
        {user && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
        )}

        <div className="relative container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-center md:text-left animate-fade-in">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6 ${
                user 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-white/10 backdrop-blur-md text-white/90 border border-white/20'
              }`}>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {user ? `Welcome back, ${user.first_name || user.username}!` : 'Trusted by 10,000+ customers'}
              </div>
              
              <h1 className={`text-5xl md:text-7xl font-bold mb-6 leading-tight ${
                user 
                  ? 'bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600' 
                  : 'text-white'
              }`}>
                {user ? 'Welcome to' : 'Your Health,'}
                <br />
                <span className={user ? '' : 'bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent'}>
                  {user ? 'PharmaCare' : 'Our Priority'}
                </span>
              </h1>
              
              <p className={`text-xl md:text-2xl mb-8 ${user ? 'text-gray-600' : 'text-white/80'}`}>
                {user 
                  ? 'Your trusted online pharmacy management system' 
                  : 'Experience the future of healthcare. Quality medicines, expert consultations, and fast delivery.'}
              </p>
            
              {!user ? (
                <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 animate-slide-up">
                  <Link
                    to="/login"
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-center"
                  >
                    <span className="relative z-10">Login Now</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  
                  <Link
                    to="/signup"
                    className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-xl font-bold text-lg border-2 border-white/30 hover:bg-white/20 transform hover:scale-105 transition-all duration-300 text-center"
                  >
                    Sign Up Free
                  </Link>
                </div>
              ) : (
                <div className="md:hidden">
                  <DashboardCards user={user} />
                </div>
              )}

              {/* Stats for non-logged users */}
              {!user && (
                <div className="flex flex-wrap justify-center md:justify-start gap-8 mt-12">
                  {[
                    { value: '10K+', label: 'Happy Customers' },
                    { value: '500+', label: 'Products' },
                    { value: '50+', label: 'Expert Doctors' },
                    { value: '24/7', label: 'Support' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-3xl font-bold text-white">{stat.value}</div>
                      <div className="text-white/60 text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hero Image/Cards */}
            <div className="hidden md:block animate-scale-in">
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${user ? 'from-blue-400 to-purple-400' : 'from-white/20 to-white/10'} rounded-3xl transform rotate-6 opacity-20`}></div>
                <div className={`relative ${user ? 'bg-white' : 'bg-white/10 backdrop-blur-md border border-white/20'} rounded-3xl p-8 shadow-2xl`}>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: '💊', label: 'Medicines', count: '500+' },
                      { icon: '🏥', label: 'Pharmacies', count: '50+' },
                      { icon: '👨‍⚕️', label: 'Doctors', count: '100+' },
                      { icon: '🚚', label: 'Deliveries', count: '10K+' },
                    ].map((item, i) => (
                      <div key={i} className={`${user ? 'bg-gray-50' : 'bg-white/10'} rounded-xl p-4 text-center`}>
                        <div className="text-4xl mb-2">{item.icon}</div>
                        <div className={`text-2xl font-bold ${user ? 'text-gray-800' : 'text-white'}`}>{item.count}</div>
                        <div className={user ? 'text-gray-500' : 'text-white/70'}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards for logged users (desktop) */}
      {user && (
        <div className="hidden md:block py-16 px-6 bg-gradient-to-b from-white to-gray-50">
          <DashboardCards user={user} />
        </div>
      )}

      {/* Features Section for non-logged users */}
      {!user && (
        <div 
          className="relative py-24"
          style={{
            backgroundImage: 'url(/assets/images/doctors-bg.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/95 via-blue-800/90 to-blue-900/80"></div>
          
          <div className="relative container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                Why Choose PharmaCare?
              </h2>
              <p className="text-white/70 text-lg">Experience the future of healthcare management</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon="🚀"
                title="Fast & Efficient"
                description="Get your medications quickly with our streamlined ordering process"
                color="from-blue-500 to-cyan-500"
              />
              <FeatureCard
                icon="🔒"
                title="Secure & Private"
                description="Your health data is protected with enterprise-grade security"
                color="from-purple-500 to-pink-500"
              />
              <FeatureCard
                icon="👨‍⚕️"
                title="Expert Support"
                description="Connect with healthcare professionals anytime you need guidance"
                color="from-green-500 to-teal-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardCards = ({ user }) => (
  <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-6xl mx-auto animate-scale-in">
    <h2 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
      Quick Access Dashboard
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {user.role === 'customer' && (
        <>
          <DashboardCard to="/products" icon="🏪" title="Browse Products" description="Explore our medicine catalog" gradient="from-blue-500 to-cyan-500" />
          <DashboardCard to="/cart" icon="🛒" title="My Cart" description="View your shopping cart" gradient="from-green-500 to-teal-500" />
          <DashboardCard to="/orders" icon="📦" title="Track Orders" description="Check order status" gradient="from-purple-500 to-pink-500" />
          <DashboardCard to="/ask-doctor" icon="👨‍⚕️" title="Ask Doctor" description="Get medical advice" gradient="from-yellow-500 to-orange-500" />
          <DashboardCard to="/medical-history" icon="❤️" title="Medical History" description="Manage health records" gradient="from-red-500 to-pink-500" />
          <DashboardCard to="/chatbot" icon="💬" title="Chat Assistant" description="Get instant help" gradient="from-pink-500 to-rose-500" />
          <DashboardCard to="/profile" icon="👤" title="My Profile" description="Manage your account" gradient="from-indigo-500 to-blue-500" />
        </>
      )}
      {user.role === 'admin' && (
        <>
          <DashboardCard to="/admin/users" icon="👥" title="Manage Users" description="Add, edit, delete users" gradient="from-blue-500 to-cyan-500" />
          <DashboardCard to="/admin/categories" icon="📑" title="Categories" description="Organize products" gradient="from-indigo-500 to-purple-500" />
          <DashboardCard to="/admin/products" icon="💊" title="Products" description="Catalog management" gradient="from-green-500 to-teal-500" />
          <DashboardCard to="/admin/batches" icon="📦" title="Batches" description="Track expiry dates" gradient="from-teal-500 to-cyan-500" />
          <DashboardCard to="/admin/orders" icon="🛒" title="Orders" description="Approve/reject orders" gradient="from-purple-500 to-pink-500" />
          <DashboardCard to="/admin/stock-requests" icon="📋" title="Stock Requests" description="Review requests" gradient="from-orange-500 to-red-500" />
        </>
      )}
      {user.role === 'store_manager' && (
        <>
          <DashboardCard to="/manager/stock" icon="📊" title="Stock Management" description="Monitor inventory" gradient="from-blue-500 to-purple-500" />
          <DashboardCard to="/profile" icon="👤" title="My Profile" description="Manage account" gradient="from-green-500 to-teal-500" />
        </>
      )}
      {user.role === 'doctor' && (
        <>
          <DashboardCard to="/doctor/questions" icon="❓" title="Patient Questions" description="Answer queries" gradient="from-blue-500 to-purple-500" />
          <DashboardCard to="/doctor/patient-records" icon="📋" title="Patient Records" description="View medical histories" gradient="from-green-500 to-teal-500" />
          <DashboardCard to="/profile" icon="👤" title="My Profile" description="Manage account" gradient="from-indigo-500 to-blue-500" />
        </>
      )}
    </div>
  </div>
);

const DashboardCard = ({ to, icon, title, description, gradient }) => (
  <Link
    to={to}
    className="group relative overflow-hidden bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
    <div className="relative">
      <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="font-bold text-xl mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </Link>
);

const FeatureCard = ({ icon, title, description, color }) => {
  return (
    <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-2">
      <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-white/70">{description}</p>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Customer Routes */}
            <Route path="/products" element={<PrivateRoute allowedRoles={['customer']}><Products /></PrivateRoute>} />
            <Route path="/cart" element={<PrivateRoute allowedRoles={['customer']}><Cart /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute allowedRoles={['customer']}><Orders /></PrivateRoute>} />
            <Route path="/ask-doctor" element={<PrivateRoute allowedRoles={['customer']}><AskDoctor /></PrivateRoute>} />
            <Route path="/chatbot" element={<PrivateRoute allowedRoles={['customer']}><Chatbot /></PrivateRoute>} />
            <Route path="/medical-history" element={<PrivateRoute allowedRoles={['customer']}><MedicalHistory /></PrivateRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin/users" element={<PrivateRoute allowedRoles={['admin']}><ManageUsers /></PrivateRoute>} />
            <Route path="/admin/categories" element={<PrivateRoute allowedRoles={['admin']}><ManageCategories /></PrivateRoute>} />
            <Route path="/admin/products" element={<PrivateRoute allowedRoles={['admin']}><ManageProducts /></PrivateRoute>} />
            <Route path="/admin/batches" element={<PrivateRoute allowedRoles={['admin']}><ManageBatches /></PrivateRoute>} />
            <Route path="/admin/orders" element={<PrivateRoute allowedRoles={['admin']}><ManageOrders /></PrivateRoute>} />
            <Route path="/admin/stock-requests" element={<PrivateRoute allowedRoles={['admin']}><ManageStockRequests /></PrivateRoute>} />
            
            {/* Store Manager Routes */}
            <Route path="/manager/stock" element={<PrivateRoute allowedRoles={['store_manager']}><StockManagement /></PrivateRoute>} />
            
            {/* Doctor Routes */}
            <Route path="/doctor/questions" element={<PrivateRoute allowedRoles={['doctor']}><DoctorQuestions /></PrivateRoute>} />
            <Route path="/doctor/patient-records" element={<PrivateRoute allowedRoles={['doctor', 'admin']}><PatientMedicalRecords /></PrivateRoute>} />
            
            {/* Common Routes */}
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;