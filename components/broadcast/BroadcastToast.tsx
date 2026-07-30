import React, { useEffect } from 'react';

interface BroadcastToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const BroadcastToast: React.FC<BroadcastToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      <span>{message}</span>
    </div>
  );
};
