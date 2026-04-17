import { useEffect, useState } from 'react';

const Toast = ({ 
  id, 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose?.(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  const typeStyles = {
    success: {
      bg: 'bg-emerald-900/90',
      border: 'border-emerald-700',
      icon: '✓',
      iconColor: 'text-emerald-400',
    },
    error: {
      bg: 'bg-rose-900/90',
      border: 'border-rose-700',
      icon: '✕',
      iconColor: 'text-rose-400',
    },
    info: {
      bg: 'bg-blue-900/90',
      border: 'border-blue-700',
      icon: 'ℹ',
      iconColor: 'text-blue-400',
    },
    bid: {
      bg: 'bg-amber-900/90',
      border: 'border-amber-700',
      icon: '💰',
      iconColor: 'text-amber-400',
    },
    hired: {
      bg: 'bg-green-900/90',
      border: 'border-green-700',
      icon: '🎉',
      iconColor: 'text-green-400',
    },
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`${style.bg} border ${style.border} rounded-lg p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className="flex gap-3">
        <div className={`${style.iconColor} text-xl flex-shrink-0 flex items-center justify-center w-6 h-6`}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          {title && <h3 className="font-semibold text-white text-sm">{title}</h3>}
          {message && <p className="text-zinc-200 text-sm mt-1">{message}</p>}
        </div>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => onClose?.(id), 300);
          }}
          className="flex-shrink-0 text-zinc-400 hover:text-white transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
