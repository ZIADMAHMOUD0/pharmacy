import React from 'react';
import { motion } from 'framer-motion';

// Lightweight wordmarks rendered as styled text — no external logo assets needed.
// Replace with real SVGs whenever you want; the layout stays identical.
const BRANDS = [
  { name: 'Pfizer', accent: 'tracking-tight italic' },
  { name: 'Bayer', accent: 'tracking-widest' },
  { name: 'Novartis', accent: 'tracking-normal' },
  { name: 'GSK', accent: 'tracking-[0.4em]' },
  { name: 'Roche', accent: 'tracking-tight' },
  { name: 'Sanofi', accent: 'tracking-wide' },
  { name: 'Abbott', accent: 'tracking-normal italic' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 140, damping: 18 } },
};

const TrustedBrands = () => {
  return (
    <section id="brands" className="relative bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 scroll-mt-24">
      <div className="container mx-auto px-6 py-10">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 mb-6">
          Trusted by leading pharmaceutical brands
        </p>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-14"
        >
          {BRANDS.map((b) => (
            <motion.span
              key={b.name}
              variants={itemVariants}
              whileHover={{ scale: 1.05, color: '#0f766e' }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className={`font-display font-semibold text-xl text-slate-400 hover:text-teal-700 dark:text-slate-500 dark:hover:text-teal-400 transition-colors cursor-default ${b.accent}`}
            >
              {b.name}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustedBrands;
