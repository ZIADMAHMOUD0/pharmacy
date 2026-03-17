import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiXCircle, FiInfo, FiAlertCircle, FiX } from 'react-icons/fi';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const config = {
    success: {
      icon: <FiCheckCircle size={22} />,
      bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/30',
    },
    error: {
      icon: <FiXCircle size={22} />,
      bg: 'bg-gradient-to-r from-rose-500 to-red-500',
      shadow: 'shadow-rose-500/30',
    },
    info: {
      icon: <FiInfo size={22} />,
      bg: 'bg-gradient-to-r from-cyan-500 to-sky-500',
      shadow: 'shadow-cyan-500/30',
    },
    warning: {
      icon: <FiAlertCircle size={22} />,
      bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/30',
    },
  };

  const currentConfig = config[type] || config.success;

  return (
    <div
      className={`${currentConfig.bg} text-white rounded-2xl shadow-xl ${currentConfig.shadow} min-w-[320px] max-w-md overflow-hidden transform transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
      style={{
        animation: !isExiting ? 'slideInRight 0.3s ease-out' : undefined,
      }}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Icon */}
        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
          {currentConfig.icon}
        </div>
        
        {/* Message */}
        <p className="flex-1 font-medium">{message}</p>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
        >
          <FiX size={18} />
        </button>
      </div>
      
      {/* Progress bar */}
      {duration > 0 && (
        <div className="h-1 w-full bg-black/10">
          <div 
            className="h-full bg-white/40"
            style={{
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;
