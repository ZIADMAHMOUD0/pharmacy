import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Decorative SVG capsule. Two halves with a teal/cyan tint and a soft inner highlight.
const Capsule = ({ size = 64, hue = 'teal' }) => {
  const top = hue === 'teal' ? '#5eead4' : '#67e8f9';
  const bottom = hue === 'teal' ? '#0d9488' : '#0e7490';
  return (
    <svg
      width={size}
      height={size * 0.42}
      viewBox="0 0 200 84"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={`g-top-${hue}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={top} stopOpacity="0.95" />
          <stop offset="100%" stopColor={top} stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={`g-bot-${hue}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={bottom} stopOpacity="0.9" />
          <stop offset="100%" stopColor={bottom} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="98" height="80" rx="40" fill={`url(#g-top-${hue})`} />
      <rect x="100" y="2" width="98" height="80" rx="40" fill={`url(#g-bot-${hue})`} />
      <rect x="20" y="14" width="40" height="10" rx="5" fill="white" opacity="0.35" />
    </svg>
  );
};

const PRESETS = [
  { top: '8%', left: '12%', size: 70, hue: 'teal', rotate: -18, delay: 0 },
  { top: '22%', left: '78%', size: 56, hue: 'cyan', rotate: 24, delay: 0.4 },
  { top: '60%', left: '8%', size: 48, hue: 'cyan', rotate: 40, delay: 0.8 },
  { top: '74%', left: '70%', size: 80, hue: 'teal', rotate: -12, delay: 1.2 },
  { top: '40%', left: '50%', size: 44, hue: 'cyan', rotate: 8, delay: 1.6 },
  { top: '15%', left: '45%', size: 38, hue: 'teal', rotate: -32, delay: 2.0 },
  { top: '82%', left: '38%', size: 52, hue: 'cyan', rotate: 16, delay: 2.4 },
];

const FloatingPills = ({ density = 'full', className = '' }) => {
  const items = useMemo(() => {
    if (density === 'sparse') return PRESETS.slice(0, 4);
    return PRESETS;
  }, [density]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {items.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 0, rotate: p.rotate }}
          animate={{
            opacity: [0, 0.7, 0.7, 0.5],
            y: [-12, 12, -12],
            rotate: [p.rotate, p.rotate + 6, p.rotate],
          }}
          transition={{
            duration: 8 + (i % 3) * 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
          style={{ position: 'absolute', top: p.top, left: p.left }}
          className="drop-shadow-2xl"
        >
          <Capsule size={p.size} hue={p.hue} />
        </motion.div>
      ))}

      {/* Soft particle dots */}
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={`d-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0], y: [0, -20, 0] }}
          transition={{ duration: 6 + (i % 4), repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: `${(i * 13) % 95}%`,
            left: `${(i * 23) % 95}%`,
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: i % 2 === 0 ? 'rgba(94, 234, 212, 0.6)' : 'rgba(103, 232, 249, 0.6)',
            filter: 'blur(0.5px)',
          }}
        />
      ))}
    </div>
  );
};

export default FloatingPills;
