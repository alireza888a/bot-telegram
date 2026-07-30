import React from 'react';
import { RefreshCw } from 'lucide-react';

interface RestoreBackupModalProps {
  showRestoreModal: boolean;
  confirmRestore: () => void;
  cancelRestore: () => void;
}

export const RestoreBackupModal: React.FC<RestoreBackupModalProps> = ({
  showRestoreModal,
  confirmRestore,
  cancelRestore,
}) => {
  if (!showRestoreModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-blue-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 text-blue-500 mb-4 bg-blue-500/10 p-3 rounded-xl w-fit">
          <RefreshCw size={24} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">بازگردانی اطلاعات</h3>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          با بازگردانی نسخه پشتیبان، <b>تمام اطلاعات فعلی شما پاک شده و توسط فایل جدید جایگزین می‌شود.</b> آیا از این کار مطمئنید؟
        </p>
        <div className="flex gap-3">
          <button
            onClick={confirmRestore}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            بازگردانی
          </button>
          <button
            onClick={cancelRestore}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};
