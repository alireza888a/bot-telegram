import React from 'react';
import { GlassCard } from '../GlassCard';
import { HardDrive, Download, Upload, FileJson, AlertTriangle } from 'lucide-react';

interface BackupRestoreCardProps {
  handleBackup: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFactoryReset: () => void;
}

export const BackupRestoreCard: React.FC<BackupRestoreCardProps> = ({
  handleBackup,
  handleFileSelect,
  handleFactoryReset,
}) => {
  return (
    <GlassCard className="border-t-4 border-t-blue-500">
      <div className="flex items-center gap-2 mb-4">
        <HardDrive className="text-blue-400" />
        <h3 className="font-bold text-lg dark:text-white text-slate-800">مدیریت داده‌ها (پشتیبان‌گیری)</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={handleBackup}
          className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 text-green-400 rounded-lg group-hover:scale-110 transition-transform">
              <Download size={20} />
            </div>
            <div className="text-right">
              <div className="font-bold dark:text-white text-slate-800">دانلود فایل پشتیبان</div>
              <div className="text-[10px] text-slate-500">فرمت JSON شامل تمام تنظیمات</div>
            </div>
          </div>
          <FileJson size={20} className="text-slate-600" />
        </button>

        <label className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
              <Upload size={20} />
            </div>
            <div className="text-right">
              <div className="font-bold dark:text-white text-slate-800">بازگردانی اطلاعات</div>
              <div className="text-[10px] text-slate-500">آپلود فایل JSON و جایگزینی</div>
            </div>
          </div>
          <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
          <FileJson size={20} className="text-slate-600" />
        </label>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5">
        <button
          onClick={handleFactoryReset}
          className="w-full py-3 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <AlertTriangle size={16} />
          بازگشت به تنظیمات کارخانه (پاکسازی کامل)
        </button>
      </div>
    </GlassCard>
  );
};
