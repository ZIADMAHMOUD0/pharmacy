import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSearchPalette } from '../contexts/SearchContext';
import { useCartCount } from '../hooks/useCartCount';
import ThemeToggle from './ThemeToggle';
import { FiShoppingCart, FiUser, FiLogOut, FiHome, FiHeart, FiChevronDown, FiSearch } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const cartCount = useCartCount(user?.role === 'customer');
  const { openPalette } = useSearchPalette();
  // Scroll progress (0 → 1) smoothed with a spring for the navbar progress bar.
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.2 });

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutLabel = isMac ? '⌘K' : 'Ctrl+K';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-rose-100 text-rose-700',
      doctor: 'bg-cyan-100 text-cyan-700',
      store_manager: 'bg-amber-100 text-amber-700',
      customer: 'bg-emerald-100 text-emerald-700',
    };
    return colors[role] || 'bg-slate-100 text-slate-700';
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-soft border-b border-slate-100 dark:border-slate-800'
          : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900'
      }`}>
        {/* Scroll progress bar — sits at the very top of the navbar */}
        <motion.div
          aria-hidden
          style={{ scaleX, transformOrigin: '0% 50%' }}
          className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 origin-left z-20"
        />
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex justify-between items-center h-18 py-3">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className={`relative p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                isScrolled 
                  ? 'bg-gradient-to-br from-teal-500 to-cyan-500 shadow-glow' 
                  : 'bg-white/10 backdrop-blur-sm border border-white/20'
              }`}>
                <span className="text-2xl">💊</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className={`text-2xl font-display font-bold tracking-tight transition-colors ${
                  isScrolled ? 'text-slate-800 dark:text-slate-100' : 'text-white'
                }`}>
                  Pharma<span className="text-teal-500">Care</span>
                </span>
                <p className={`text-xs font-medium ${isScrolled ? 'text-slate-500 dark:text-slate-400' : 'text-white/50'}`}>
                  Your Health Partner
                </p>
              </div>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-1">
              {user ? (
                <>
                  <div className="flex items-center gap-0.5 mr-1">
                    {user.role === 'customer' && (
                      <>
                        <NavLink to="/" icon={<FiHome />} label="Home" isActive={isActive('/')} isScrolled={isScrolled} />
                        <NavLink to="/products" icon="🏪" label="Products" isActive={isActive('/products')} isScrolled={isScrolled} />
                        <NavLink to="/cart" icon={<FiShoppingCart />} label="Cart" isActive={isActive('/cart')} isScrolled={isScrolled} badge={cartCount} />
                        <NavLink to="/orders" icon="📦" label="Orders" isActive={isActive('/orders')} isScrolled={isScrolled} />
                        <NavLink to="/ask-doctor" icon="👨‍⚕️" label="Ask Doctor" isActive={isActive('/ask-doctor')} isScrolled={isScrolled} />
                        <NavLink to="/medical-history" icon={<FiHeart />} label="Health" isActive={isActive('/medical-history')} isScrolled={isScrolled} />
                        <NavLink to="/chatbot" icon="🤖" label="AI Chat" isActive={isActive('/chatbot')} isScrolled={isScrolled} />
                      </>
                    )}
                    {user.role === 'admin' && (
                      <>
                        <NavLink to="/" icon={<FiHome />} label="Home" isActive={isActive('/')} isScrolled={isScrolled} />
                        <NavLink to="/admin/users" icon="👥" label="Users" isActive={isActive('/admin/users')} isScrolled={isScrolled} />
                        <NavLink to="/admin/categories" icon="📑" label="Categories" isActive={isActive('/admin/categories')} isScrolled={isScrolled} />
                        <NavLink to="/admin/products" icon="💊" label="Products" isActive={isActive('/admin/products')} isScrolled={isScrolled} />
                        <NavLink to="/admin/batches" icon="📦" label="Batches" isActive={isActive('/admin/batches')} isScrolled={isScrolled} />
                        <NavLink to="/admin/orders" icon="🛒" label="Orders" isActive={isActive('/admin/orders')} isScrolled={isScrolled} />
                        <NavLink to="/admin/stock-requests" icon="📋" label="Requests" isActive={isActive('/admin/stock-requests')} isScrolled={isScrolled} />
                      </>
                    )}
                    {user.role === 'store_manager' && (
                      <>
                        <NavLink to="/" icon={<FiHome />} label="Home" isActive={isActive('/')} isScrolled={isScrolled} />
                        <NavLink to="/manager/stock" icon="📊" label="Stock Management" isActive={isActive('/manager/stock')} isScrolled={isScrolled} />
                      </>
                    )}
                    {user.role === 'doctor' && (
                      <>
                        <NavLink to="/" icon={<FiHome />} label="Home" isActive={isActive('/')} isScrolled={isScrolled} />
                        <NavLink to="/doctor/questions" icon="❓" label="Questions" isActive={isActive('/doctor/questions')} isScrolled={isScrolled} />
                        <NavLink to="/doctor/patient-records" icon="📋" label="Patients" isActive={isActive('/doctor/patient-records')} isScrolled={isScrolled} />
                      </>
                    )}
                  </div>



                  {/* Search trigger (Ctrl+K) */}
                  <button
                    type="button"
                    onClick={openPalette}
                    aria-label={`Open search (${shortcutLabel})`}
                    title={`Search (${shortcutLabel})`}
                    className={`hidden md:inline-flex items-center gap-2 px-3 h-10 rounded-xl border transition-colors ${
                      isScrolled
                        ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400'
                        : 'border-white/15 bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    <FiSearch size={16} />
                    <span className="text-sm">Search</span>
                    <kbd className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isScrolled
                        ? 'border-slate-200 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400'
                        : 'border-white/20 bg-white/10 text-white/60'
                    }`}>{shortcutLabel}</kbd>
                  </button>

                  {/* Theme Toggle */}
                  <ThemeToggle isScrolled={isScrolled} className="ml-1" />

                  {/* User Menu */}
                  <div className={`relative flex items-center space-x-3 border-l pl-4 ml-2 ${
                    isScrolled ? 'border-slate-200 dark:border-slate-700' : 'border-white/10'
                  }`}>
                    <div 
                      className="relative cursor-pointer"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                    >
                      <div className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-300 ${
                        isScrolled ? 'hover:bg-slate-100' : 'hover:bg-white/10'
                      }`}>
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                          isScrolled 
                            ? 'bg-gradient-to-br from-teal-500 to-cyan-500' 
                            : 'bg-white/20 backdrop-blur-sm'
                        }`}>
                          {(user.first_name || user.username || 'U')[0].toUpperCase()}
                        </div>
                        <div className="hidden xl:block text-left">
                          <div className={`font-semibold text-sm ${isScrolled ? 'text-slate-800 dark:text-slate-100' : 'text-white'}`}>
                            {user.first_name || user.username}
                          </div>
                          <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${getRoleBadgeColor(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </div>
                        </div>
                        <FiChevronDown className={`transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''} ${
                          isScrolled ? 'text-slate-400' : 'text-white/60'
                        }`} />
                      </div>

                      {/* Dropdown Menu */}
                      {userMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-soft-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in-down">
                          <div className="p-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{user.first_name || user.username}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                          </div>
                          <div className="p-2">
                            <Link
                              to="/profile"
                              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                              <FiUser size={18} />
                              <span>My Profile</span>
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            >
                              <FiLogOut size={18} />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={openPalette}
                    aria-label={`Open search (${shortcutLabel})`}
                    className={`hidden md:inline-flex items-center gap-2 px-3 h-10 rounded-xl border transition-colors ${
                      isScrolled
                        ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400'
                        : 'border-white/15 bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    <FiSearch size={16} />
                    <span className="text-sm">Search</span>
                    <kbd className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isScrolled
                        ? 'border-slate-200 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400'
                        : 'border-white/20 bg-white/10 text-white/60'
                    }`}>{shortcutLabel}</kbd>
                  </button>
                  <ThemeToggle isScrolled={isScrolled} />

                  <Link
                    to="/login"
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                      isScrolled 
                        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' 
                        : 'bg-white text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className={`px-6 py-2.5 rounded-xl border-2 font-semibold transition-all duration-300 hover:scale-105 ${
                      isScrolled 
                        ? 'border-teal-500 text-teal-600 hover:bg-teal-50' 
                        : 'border-white/30 text-white hover:bg-white/10'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile right cluster: search + theme toggle + hamburger */}
            <div className="lg:hidden flex items-center gap-1">
              <button
                type="button"
                onClick={openPalette}
                aria-label="Open search"
                className={`p-3 rounded-xl transition-colors ${
                  isScrolled ? 'hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300' : 'hover:bg-white/10 text-white'
                }`}
              >
                <FiSearch size={18} />
              </button>
              <ThemeToggle isScrolled={isScrolled} />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-3 rounded-xl transition-all ${
                isScrolled ? 'hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300' : 'hover:bg-white/10 text-white'
              }`}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <div className="relative w-6 h-5">
                <span className={`absolute left-0 h-0.5 w-6 bg-current transform transition-all duration-300 ${
                  mobileMenuOpen ? 'top-2 rotate-45' : 'top-0'
                }`}></span>
                <span className={`absolute left-0 top-2 h-0.5 w-6 bg-current transition-all duration-300 ${
                  mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}></span>
                <span className={`absolute left-0 h-0.5 w-6 bg-current transform transition-all duration-300 ${
                  mobileMenuOpen ? 'top-2 -rotate-45' : 'top-4'
                }`}></span>
              </div>
            </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence initial={false}>
        {mobileMenuOpen && (
        <motion.div
          key="mobile-menu"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="lg:hidden overflow-hidden"
        >
          <div className={`px-4 py-6 border-t ${
            isScrolled ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' : 'bg-slate-900/95 backdrop-blur-xl border-white/10'
          }`}>
            {user ? (
              <div className="space-y-2">
                {/* User info card */}
                <div className={`p-4 rounded-2xl mb-4 ${isScrolled ? 'bg-slate-50 dark:bg-slate-800' : 'bg-white/5'}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                      {(user.first_name || user.username || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-semibold ${isScrolled ? 'text-slate-800 dark:text-slate-100' : 'text-white'}`}>
                        {user.first_name || user.username}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {user.role === 'customer' && (
                  <>
                    <MobileNavLink to="/" icon={<FiHome />} label="Home" isScrolled={isScrolled} />
                    <MobileNavLink to="/products" icon="🏪" label="Products" isScrolled={isScrolled} />
                    <MobileNavLink to="/cart" icon={<FiShoppingCart />} label="Cart" isScrolled={isScrolled} badge={cartCount} />
                    <MobileNavLink to="/orders" icon="📦" label="Orders" isScrolled={isScrolled} />
                    <MobileNavLink to="/ask-doctor" icon="👨‍⚕️" label="Ask Doctor" isScrolled={isScrolled} />
                    <MobileNavLink to="/medical-history" icon={<FiHeart />} label="Medical History" isScrolled={isScrolled} />
                    <MobileNavLink to="/chatbot" icon="🤖" label="AI Chat Assistant" isScrolled={isScrolled} />
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <MobileNavLink to="/" icon={<FiHome />} label="Home" isScrolled={isScrolled} />
                    <MobileNavLink to="/admin/users" icon="👥" label="Manage Users" isScrolled={isScrolled} />
                    <MobileNavLink to="/admin/categories" icon="📑" label="Categories" isScrolled={isScrolled} />
                    <MobileNavLink to="/admin/products" icon="💊" label="Products" isScrolled={isScrolled} />
                    <MobileNavLink to="/admin/batches" icon="📦" label="Batches" isScrolled={isScrolled} />
                    <MobileNavLink to="/admin/orders" icon="🛒" label="Orders" isScrolled={isScrolled} />
                    <MobileNavLink to="/admin/stock-requests" icon="📋" label="Stock Requests" isScrolled={isScrolled} />
                  </>
                )}
                {user.role === 'store_manager' && (
                  <>
                    <MobileNavLink to="/" icon={<FiHome />} label="Home" isScrolled={isScrolled} />
                    <MobileNavLink to="/manager/stock" icon="📊" label="Stock Management" isScrolled={isScrolled} />
                  </>
                )}
                {user.role === 'doctor' && (
                  <>
                    <MobileNavLink to="/" icon={<FiHome />} label="Home" isScrolled={isScrolled} />
                    <MobileNavLink to="/doctor/questions" icon="❓" label="Patient Questions" isScrolled={isScrolled} />
                    <MobileNavLink to="/doctor/patient-records" icon="📋" label="Patient Records" isScrolled={isScrolled} />
                  </>
                )}
                
                <div className={`pt-4 mt-4 border-t space-y-2 ${isScrolled ? 'border-slate-200' : 'border-white/10'}`}>
                  <MobileNavLink to="/profile" icon={<FiUser />} label="My Profile" isScrolled={isScrolled} />

                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      isScrolled ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10' : 'text-rose-400 hover:bg-white/5'
                    }`}
                  >
                    <FiLogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/login"
                  className={`block px-6 py-4 rounded-xl text-center font-semibold transition-all ${
                    isScrolled 
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-glow' 
                      : 'bg-white text-slate-800'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className={`block px-6 py-4 rounded-xl text-center font-semibold border-2 transition-all ${
                    isScrolled 
                      ? 'border-teal-500 text-teal-600' 
                      : 'border-white/30 text-white'
                  }`}
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </motion.div>
        )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer for fixed navbar */}
      <div className="h-18 py-3"></div>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Overlay for user menu */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </>
  );
};

const NavLink = ({ to, icon, label, isActive, isScrolled, badge }) => (
  <Link
    to={to}
    className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-xl whitespace-nowrap transition-all duration-300 group ${
      isActive
        ? isScrolled
          ? 'bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300'
          : 'bg-white/15 text-white'
        : isScrolled
          ? 'text-slate-600 hover:bg-slate-50 hover:text-teal-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-teal-300'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`}
  >
    <span className="relative text-base">
      {icon}
      {badge > 0 && (
        <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </span>
    <span className="font-medium text-[13px]">{label}</span>
    {isActive && (
      <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
        isScrolled ? 'bg-teal-500' : 'bg-white'
      }`}></span>
    )}
  </Link>
);

const MobileNavLink = ({ to, icon, label, isScrolled, badge }) => (
  <Link
    to={to}
    className={`flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all ${
      isScrolled ? 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800' : 'text-white/90 hover:bg-white/5'
    }`}
  >
    <span className="relative text-xl w-8">
      {icon}
      {badge > 0 && (
        <span className="absolute -top-1 left-5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </span>
    <span className="font-medium">{label}</span>
  </Link>
);

export default Navbar;
