import React from 'react';
import { MessageSquare, CheckCircle2, Loader2, Send } from 'lucide-react';

export interface SupportTabProps {
  supportText: string;
  setSupportText: (val: string) => void;
  supportSending: boolean;
  supportSuccess: boolean;
  handleSupportSubmit: (e: React.FormEvent) => void;
}

export const SupportTab: React.FC<SupportTabProps> = ({
  supportText,
  setSupportText,
  supportSending,
  supportSuccess,
  handleSupportSubmit
}) => {
  return (
    <div className="space-y-4 animate-fade-in max-w-lg mx-auto">
      <div className="bg-[#151c2c]/80 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 border-b border-white/5 pb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">پشتیبانی و ارتباط با مدیریت</h2>
            <p className="text-[11px] text-slate-400">سوال یا مشکل خود را مطرح کنید تا پاسخ داده شود.</p>
          </div>
        </div>

        {supportSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed flex items-start gap-2 animate-fade-in">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-400" />
            <span>✅ پیام شما ثبت شد، به‌زودی از داخل ربات پاسخ داده می‌شود.</span>
          </div>
        )}

        <form onSubmit={handleSupportSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">متن پیام یا درخواست شما</label>
            <textarea
              rows={5}
              value={supportText}
              onChange={(e) => setSupportText(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
              required
            />
          </div>

          <button
            type="submit"
            disabled={supportSending || !supportText.trim()}
            className="w-full py-3 bg-gradient-to-l from-blue-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            {supportSending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>در حال ارسال...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>ارسال پیام پشتیبانی</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
