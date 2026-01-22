import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield } from 'react-icons/fi';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const redirectByRole = (user) => {
    if (user.role === 'customer') navigate('/products', { replace: true });
    else if (user.role === 'admin') navigate('/admin/users', { replace: true });
    else if (user.role === 'store_manager') navigate('/manager/stock', { replace: true });
    else if (user.role === 'doctor') navigate('/doctor/questions', { replace: true });
  };

  useEffect(() => {
    if (user) {
      redirectByRole(user);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const loggedInUser = await login(credentials);
      redirectByRole(loggedInUser);
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/20 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-display">Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-900">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: 'url(/assets/images/pharmacy-bg.jpeg)'}}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/95 via-slate-900/90 to-cyan-900/95"></div>
          <div className="absolute inset-0 pattern-pharmacy opacity-30"></div>
        </div>
        
        {/* Animated blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-teal-500/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-glow">
                <span className="text-3xl">💊</span>
              </div>
              <span className="text-3xl font-display font-bold text-white">PharmaCare</span>
            </div>
            
            <h1 className="text-5xl font-display font-bold text-white mb-6 leading-tight">
              Your Health Journey
              <br />
              <span className="text-teal-400">Starts Here</span>
            </h1>
            
            <p className="text-xl text-white/70 mb-12 max-w-md">
              Access quality healthcare services, track your medications, and connect with experts.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
              { icon: '🔒', text: 'Secure & encrypted data' },
              { icon: '⚡', text: 'Fast order processing' },
              { icon: '👨‍⚕️', text: '24/7 expert support' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-white/80">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <span className="text-xl">{item.icon}</span>
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-glow">
                <span className="text-2xl">💊</span>
              </div>
              <span className="text-2xl font-display font-bold text-white">PharmaCare</span>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 mb-4 shadow-glow">
                <FiShield className="text-white" size={28} />
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-white/50">Sign in to continue to your account</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl mb-6 text-center animate-fade-in">
                <span className="flex items-center justify-center gap-2">
                  <span>⚠️</span> {error}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Username</label>
                <div className="relative group">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-teal-400 transition-colors" size={20} />
                  <input
                    type="text"
                    placeholder="Enter your username"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Password</label>
                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-teal-400 transition-colors" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold text-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-glow hover:shadow-glow-lg mt-6"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-white/30 text-sm">or</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* Register Link */}
            <p className="text-center text-white/50">
              Don't have an account?{' '}
              <Link to="/signup" className="text-teal-400 font-semibold hover:text-teal-300 transition-colors">
                Create one
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link to="/" className="text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
