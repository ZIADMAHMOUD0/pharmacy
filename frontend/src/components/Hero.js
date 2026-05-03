import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowRight,
  FiCheckCircle,
  FiMessageCircle,
  FiShield,
  FiTruck,
  FiUsers,
} from 'react-icons/fi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const STATS = [
  { value: '10K+', label: 'Happy Customers' },
  { value: '500+', label: 'Products' },
  { value: '50+', label: 'Expert Doctors' },
  { value: '24/7', label: 'Support' },
];

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-slate-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: 'url(/assets/images/hero-pharmacist.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/85 to-teal-900/80" />
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl animate-blob bg-teal-500/20" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-blob animation-delay-2000 bg-cyan-500/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl animate-blob animation-delay-1000 bg-orange-500/10" />
      </div>

      <div className="absolute inset-0 pattern-pharmacy opacity-50" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative container mx-auto px-6 py-20 lg:py-32"
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 border border-white/20 text-sm font-medium mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Trusted by 10,000+ customers
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl lg:text-7xl font-display font-bold mb-6 leading-tight tracking-tight text-white"
            >
              Order your
              <br />
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                medicine easily
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl lg:text-2xl mb-10 max-w-xl text-white/70"
            >
              Quality medicines, expert consultations, and lightning-fast delivery — all in one
              beautifully designed platform.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-16"
            >
              <Link
                to="/login"
                className="group relative px-8 py-4 bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-glow hover:shadow-glow-lg transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started
                  <FiArrowRight
                    className="group-hover:translate-x-1 transition-transform"
                    size={20}
                  />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>

              <Link
                to="/signup"
                className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-2xl font-bold text-lg border-2 border-white/20 hover:bg-white/20 hover:border-white/40 transform hover:scale-105 transition-all duration-300"
              >
                Create Account
              </Link>
            </motion.div>

            <motion.div
              variants={containerVariants}
              className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-6"
            >
              {STATS.map((stat) => (
                <motion.div key={stat.label} variants={itemVariants} className="text-center group">
                  <div className="text-3xl font-display font-bold text-white">{stat.value}</div>
                  <div className="text-white/50 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            className="hidden lg:block"
          >
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, x: -20, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="absolute -top-8 -left-8 p-4 rounded-2xl shadow-soft-xl bg-white/10 backdrop-blur-xl border border-white/20 animate-float"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white">
                    <FiCheckCircle size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Order Delivered</p>
                    <p className="text-sm text-white/60">2 minutes ago</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.8, type: 'spring' }}
                className="absolute -bottom-8 -right-8 p-4 rounded-2xl shadow-soft-xl bg-white/10 backdrop-blur-xl border border-white/20 animate-float animation-delay-1000"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white">
                    <FiMessageCircle size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Dr. Sarah replied</p>
                    <p className="text-sm text-white/60">Just now</p>
                  </div>
                </div>
              </motion.div>

              <div className="relative rounded-3xl p-8 shadow-soft-xl bg-white/10 backdrop-blur-xl border border-white/20">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    {
                      icon: <FiShield size={26} />,
                      label: 'Secure',
                      count: 'HIPAA',
                      color: 'from-teal-500 to-cyan-500',
                    },
                    {
                      icon: <FiTruck size={26} />,
                      label: 'Fast Delivery',
                      count: 'Same-day',
                      color: 'from-orange-400 to-amber-500',
                    },
                    {
                      icon: <FiUsers size={26} />,
                      label: 'Expert Doctors',
                      count: '100+',
                      color: 'from-cyan-500 to-sky-500',
                    },
                    {
                      icon: <FiCheckCircle size={26} />,
                      label: 'Verified',
                      count: '500+ Meds',
                      color: 'from-emerald-500 to-green-500',
                    },
                  ].map((item) => (
                    <motion.div
                      key={item.label}
                      whileHover={{ y: -4 }}
                      className="group p-5 rounded-2xl transition-all duration-300 bg-white/5 hover:bg-white/15"
                    >
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 text-white shadow-lg group-hover:scale-110 transition-transform`}
                      >
                        {item.icon}
                      </div>
                      <div className="text-xl font-display font-bold text-white">{item.count}</div>
                      <div className="text-white/60 text-sm">{item.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
