import React from 'react';
import { GlassCard } from '../GlassCard';
import { Database, Info, RefreshCw, CheckCircle, AlertTriangle, Link as LinkIcon } from 'lucide-react';

interface DatabaseChannelCardProps {
  dbChannel: string;
  setDbChannel: (val: string) => void;
  handleSaveDb: () => void;
  isCheckingDb: boolean;
  dbStatus: 'idle' | 'success' | 'error';
  statusMsg: string;
}

export const DatabaseChannelCard: React.FC<DatabaseChannelCardProps> = ({
  dbChannel,
  setDbChannel,
  handleSaveDb,
  isCheckingDb,
  dbStatus,
  statusMsg,
}) => {
  return (
    <GlassCard className="border-t-4 border-t-purple-500">
      <div className="flex items-center gap-2 mb-4">
        <Database className="text-purple-400" />
        <h3 className="font-bold text-lg dark:text-white text-slate-800">کانال دیتابیس (فضای نامحدود)</h3>
      </div>

      <div className="text-sm text-slate-400 mb-6 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
        <p className="mb-2">⚠️ برای جلوگیری از پر شدن حافظه مرورگر، تمام عکس‌ها و فیلم‌ها باید در یک <b>کانال خصوصی تلگرام</b> ذخیره شوند.</p>
        <ol className="list-decimal list-inside space-y-1 text-slate-300">
          <li>یک کانال خصوصی بسازید.</li>
          <li>ربات خود را در آن کانال <b>ادمین</b> کنید (دسترسی پست).</li>
          <li><b>آیدی عددی</b> کانال (شروع با -100) را وارد کنید.</li>
        </ol>
        <div className="mt-2 flex items-start gap-1 text-[10px] text-blue-300 bg-blue-500/10 p-2 rounded">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>نکته: لینک‌های دعوت (t.me/+) کار نمی‌کنند. آیدی عددی را از تلگرام وب یا @username_to_id_bot پیدا کنید.</span>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-xs text-slate-500">آیدی عددی (-100...) یا یوزرنیم (@)</label>
        <div className="flex gap-2">
          <input
            value={dbChannel}
            onChange={(e) => setDbChannel(e.target.value)}
            placeholder="-100123456789 یا @MyPublicChannel"
            className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 text-white dir-ltr text-left font-mono outline-none focus:border-purple-500 transition-colors"
            dir="ltr"
          />
          <button
            onClick={handleSaveDb}
            disabled={isCheckingDb || !dbChannel}
            className={`px-4 rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors ${dbStatus === 'success' ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-500'} text-white`}
          >
            {isCheckingDb ? <RefreshCw className="animate-spin" /> : <CheckCircle />}
          </button>
        </div>

        {/* Status Message (If Check clicked) */}
        {statusMsg && (
          <div className={`text-xs p-3 rounded-lg flex items-center gap-2 ${dbStatus === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : (dbStatus === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400')}`}>
            {dbStatus === 'error' && <AlertTriangle size={14} />}
            {statusMsg}
          </div>
        )}

        {/* Persistent Success Indicator (If loaded from storage) */}
        {dbStatus === 'success' && !statusMsg && (
          <div className="flex items-center gap-2 text-[10px] text-green-400 bg-green-500/10 p-2 rounded border border-green-500/20 mt-2">
            <LinkIcon size={12} />
            <span>کانال متصل است و در حافظه ذخیره شده.</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
