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
      bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
      iconBg: 'bg-white/20',
      progressBg: 'bg-white/30',
    },
    error: {
      icon: <FiXCircle size={22} />,
      bg: 'bg-gradient-to-r from-red-500 to-rose-500',
      iconBg: 'bg-white/20',
      progressBg: 'bg-white/30',
    },
    info: {
      icon: <FiInfo size={22} />,
      bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      iconBg: 'bg-white/20',
      progressBg: 'bg-white/30',
    },
    warning: {
      icon: <FiAlertCircle size={22} />,
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      iconBg: 'bg-white/20',
      progressBg: 'bg-white/30',
    },
  };

  const currentConfig = config[type] || config.success;

  return (
    <div
      className={`${currentConfig.bg} text-white rounded-xl shadow-2xl min-w-[320px] max-w-md overflow-hidden transform transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
      style={{
        animation: !isExiting ? 'slideInRight 0.3s ease-out' : undefined,
      }}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Icon */}
        <div className={`${currentConfig.iconBg} p-2 rounded-lg`}>
          {currentConfig.icon}
        </div>
        
        {/* Message */}
        <p className="flex-1 font-medium text-sm">{message}</p>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <FiX size={18} />
        </button>
      </div>
      
      {/* Progress bar */}
      {duration > 0 && (
        <div className="h-1 w-full bg-black/10">
          <div 
            className={`h-full ${currentConfig.progressBg}`}
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
