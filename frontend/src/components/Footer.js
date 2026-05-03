import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
} from 'react-icons/fi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const colVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="container mx-auto px-6 py-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <motion.div variants={colVariants}>
            <Link to="/" className="flex items-center gap-3 mb-4 group">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-glow group-hover:scale-110 transition-transform">
                <span className="text-2xl">💊</span>
              </div>
              <span className="text-2xl font-display font-bold text-white">
                Pharma<span className="text-teal-400">Care</span>
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed mb-6">
              Quality medicines, expert consultations, and lightning-fast delivery — your trusted
              healthcare partner.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: <FiFacebook size={16} />, label: 'Facebook', href: '#' },
                { icon: <FiTwitter size={16} />, label: 'Twitter', href: '#' },
                { icon: <FiInstagram size={16} />, label: 'Instagram', href: '#' },
                { icon: <FiLinkedin size={16} />, label: 'LinkedIn', href: '#' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-teal-500 flex items-center justify-center transition-colors text-slate-300 hover:text-white"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={colVariants}>
            <h3 className="text-white font-display font-bold text-lg mb-5">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="hover:text-teal-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-teal-400 transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-teal-400 transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-teal-400 transition-colors">
                  My Profile
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Customer Care */}
          <motion.div variants={colVariants}>
            <h3 className="text-white font-display font-bold text-lg mb-5">Customer Care</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/ask-doctor" className="hover:text-teal-400 transition-colors">
                  Ask a Doctor
                </Link>
              </li>
              <li>
                <Link to="/medical-history" className="hover:text-teal-400 transition-colors">
                  Medical History
                </Link>
              </li>
              <li>
                <Link to="/chatbot" className="hover:text-teal-400 transition-colors">
                  AI Chat Assistant
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-teal-400 transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={colVariants}>
            <h3 className="text-white font-display font-bold text-lg mb-5">Get in Touch</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <FiMapPin className="text-teal-400 mt-1 flex-shrink-0" size={16} />
                <span>
                  123 Wellness Avenue
                  <br />
                  Cairo, Egypt
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="text-teal-400 flex-shrink-0" size={16} />
                <a href="tel:+201000000000" className="hover:text-teal-400 transition-colors">
                  +20 100 000 0000
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="text-teal-400 flex-shrink-0" size={16} />
                <a
                  href="mailto:hello@pharmacare.example"
                  className="hover:text-teal-400 transition-colors"
                >
                  hello@pharmacare.example
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FiClock className="text-teal-400 flex-shrink-0" size={16} />
                <span>24/7 Online Support</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </motion.div>

      <div className="border-t border-slate-800">
        <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>&copy; {year} PharmaCare. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-500">We accept:</span>
            <div className="flex items-center gap-2">
              {['Visa', 'Mastercard', 'PayPal', 'ApplePay'].map((m) => (
                <span
                  key={m}
                  className="px-3 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
