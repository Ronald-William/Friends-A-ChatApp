import { useEffect } from 'react';

export default function Toast({ message, type = 'error', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    error: 'bg-red-500/90 border-red-600',
    success: 'bg-green-500/90 border-green-600',
    warning: 'bg-yellow-500/90 border-yellow-600',
    info: 'bg-blue-500/90 border-blue-600'
  };

  const icons = {
    error: '✗',
    success: '✓',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${styles[type]} border rounded-lg p-4 shadow-lg animate-slide-in max-w-md`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{icons[type]}</span>
        <div className="flex-1">
          <p className="text-white font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}