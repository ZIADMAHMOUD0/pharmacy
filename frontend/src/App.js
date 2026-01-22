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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 pattern-dots">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 animate-pulse"></div>
            <div className="absolute inset-2 rounded-xl bg-white flex items-center justify-center">
              <span className="text-3xl animate-bounce">💊</span>
            </div>
          </div>
          <div className="text-xl font-display font-semibold text-slate-700">Loading...</div>
          <p className="text-slate-400 mt-2">Please wait while we prepare your dashboard</p>
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
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className={`absolute inset-0 ${user ? 'bg-gradient-to-br from-slate-50 via-white to-teal-50' : 'bg-slate-900'}`}>
          {!user && (
            <>
              <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{backgroundImage: 'url(/assets/images/pharmacy-bg.jpeg)'}}></div>
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-teal-900/80"></div>
            </>
          )}
          {/* Decorative blobs */}
          <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl animate-blob ${
            user ? 'bg-teal-200/40' : 'bg-teal-500/20'
          }`}></div>
          <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-blob animation-delay-2000 ${
            user ? 'bg-cyan-200/40' : 'bg-cyan-500/20'
          }`}></div>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl animate-blob animation-delay-1000 ${
            user ? 'bg-orange-100/30' : 'bg-orange-500/10'
          }`}></div>
        </div>

        {/* Pattern overlay */}
        <div className="absolute inset-0 pattern-pharmacy opacity-50"></div>

        <div className="relative container mx-auto px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left animate-fade-in-up">
              {/* Badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 ${
                user 
                  ? 'bg-teal-100 text-teal-700 border border-teal-200' 
                  : 'bg-white/10 backdrop-blur-sm text-white/90 border border-white/20'
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {user ? `Welcome back, ${user.first_name || user.username}!` : 'Trusted by 10,000+ customers'}
              </div>
              
              <h1 className={`text-5xl lg:text-7xl font-display font-bold mb-6 leading-tight tracking-tight ${
                user ? 'text-slate-800' : 'text-white'
              }`}>
                {user ? (
                  <>
                    Your Health
                    <br />
                    <span className="gradient-text">Dashboard</span>
                  </>
                ) : (
                  <>
                    Healthcare
                    <br />
                    <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                      Reimagined
                    </span>
                  </>
                )}
              </h1>
              
              <p className={`text-xl lg:text-2xl mb-10 max-w-xl ${
                user ? 'text-slate-600' : 'text-white/70'
              }`}>
                {user 
                  ? 'Manage your medications, track orders, and connect with healthcare professionals all in one place.' 
                  : 'Experience seamless healthcare. Quality medicines, expert consultations, and lightning-fast delivery at your fingertips.'}
              </p>
            
              {!user ? (
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                  <Link
                    to="/login"
                    className="group relative px-8 py-4 bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-glow hover:shadow-glow-lg transform hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Get Started
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  
                  <Link
                    to="/signup"
                    className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-2xl font-bold text-lg border-2 border-white/20 hover:bg-white/20 hover:border-white/40 transform hover:scale-105 transition-all duration-300"
                  >
                    Create Account
                  </Link>
                </div>
              ) : (
                <div className="lg:hidden">
                  <DashboardCards user={user} />
                </div>
              )}

              {/* Stats */}
              {!user && (
                <div className="flex flex-wrap justify-center lg:justify-start gap-8 mt-16">
                  {[
                    { value: '10K+', label: 'Happy Customers', icon: '😊' },
                    { value: '500+', label: 'Products', icon: '💊' },
                    { value: '50+', label: 'Expert Doctors', icon: '👨‍⚕️' },
                    { value: '24/7', label: 'Support', icon: '🛟' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center group">
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{stat.icon}</div>
                      <div className="text-3xl font-display font-bold text-white">{stat.value}</div>
                      <div className="text-white/50 text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hero Visual */}
            <div className="hidden lg:block animate-fade-in-right animation-delay-300">
              <div className="relative">
                {/* Floating cards */}
                <div className={`absolute -top-8 -left-8 p-4 rounded-2xl shadow-soft-xl animate-float ${
                  user ? 'bg-white' : 'bg-white/10 backdrop-blur-xl border border-white/20'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-2xl">✓</div>
                    <div>
                      <p className={`font-semibold ${user ? 'text-slate-800' : 'text-white'}`}>Order Delivered</p>
                      <p className={`text-sm ${user ? 'text-slate-500' : 'text-white/60'}`}>2 minutes ago</p>
                    </div>
                  </div>
                </div>

                <div className={`absolute -bottom-8 -right-8 p-4 rounded-2xl shadow-soft-xl animate-float animation-delay-1000 ${
                  user ? 'bg-white' : 'bg-white/10 backdrop-blur-xl border border-white/20'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-2xl">💬</div>
                    <div>
                      <p className={`font-semibold ${user ? 'text-slate-800' : 'text-white'}`}>Dr. Sarah replied</p>
                      <p className={`text-sm ${user ? 'text-slate-500' : 'text-white/60'}`}>Just now</p>
                    </div>
                  </div>
                </div>

                {/* Main card */}
                <div className={`relative rounded-3xl p-8 shadow-soft-xl ${
                  user ? 'bg-white border border-slate-100' : 'bg-white/10 backdrop-blur-xl border border-white/20'
                }`}>
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { icon: '💊', label: 'Medicines', count: '500+', color: 'from-teal-500 to-cyan-500' },
                      { icon: '🏥', label: 'Pharmacies', count: '50+', color: 'from-orange-400 to-amber-500' },
                      { icon: '👨‍⚕️', label: 'Doctors', count: '100+', color: 'from-cyan-500 to-sky-500' },
                      { icon: '🚚', label: 'Deliveries', count: '10K+', color: 'from-emerald-500 to-green-500' },
                    ].map((item, i) => (
                      <div key={i} className={`group p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 ${
                        user ? 'bg-slate-50 hover:bg-slate-100' : 'bg-white/5 hover:bg-white/10'
                      }`}>
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                          <span className="text-2xl">{item.icon}</span>
                        </div>
                        <div className={`text-2xl font-display font-bold ${user ? 'text-slate-800' : 'text-white'}`}>{item.count}</div>
                        <div className={user ? 'text-slate-500' : 'text-white/60'}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard for logged users */}
      {user && (
        <section className="py-16 px-6">
          <div className="hidden lg:block">
            <DashboardCards user={user} />
          </div>
        </section>
      )}

      {/* Features Section for non-logged users */}
      {!user && (
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800">
            <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{backgroundImage: 'url(/assets/images/doctors-bg.jpeg)'}}></div>
            <div className="absolute inset-0 pattern-grid"></div>
          </div>
          
          <div className="relative container mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-teal-500/10 text-teal-400 text-sm font-medium mb-4">
                Why PharmaCare?
              </span>
              <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-4">
                Healthcare Made Simple
              </h2>
              <p className="text-xl text-white/60 max-w-2xl mx-auto">
                Everything you need for your health, all in one beautifully designed platform
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon="🚀"
                title="Lightning Fast"
                description="Get your medications delivered in record time with our optimized logistics"
                gradient="from-teal-500 to-cyan-500"
              />
              <FeatureCard
                icon="🔒"
                title="Bank-Level Security"
                description="Your health data is protected with enterprise-grade encryption"
                gradient="from-orange-500 to-amber-500"
              />
              <FeatureCard
                icon="👨‍⚕️"
                title="Expert Support"
                description="Connect with verified healthcare professionals anytime, anywhere"
                gradient="from-cyan-500 to-sky-500"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const DashboardCards = ({ user }) => (
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-12">
      <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-800 mb-3">
        Quick Access
      </h2>
      <p className="text-slate-500 text-lg">Everything you need, one click away</p>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {user.role === 'customer' && (
        <>
          <DashboardCard to="/products" icon="🏪" title="Browse Products" description="Explore our medicine catalog" gradient="from-teal-500 to-cyan-500" />
          <DashboardCard to="/cart" icon="🛒" title="My Cart" description="View your shopping cart" gradient="from-orange-500 to-amber-500" />
          <DashboardCard to="/orders" icon="📦" title="Track Orders" description="Check order status" gradient="from-cyan-500 to-sky-500" />
          <DashboardCard to="/ask-doctor" icon="👨‍⚕️" title="Ask Doctor" description="Get medical advice" gradient="from-emerald-500 to-green-500" />
          <DashboardCard to="/medical-history" icon="❤️" title="Health Records" description="Manage health data" gradient="from-rose-500 to-pink-500" />
          <DashboardCard to="/chatbot" icon="🤖" title="AI Assistant" description="Get instant help" gradient="from-violet-500 to-purple-500" />
          <DashboardCard to="/profile" icon="👤" title="My Profile" description="Manage your account" gradient="from-slate-600 to-slate-700" />
        </>
      )}
      {user.role === 'admin' && (
        <>
          <DashboardCard to="/admin/users" icon="👥" title="Manage Users" description="Add, edit, delete users" gradient="from-teal-500 to-cyan-500" />
          <DashboardCard to="/admin/categories" icon="📑" title="Categories" description="Organize products" gradient="from-orange-500 to-amber-500" />
          <DashboardCard to="/admin/products" icon="💊" title="Products" description="Catalog management" gradient="from-cyan-500 to-sky-500" />
          <DashboardCard to="/admin/batches" icon="📦" title="Batches" description="Track expiry dates" gradient="from-emerald-500 to-green-500" />
          <DashboardCard to="/admin/orders" icon="🛒" title="Orders" description="Approve/reject orders" gradient="from-violet-500 to-purple-500" />
          <DashboardCard to="/admin/stock-requests" icon="📋" title="Stock Requests" description="Review requests" gradient="from-rose-500 to-pink-500" />
        </>
      )}
      {user.role === 'store_manager' && (
        <>
          <DashboardCard to="/manager/stock" icon="📊" title="Stock Management" description="Monitor inventory" gradient="from-teal-500 to-cyan-500" />
          <DashboardCard to="/profile" icon="👤" title="My Profile" description="Manage account" gradient="from-slate-600 to-slate-700" />
        </>
      )}
      {user.role === 'doctor' && (
        <>
          <DashboardCard to="/doctor/questions" icon="❓" title="Patient Questions" description="Answer queries" gradient="from-teal-500 to-cyan-500" />
          <DashboardCard to="/doctor/patient-records" icon="📋" title="Patient Records" description="View medical histories" gradient="from-cyan-500 to-sky-500" />
          <DashboardCard to="/profile" icon="👤" title="My Profile" description="Manage account" gradient="from-slate-600 to-slate-700" />
        </>
      )}
    </div>
  </div>
);

const DashboardCard = ({ to, icon, title, description, gradient }) => (
  <Link
    to={to}
    className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-soft hover:shadow-soft-xl transform hover:-translate-y-2 transition-all duration-300 border border-slate-100"
  >
    {/* Gradient background on hover */}
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
    
    {/* Icon */}
    <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
      <span className="text-2xl">{icon}</span>
    </div>
    
    {/* Content */}
    <h3 className="font-display font-bold text-xl mb-2 text-slate-800 group-hover:text-teal-600 transition-colors">{title}</h3>
    <p className="text-slate-500">{description}</p>
    
    {/* Arrow */}
    <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
      <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </Link>
);

const FeatureCard = ({ icon, title, description, gradient }) => (
  <div className="group relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2">
    {/* Glow effect */}
    <div className={`absolute -inset-px bg-gradient-to-br ${gradient} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}></div>
    
    <div className="relative">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-2xl font-display font-bold mb-3 text-white">{title}</h3>
      <p className="text-white/60 leading-relaxed">{description}</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50">
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
