import React from 'react';
import { GlassCard } from '../GlassCard';
import { BarChart3, UserX } from 'lucide-react';

interface ProgressReportCardProps {
  progress: number;
  showReport: boolean;
  isSending: boolean;
  isPaused: boolean;
  stats: {
    total: number;
    sent: number;
    blocked: number;
    failed: number;
  };
}

export const ProgressReportCard: React.FC<ProgressReportCardProps> = ({
  progress,
  showReport,
  isSending,
  isPaused,
  stats,
}) => {
  if (progress <= 0 && !showReport) return null;

  return (
    <GlassCard className="!p-4 bg-black/40 border-t-4 border-t-green-500">
      {isSending ? (
        <>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-white flex items-center gap-2 animate-pulse">در حال ارسال به {stats.total} نفر...</span>
            <span className="text-xs font-mono text-blue-300">{progress}%</span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5 mb-4">
            <div className={`h-full transition-all duration-300 relative ${isPaused ? 'bg-yellow-500' : 'bg-gradient-to-r from-green-500 to-blue-500'}`} style={{ width: `${progress}%` }}></div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div><span className="text-green-400 font-bold">{stats.sent}</span> موفق</div>
            <div><span className="text-orange-400 font-bold">{stats.blocked}</span> بلاک</div>
            <div><span className="text-red-400 font-bold">{stats.failed}</span> خطا</div>
          </div>
        </>
      ) : showReport ? (
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
            <BarChart3 size={16} className="text-green-400"/>
            <span className="font-bold text-sm text-white">گزارش نهایی ارسال</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-500/10 rounded-lg p-2"><div className="text-lg font-bold text-green-400">{stats.sent}</div><div className="text-[10px]">موفق</div></div>
            <div className="bg-orange-500/10 rounded-lg p-2"><div className="text-lg font-bold text-orange-400">{stats.blocked}</div><div className="text-[10px]">بلاک (حذف شد)</div></div>
            <div className="bg-red-500/10 rounded-lg p-2"><div className="text-lg font-bold text-red-400">{stats.failed}</div><div className="text-[10px]">خطا</div></div>
          </div>
          {stats.blocked > 0 && (
            <div className="mt-3 text-[10px] text-orange-400 bg-orange-500/10 p-2 rounded flex items-center gap-2">
              <UserX size={12}/>
              <span>{stats.blocked} کاربر بلاک کننده به صورت خودکار از لیست حذف شدند تا سرعت ارسال افزایش یابد.</span>
            </div>
          )}
        </div>
      ) : null}
    </GlassCard>
  );
};
