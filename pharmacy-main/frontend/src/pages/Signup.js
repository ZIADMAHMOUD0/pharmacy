import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiPhone, FiMapPin, FiArrowRight, FiCheck, FiUserPlus } from 'react-icons/fi';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const { signup } = useAuth();
  const navigate = useNavigate();

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
      alert('Account created successfully! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = passwordStrength(formData.password);
  const strengthColors = ['bg-slate-300', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-emerald-500'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-900">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: 'url(/assets/images/doctors-bg.jpeg)'}}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/95 via-slate-900/90 to-teal-900/95"></div>
          <div className="absolute inset-0 pattern-pharmacy opacity-30"></div>
        </div>
        
        {/* Animated blobs */}
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-teal-500/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        
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
              Join Our
              <br />
              <span className="text-cyan-400">Healthcare Family</span>
            </h1>
            
            <p className="text-xl text-white/70 mb-12 max-w-md">
              Create your account and start your journey to better health management.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              { icon: '🎁', text: 'Exclusive member discounts' },
              { icon: '📱', text: 'Track orders in real-time' },
              { icon: '💬', text: 'Direct doctor consultations' },
              { icon: '📋', text: 'Personal health records' },
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

      {/* Right Panel - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 py-12 overflow-y-auto">
        <div className="w-full max-w-lg">
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 mb-4 shadow-glow">
                <FiUserPlus className="text-white" size={28} />
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-2">Create Account</h2>
              <p className="text-white/50">Join PharmaCare today</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step >= s 
                      ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white' 
                      : 'bg-white/10 text-white/40'
                  }`}>
                    {s}
                  </div>
                  {s < 2 && (
                    <div className={`w-12 h-1 mx-1 rounded-full transition-all ${
                      step > s ? 'bg-gradient-to-r from-teal-500 to-cyan-500' : 'bg-white/10'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl mb-6 text-center animate-fade-in">
                <span className="flex items-center justify-center gap-2">
                  <span>⚠️</span> {error}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Username */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Username *</label>
                    <div className="relative group">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-teal-400 transition-colors" size={20} />
                      <input
                        type="text"
                        placeholder="Choose a username"
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Email *</label>
                    <div className="relative group">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-teal-400 transition-colors" size={20} />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* First & Last Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">First Name</label>
                      <input
                        type="text"
                        placeholder="First name"
                        className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Last Name</label>
                      <input
                        type="text"
                        placeholder="Last name"
                        className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold text-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 flex items-center justify-center gap-2 group shadow-glow hover:shadow-glow-lg mt-6"
                  >
                    Continue
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Phone */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Phone</label>
                    <div className="relative group">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-teal-400 transition-colors" size={20} />
                      <input
                        type="tel"
                        placeholder="Your phone number"
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Address</label>
                    <div className="relative group">
                      <FiMapPin className="absolute left-4 top-4 text-white/30 group-focus-within:text-teal-400 transition-colors" size={20} />
                      <textarea
                        placeholder="Your delivery address"
                        rows="2"
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all resize-none"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Password *</label>
                    <div className="relative group">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-teal-400 transition-colors" size={20} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    {/* Password strength indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                              strength >= i ? strengthColors[strength] : 'bg-white/10'
                            }`}></div>
                          ))}
                        </div>
                        <p className={`text-xs ${strengthColors[strength].replace('bg-', 'text-').replace('-500', '-400')}`}>
                          {strengthLabels[strength]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Confirm Password *</label>
                    <div className="relative group">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-teal-400 transition-colors" size={20} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                        value={formData.confirm_password}
                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                        required
                      />
                      {formData.password && formData.confirm_password && formData.password === formData.confirm_password && (
                        <FiCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-glow hover:shadow-glow-lg"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Account
                          <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-white/30 text-sm">or</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* Login Link */}
            <p className="text-center text-white/50">
              Already have an account?{' '}
              <Link to="/login" className="text-teal-400 font-semibold hover:text-teal-300 transition-colors">
                Sign In
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

export default Signup;
