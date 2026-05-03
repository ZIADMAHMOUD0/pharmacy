import React, { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SearchProvider, useSearchPalette } from './contexts/SearchContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ProductsCacheProvider } from './contexts/ProductsCacheContext';
import { CategoriesCacheProvider } from './contexts/CategoriesCacheContext';
import { BatchesCacheProvider } from './contexts/BatchesCacheContext';
import { ThemeProvider } from './context/ThemeContext';
import { useRoutePrefetch } from './hooks/useRoutePrefetch';
import SearchPalette from './components/SearchPalette';
import HashScrollHandler from './components/HashScrollHandler';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import TrustedBrands from './components/TrustedBrands';
import CategoriesShowcase from './components/CategoriesShowcase';
import FeaturedProducts from './components/FeaturedProducts';
import Testimonials from './components/Testimonials';
import ScrollToTop from './components/ScrollToTop';

// Route-level code splitting: every page is its own chunk so first paint
// only loads the public home shell + Navbar/Footer.
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Products = lazy(() => import('./pages/Products'));
const Cart = lazy(() => import('./pages/Cart'));
const Orders = lazy(() => import('./pages/Orders'));
const AskDoctor = lazy(() => import('./pages/AskDoctor'));
const Profile = lazy(() => import('./pages/Profile'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const MedicalHistory = lazy(() => import('./pages/MedicalHistory'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const ManageProducts = lazy(() => import('./pages/admin/ManageProducts'));
const ManageOrders = lazy(() => import('./pages/admin/ManageOrders'));
const ManageStockRequests = lazy(() => import('./pages/admin/ManageStockRequests'));
const ManageCategories = lazy(() => import('./pages/admin/ManageCategories'));
const ManageBatches = lazy(() => import('./pages/admin/ManageBatches'));
const StockManagement = lazy(() => import('./pages/manager/StockManagement'));
const DoctorQuestions = lazy(() => import('./pages/doctor/DoctorQuestions'));
const PatientMedicalRecords = lazy(() => import('./pages/doctor/PatientMedicalRecords'));

const RouteFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto mb-5">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 animate-pulse" />
        <div className="absolute inset-2 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center">
          <span className="text-2xl">💊</span>
        </div>
      </div>
      <p className="text-slate-500 dark:text-slate-400 font-medium">Loading…</p>
    </div>
  </div>
);

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

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Hero />
        <TrustedBrands />
        <CategoriesShowcase />
        <FeaturedProducts />
        <Testimonials />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 pattern-dots">
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Welcome back, {user.first_name || user.username}!
          </div>
          <h1 className="text-4xl lg:text-6xl font-display font-bold text-slate-800 dark:text-slate-100 mb-4 tracking-tight">
            Your Health <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Manage your medications, track orders, and connect with healthcare professionals — all
            in one place.
          </p>
        </div>
        <DashboardCards user={user} />
      </section>
    </div>
  );
};

const DashboardCards = ({ user }) => (
  <div className="max-w-7xl mx-auto">
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
    className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-soft hover:shadow-soft-xl transform hover:-translate-y-2 transition-all duration-300 border border-slate-100 dark:border-slate-800"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

    <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
      <span className="text-2xl">{icon}</span>
    </div>

    <h3 className="font-display font-bold text-xl mb-2 text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400">{description}</p>

    <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
      <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </Link>
);

const GlobalSearchPalette = () => {
  const { open, closePalette } = useSearchPalette();
  return <SearchPalette open={open} onClose={closePalette} />;
};

// Top destinations after first paint — prefetched during idle.
// Intentionally narrow: Login + Products + Cart cover ~80% of post-landing nav.
const PrefetchOnIdle = () => {
  const importers = useMemo(
    () => [
      () => import('./pages/Login'),
      () => import('./pages/Products'),
      () => import('./pages/Cart'),
    ],
    []
  );
  useRoutePrefetch(importers);
  return null;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ProductsCacheProvider>
          <CategoriesCacheProvider>
          <BatchesCacheProvider>
          <WishlistProvider>
          <SearchProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col">
            <PrefetchOnIdle />
            <HashScrollHandler />
            <GlobalSearchPalette />
            <Navbar />
            <main className="flex-1">
              <Suspense fallback={<RouteFallback />}>
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
              </Suspense>
            </main>
            <Footer />
            <ScrollToTop />
          </div>
          </SearchProvider>
          </WishlistProvider>
          </BatchesCacheProvider>
          </CategoriesCacheProvider>
          </ProductsCacheProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
