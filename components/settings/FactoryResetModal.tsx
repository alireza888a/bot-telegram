import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface FactoryResetModalProps {
  showResetModal: boolean;
  confirmFactoryReset: () => void;
  setShowResetModal: (val: boolean) => void;
}

export const FactoryResetModal: React.FC<FactoryResetModalProps> = ({
  showResetModal,
  confirmFactoryReset,
  setShowResetModal,
}) => {
  if (!showResetModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-red-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 text-red-500 mb-4 bg-red-500/10 p-3 rounded-xl w-fit">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">بازگشت به تنظیمات کارخانه</h3>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          آیا مطمئن هستید؟ تمام کانال‌ها، منوها، پیام‌ها و تنظیمات <b>برای همیشه</b> پاک خواهند شد و این عملیات غیرقابل بازگشت است.
        </p>
        <div className="flex gap-3">
          <button
            onClick={confirmFactoryReset}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            بله، پاکسازی شود
          </button>
          <button
            onClick={() => setShowResetModal(false)}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};
