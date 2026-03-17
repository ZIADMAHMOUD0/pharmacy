import React from 'react';
import { FiAlertTriangle, FiTrash2, FiCheck, FiX, FiInfo } from 'react-icons/fi';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'info', 'success'
  loading = false
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    warning: {
      icon: <FiAlertTriangle size={28} />,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      confirmBg: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
      confirmShadow: 'shadow-amber-500/30',
    },
    danger: {
      icon: <FiTrash2 size={28} />,
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      confirmBg: 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600',
      confirmShadow: 'shadow-rose-500/30',
    },
    info: {
      icon: <FiInfo size={28} />,
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
      confirmBg: 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600',
      confirmShadow: 'shadow-cyan-500/30',
    },
    success: {
      icon: <FiCheck size={28} />,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      confirmBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600',
      confirmShadow: 'shadow-emerald-500/30',
    },
  };

  const config = typeConfig[type] || typeConfig.warning;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all w-full max-w-md animate-scale-in border border-slate-100">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <FiX size={20} />
          </button>

          <div className="p-8">
            {/* Icon */}
            <div className={`mx-auto w-16 h-16 rounded-2xl ${config.iconBg} ${config.iconColor} flex items-center justify-center mb-5`}>
              {config.icon}
            </div>

            {/* Title */}
            <h3 className="text-2xl font-display font-bold text-center text-slate-800 mb-3">
              {title}
            </h3>

            {/* Message */}
            <p className="text-center text-slate-500 mb-8">
              {message}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-5 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-200 disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 px-5 py-3.5 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 ${config.confirmBg} shadow-lg hover:shadow-xl ${config.confirmShadow}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
