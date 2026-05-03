import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { categoryAPI } from '../services/api';

// Try a name-based match first (so "Vitamins" gets the vitamins image),
// then fall back to cycling through the pool by index so every category
// still gets a distinct visual even if its name doesn't match a keyword.
const CATEGORY_IMAGE_HINTS = [
  { match: /prescription|rx/i, image: '/assets/images/categories/prescription.jpg' },
  { match: /otc|over[-\s]?the[-\s]?counter/i, image: '/assets/images/categories/otc.jpg' },
  { match: /vitamin|supplement/i, image: '/assets/images/categories/vitamins.jpg' },
  { match: /personal|skin|hygiene|beauty/i, image: '/assets/images/categories/personal-care.jpg' },
  { match: /baby|child|infant|kids/i, image: '/assets/images/categories/baby.jpg' },
  { match: /device|equipment|monitor|medical/i, image: '/assets/images/categories/medical-devices.jpg' },
];

const IMAGE_POOL = [
  '/assets/images/categories/prescription.jpg',
  '/assets/images/categories/otc.jpg',
  '/assets/images/categories/vitamins.jpg',
  '/assets/images/categories/personal-care.jpg',
  '/assets/images/categories/baby.jpg',
  '/assets/images/categories/medical-devices.jpg',
];

const DEFAULT_IMAGE = IMAGE_POOL[1];

const imageFor = (name = '', index = 0) => {
  const hit = CATEGORY_IMAGE_HINTS.find((h) => h.match.test(name));
  if (hit) return hit.image;
  return IMAGE_POOL[index % IMAGE_POOL.length];
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const CategoriesShowcase = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    categoryAPI
      .getAll()
      .then((res) => {
        if (mounted) setCategories(res.data || []);
      })
      .catch(() => {
        // Quietly degrade — this is a marketing surface, not a critical flow.
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Show top 6 only on the home page teaser.
  const displayed = categories.slice(0, 6);

  if (!loading && displayed.length === 0) return null;

  return (
    <section id="categories" className="bg-white dark:bg-slate-900 section-padding scroll-mt-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 text-sm font-medium mb-4">
            Browse Categories
          </span>
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-slate-800 dark:text-slate-100 mb-4">
            Everything for your health
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            From prescription medicines to wellness essentials — find exactly what you need.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-6"
        >
          {(loading ? Array.from({ length: 6 }) : displayed).map((cat, idx) => {
            if (!cat) {
              return (
                <div
                  key={idx}
                  className="h-44 rounded-2xl skeleton border border-slate-100 animate-pulse"
                />
              );
            }
            return (
              <motion.div key={cat.id} variants={itemVariants}>
                <Link
                  to={`/products?category=${cat.id}`}
                  className="group relative block overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-soft-xl transition-all duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={imageFor(cat.name, idx)}
                      alt={cat.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_IMAGE;
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between">
                    <div>
                      <h3 className="font-display font-bold text-xl text-white">{cat.name}</h3>
                      {typeof cat.product_count === 'number' && (
                        <p className="text-white/70 text-sm">{cat.product_count} products</p>
                      )}
                    </div>
                    <span className="w-10 h-10 rounded-full bg-white/90 text-teal-600 flex items-center justify-center transform group-hover:translate-x-1 transition-transform">
                      <FiArrowRight />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default CategoriesShowcase;
