import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiPhone,
  FiMapPin,
  FiArrowRight,
  FiArrowLeft,
  FiCheck,
  FiUserPlus,
  FiAlertCircle,
} from 'react-icons/fi';
import FloatingPills from '../components/auth/FloatingPills';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

const stepVariants = {
  enter: (direction) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
};

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signup(formData);
      toast.success('Account created successfully! Redirecting to sign in…');
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  const goToStep = (target) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
  };

  const passwordStrength = (password) => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };

  const strength = passwordStrength(formData.password);
  const strengthColors = ['bg-slate-300', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-emerald-500'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthTextColor = strengthColors[strength].replace('bg-', 'text-').replace('-500', '-400');

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-900">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/assets/images/doctors-bg.jpeg)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/95 via-slate-900/90 to-teal-900/95" />
          <div className="absolute inset-0 pattern-pharmacy opacity-30" />
        </div>

        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 right-1/4 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-teal-500/30 rounded-full blur-3xl"
        />

        <FloatingPills />

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
              Join Our
              <br />
              <span className="text-cyan-400">Healthcare Family</span>
            </h1>

            <p className="text-xl text-white/70 mb-12 max-w-md">
              Create your account and start your journey to better health management.
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              { icon: '🎁', text: 'Exclusive member discounts' },
              { icon: '📱', text: 'Track orders in real-time' },
              { icon: '💬', text: 'Direct doctor consultations' },
              { icon: '📋', text: 'Personal health records' },
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

      {/* Right Panel - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 py-12 overflow-y-auto relative">
        <div className="lg:hidden absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
          <FloatingPills density="sparse" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.1 }}
          className="w-full max-w-lg relative z-10"
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
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-cyan-500/40 via-teal-500/20 to-transparent blur-md opacity-60" aria-hidden />
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
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 mb-4 shadow-glow"
                >
                  <FiUserPlus className="text-white" size={28} />
                </motion.div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Create Account</h2>
                <p className="text-white/50">Join PharmaCare today</p>
              </motion.div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center">
                    <motion.div
                      animate={{
                        scale: step === s ? 1.05 : 1,
                        boxShadow:
                          step === s ? '0 0 0 4px rgba(20, 184, 166, 0.3)' : '0 0 0 0 rgba(0,0,0,0)',
                      }}
                      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        step >= s
                          ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white'
                          : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {step > s ? <FiCheck size={14} /> : s}
                    </motion.div>
                    {s < 2 && (
                      <div className="w-12 h-1 mx-1 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={false}
                          animate={{ width: step > s ? '100%' : '0%' }}
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="popLayout">
                {error && (
                  <motion.div
                    key="err"
                    initial={{ opacity: 0, y: -8 }}
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

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="su-username">
                          Username *
                        </label>
                        <div className="relative group">
                          <FiUser
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-teal-400 transition-colors"
                            size={20}
                          />
                          <input
                            id="su-username"
                            type="text"
                            autoComplete="username"
                            placeholder="Choose a username"
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="su-email">
                          Email *
                        </label>
                        <div className="relative group">
                          <FiMail
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-teal-400 transition-colors"
                            size={20}
                          />
                          <input
                            id="su-email"
                            type="email"
                            autoComplete="email"
                            placeholder="Enter your email"
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="su-first">
                            First Name
                          </label>
                          <input
                            id="su-first"
                            type="text"
                            autoComplete="given-name"
                            placeholder="First name"
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="su-last">
                            Last Name
                          </label>
                          <input
                            id="su-last"
                            type="text"
                            autoComplete="family-name"
                            placeholder="Last name"
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          />
                        </div>
                      </div>

                      <motion.button
                        type="button"
                        onClick={() => goToStep(2)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold text-lg hover:from-teal-600 hover:to-cyan-600 transition-colors flex items-center justify-center gap-2 group shadow-glow hover:shadow-glow-lg mt-6"
                      >
                        Continue
                        <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="su-phone">
                          Phone
                        </label>
                        <div className="relative group">
                          <FiPhone
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-teal-400 transition-colors"
                            size={20}
                          />
                          <input
                            id="su-phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder="Your phone number"
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="su-address">
                          Address
                        </label>
                        <div className="relative group">
                          <FiMapPin
                            className="absolute left-4 top-4 text-white/30 group-focus-within:text-teal-400 transition-colors"
                            size={20}
                          />
                          <textarea
                            id="su-address"
                            autoComplete="street-address"
                            placeholder="Your delivery address"
                            rows="2"
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all resize-none"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="su-pwd">
                          Password *
                        </label>
                        <div className="relative group">
                          <FiLock
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-teal-400 transition-colors"
                            size={20}
                          />
                          <input
                            id="su-pwd"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="Create a password"
                            className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                        <AnimatePresence>
                          {formData.password && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-2 overflow-hidden"
                            >
                              <div className="flex gap-1 mb-1">
                                {[1, 2, 3, 4].map((i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{ originX: 0 }}
                                    className={`h-1 flex-1 rounded-full ${
                                      strength >= i ? strengthColors[strength] : 'bg-white/10'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className={`text-xs ${strengthTextColor}`}>{strengthLabels[strength]}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2" htmlFor="su-cpwd">
                          Confirm Password *
                        </label>
                        <div className="relative group">
                          <FiLock
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-teal-400 transition-colors"
                            size={20}
                          />
                          <input
                            id="su-cpwd"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="Confirm your password"
                            className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                            value={formData.confirm_password}
                            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                            required
                          />
                          <AnimatePresence>
                            {formData.password &&
                              formData.confirm_password &&
                              formData.password === formData.confirm_password && (
                                <motion.span
                                  key="match"
                                  initial={{ opacity: 0, scale: 0.4 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.4 }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400"
                                >
                                  <FiCheck size={20} />
                                </motion.span>
                              )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <motion.button
                          type="button"
                          onClick={() => goToStep(1)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                        >
                          <FiArrowLeft />
                          Back
                        </motion.button>
                        <motion.button
                          type="submit"
                          disabled={loading}
                          whileHover={{ scale: loading ? 1 : 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative overflow-hidden flex-1 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-glow hover:shadow-glow-lg"
                        >
                          <span
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                            aria-hidden
                          />
                          {loading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              Create Account
                              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-sm">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <p className="text-center text-white/50">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-teal-400 font-semibold hover:text-teal-300 transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>

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

export default Signup;
