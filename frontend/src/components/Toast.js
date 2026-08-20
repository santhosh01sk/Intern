import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-900/30';
      case 'info':
        return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30';
      default:
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="text-rose-500 shrink-0" size={18} />;
      case 'info':
        return <Info className="text-indigo-500 shrink-0" size={18} />;
      default:
        return <CheckCircle className="text-emerald-500 shrink-0" size={18} />;
    }
  };

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-xl border shadow-lg animate-fadeIn max-w-sm ${getStyles()}`}
      role="alert"
    >
      {getIcon()}
      <span className="text-xs font-bold leading-normal pr-4">{message}</span>
      <button 
        onClick={onClose} 
        className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
