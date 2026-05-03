import React from 'react';
import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';

const TESTIMONIALS = [
  {
    name: 'Amira H.',
    role: 'Verified Customer',
    avatar: '/assets/images/avatars/testimonial-1.jpg',
    quote:
      'PharmaCare has changed the way I manage my family’s prescriptions. Refills arrive the same day and the pharmacists actually answer my questions.',
  },
  {
    name: 'Marcus W.',
    role: 'Verified Customer',
    avatar: '/assets/images/avatars/testimonial-2.jpg',
    quote:
      'I love how clean the interface is. Finding the right vitamins and seeing the active ingredients up front saves me a lot of second-guessing.',
  },
  {
    name: 'Dr. Lina K.',
    role: 'Pediatrician',
    avatar: '/assets/images/avatars/testimonial-3.jpg',
    quote:
      'Recommending PharmaCare to my patients is easy — the allergy checks and medication history are exactly what they need.',
  },
  {
    name: 'Yara S.',
    role: 'Verified Customer',
    avatar: '/assets/images/avatars/testimonial-4.jpg',
    quote:
      'Tracking orders is effortless and the chatbot helped me find an alternative the same evening when my pharmacy was out of stock.',
  },
  {
    name: 'Khalid R.',
    role: 'Verified Customer',
    avatar: '/assets/images/avatars/testimonial-5.jpg',
    quote:
      'A truly modern experience. The reminders for chronic medication keep me on track, and pricing is transparent.',
  },
  {
    name: 'Sara T.',
    role: 'Verified Customer',
    avatar: '/assets/images/avatars/testimonial-6.jpg',
    quote:
      'Customer support is genuinely available 24/7. I had a midnight question about my prescription and got a real answer in minutes.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const Avatar = ({ src, name }) => {
  const [error, setError] = React.useState(false);
  if (!src || error) {
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
        {(name || 'U').charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      width={48}
      height={48}
      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
      onError={() => setError(true)}
    />
  );
};

const Testimonials = () => {
  return (
    <section id="testimonials" className="bg-slate-50 dark:bg-slate-950 section-padding scroll-mt-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 text-sm font-medium mb-4">
            What customers say
          </span>
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-slate-800 dark:text-slate-100 mb-4">
            Loved by thousands
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Real stories from real customers who trust PharmaCare with their health.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((t) => (
            <motion.article
              key={t.name}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-soft hover:shadow-soft-xl border border-slate-100 dark:border-slate-800 transition-all"
            >
              <div className="flex items-center gap-1 mb-4 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Avatar src={t.avatar} name={t.name} />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{t.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t.role}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
