import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX, FiHome } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg' 
        : 'bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 shadow-2xl'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className={`p-2 rounded-lg group-hover:scale-110 transition-transform duration-300 ${
              isScrolled ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-white'
            }`}>
              <span className="text-2xl">💊</span>
            </div>
            <span className={`text-2xl font-bold transition-colors ${
              isScrolled ? 'text-gray-800' : 'text-white'
            }`}>
              Pharma<span className="text-blue-500">Care</span>
            </span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                <div className="flex items-center space-x-1 mr-4">
                  {user.role === 'customer' && (
                    <>
                      <NavLink to="/" icon={<FiHome />} label="Home" isActive={isActive('/')} isScrolled={isScrolled} />
                      <NavLink to="/products" icon="🏪" label="Products" isActive={isActive('/products')} isScrolled={isScrolled} />
                      <NavLink to="/cart" icon={<FiShoppingCart />} label="Cart" isActive={isActive('/cart')} isScrolled={isScrolled} />
                      <NavLink to="/orders" icon="📦" label="Orders" isActive={isActive('/orders')} isScrolled={isScrolled} />
                      <NavLink to="/ask-doctor" icon="👨‍⚕️" label="Ask Doctor" isActive={isActive('/ask-doctor')} isScrolled={isScrolled} />
                      <NavLink to="/chatbot" icon="💬" label="Chat" isActive={isActive('/chatbot')} isScrolled={isScrolled} />
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
                      <NavLink to="/manager/stock" icon="📊" label="Stock" isActive={isActive('/manager/stock')} isScrolled={isScrolled} />
                    </>
                  )}
                  {user.role === 'doctor' && (
                    <>
                      <NavLink to="/" icon={<FiHome />} label="Home" isActive={isActive('/')} isScrolled={isScrolled} />
                      <NavLink to="/doctor/questions" icon="❓" label="Questions" isActive={isActive('/doctor/questions')} isScrolled={isScrolled} />
                    </>
                  )}
                </div>

                {/* User Menu */}
                <div className={`flex items-center space-x-2 border-l pl-4 ${
                  isScrolled ? 'border-gray-200' : 'border-white/20'
                }`}>
                  <div className={`text-sm hidden lg:block ${isScrolled ? 'text-gray-600' : ''}`}>
                    <div className={`font-semibold ${isScrolled ? 'text-gray-800' : 'text-white'}`}>
                      {user.first_name || user.username}
                    </div>
                    <div className={`text-xs ${isScrolled ? 'text-gray-500' : 'text-blue-100'}`}>
                      {user.role}
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      isScrolled 
                        ? 'hover:bg-gray-100 text-gray-600' 
                        : 'hover:bg-white/20 text-white'
                    }`}
                  >
                    <FiUser size={20} />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all duration-300 hover:scale-105"
                  >
                    <FiLogOut size={18} />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${
                    isScrolled 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                      : 'bg-white text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={`px-6 py-2 rounded-lg border-2 font-semibold transition-all duration-300 hover:scale-105 ${
                    isScrolled 
                      ? 'border-blue-600 text-blue-600 hover:bg-blue-50' 
                      : 'border-white text-white hover:bg-white hover:text-blue-600'
                  }`}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-all ${
              isScrolled ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/20 text-white'
            }`}
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden py-4 border-t animate-slide-down ${
            isScrolled ? 'border-gray-200 bg-white' : 'border-white/20'
          }`}>
            {user ? (
              <div className="space-y-2">
                {user.role === 'customer' && (
                  <>
                    <MobileNavLink to="/" icon={<FiHome />} label="Home" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                    <MobileNavLink to="/products" icon="🏪" label="Products" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                    <MobileNavLink to="/cart" icon={<FiShoppingCart />} label="Cart" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                    <MobileNavLink to="/orders" icon="📦" label="Orders" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                    <MobileNavLink to="/ask-doctor" icon="👨‍⚕️" label="Ask Doctor" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                    <MobileNavLink to="/chatbot" icon="💬" label="Chat" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <MobileNavLink to="/" icon={<FiHome />} label="Home" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                    <MobileNavLink to="/admin/users" icon="👥" label="Users" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                    <MobileNavLink to="/admin/categories" icon="📑" label="Categories" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                    <MobileNavLink to="/admin/products" icon="💊" label="Products" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                    <MobileNavLink to="/admin/batches" icon="📦" label="Batches" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                    <MobileNavLink to="/admin/orders" icon="🛒" label="Orders" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                    <MobileNavLink to="/admin/stock-requests" icon="📋" label="Stock Requests" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                  </>
                )}
                {user.role === 'store_manager' && (
                  <>
                    <MobileNavLink to="/" icon={<FiHome />} label="Home" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                    <MobileNavLink to="/manager/stock" icon="📊" label="Stock" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                  </>
                )}
                {user.role === 'doctor' && (
                  <>
                    <MobileNavLink to="/" icon={<FiHome />} label="Home" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                    <MobileNavLink to="/doctor/questions" icon="❓" label="Questions" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                  </>
                )}
                <div className={`pt-2 border-t ${isScrolled ? 'border-gray-200' : 'border-white/20'}`}>
                  <MobileNavLink to="/profile" icon={<FiUser />} label="Profile" onClick={() => setMobileMenuOpen(false)} isScrolled={isScrolled} />
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      isScrolled ? 'text-red-600 hover:bg-red-50' : 'text-white hover:bg-white/20'
                    }`}
                  >
                    <FiLogOut size={20} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-center font-semibold ${
                    isScrolled 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                      : 'bg-white text-blue-600'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-center font-semibold border-2 ${
                    isScrolled 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-white text-white'
                  }`}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, label, isActive, isScrolled }) => (
  <Link
    to={to}
    className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-all duration-300 ${
      isActive
        ? isScrolled 
          ? 'bg-blue-100 text-blue-600' 
          : 'bg-white text-blue-600 shadow-lg'
        : isScrolled 
          ? 'text-gray-600 hover:bg-gray-100' 
          : 'text-white hover:bg-white/20'
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span className="font-medium">{label}</span>
  </Link>
);

const MobileNavLink = ({ to, icon, label, onClick, isScrolled }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
      isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/20'
    }`}
  >
    <span className="text-xl">{icon}</span>
    <span>{label}</span>
  </Link>
);

export default Navbar;
