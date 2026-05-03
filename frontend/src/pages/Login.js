import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiShield,
  FiAlertCircle,
  FiArrowLeft,
} from 'react-icons/fi';
import FloatingPills from '../components/auth/FloatingPills';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const redirectByRole = (u) => {
    if (u.role === 'customer') navigate('/products', { replace: true });
    else if (u.role === 'admin') navigate('/admin/users', { replace: true });
    else if (u.role === 'store_manager') navigate('/manager/stock', { replace: true });
    else if (u.role === 'doctor') navigate('/doctor/questions', { replace: true });
  };

  useEffect(() => {
    if (user) redirectByRole(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <div className="w-16 h-16 border-4 border-white/20 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-display">Redirecting...</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-900">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/assets/images/pharmacy-bg.jpeg)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/95 via-slate-900/90 to-cyan-900/95" />
          <div className="absolute inset-0 pattern-pharmacy opacity-30" />
        </div>

        {/* Animated blobs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-72 h-72 bg-teal-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl"
        />

        <FloatingPills />

        {/* Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
          }}
          className="relative z-10 flex flex-col justify-center px-16"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
            }}
            className="mb-8"
          >
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
          </motion.div>

          <div className="space-y-4">
            {[
              { icon: '🔒', text: 'Secure & encrypted data' },
              { icon: '⚡', text: 'Fast order processing' },
              { icon: '👨‍⚕️', text: '24/7 expert support' },
            ].map((item) => (
              <motion.div
                key={item.text}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
                }}
                className="flex items-center gap-4 text-white/80"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                  <span className="text-xl">{item.icon}</span>
                </div>
                <span>{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Mobile glow background */}
        <div className="lg:hidden absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
          <FloatingPills density="sparse" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.1 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-glow">
                <span className="text-2xl">💊</span>
              </div>
              <span className="text-2xl font-display font-bold text-white">PharmaCare</span>
            </div>
          </div>

          {/* Glass Card */}
          <div className="relative">
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-teal-500/40 via-cyan-500/20 to-transparent blur-md opacity-60" aria-hidden />
            <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-center mb-8"
              >
                <motion.div
                  initial={{ scale: 0.6, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.3 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 mb-4 shadow-glow"
                >
                  <FiShield className="text-white" size={28} />
                </motion.div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-white/50">Sign in to continue to your account</p>
              </motion.div>

              <AnimatePresence mode="popLayout">
                {error && (
                  <motion.div
                    key="err"
                    initial={{ opacity: 0, y: -8, x: 0 }}
                    animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                    className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl mb-6"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <FiAlertCircle size={18} />
                      {error}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Username Field */}
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="login-username">
                    Username
                  </label>
                  <div className="relative group">
                    <FiUser
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-teal-400 transition-colors"
                      size={20}
                    />
                    <input
                      id="login-username"
                      type="text"
                      autoComplete="username"
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
                  <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="login-password">
                    Password
                  </label>
                  <div className="relative group">
                    <FiLock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-teal-400 transition-colors"
                      size={20}
                    />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/80 transition-colors"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={showPassword ? 'off' : 'on'}
                          initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.6, rotate: 45 }}
                          transition={{ duration: 0.18 }}
                          className="inline-flex"
                        >
                          {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                        </motion.span>
                      </AnimatePresence>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold text-lg hover:from-teal-600 hover:to-cyan-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-glow hover:shadow-glow-lg mt-6 overflow-hidden"
                >
                  <span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                    aria-hidden
                  />
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-sm">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Register Link */}
              <p className="text-center text-white/50">
                Don&rsquo;t have an account?{' '}
                <Link
                  to="/signup"
                  className="text-teal-400 font-semibold hover:text-teal-300 transition-colors"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link
              to="/"
              className="text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-2"
            >
              <FiArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
