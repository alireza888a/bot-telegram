import React from 'react';
import { GlassCard } from '../GlassCard';
import { UserCog, Plus } from 'lucide-react';

interface AdminSupportCardProps {
  adminChatId: string;
  setAdminChatId: (val: string) => void;
  supportChatId: string;
  setSupportChatId: (val: string) => void;
  addSupportButtonToRootMenu: () => void;
}

export const AdminSupportCard: React.FC<AdminSupportCardProps> = ({
  adminChatId,
  setAdminChatId,
  supportChatId,
  setSupportChatId,
  addSupportButtonToRootMenu,
}) => {
  return (
    <GlassCard className="border-t-4 border-t-emerald-500">
      <div className="flex items-center gap-2 mb-4">
        <UserCog className="text-emerald-400" />
        <h3 className="font-bold text-lg dark:text-white text-slate-800">اعلان سفارش‌ها و پشتیبانی ادمین</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">آیدی عددی ادمین (اختیاری)</label>
          <input
            value={adminChatId}
            onChange={(e) => setAdminChatId(e.target.value)}
            placeholder="مثال: 123456789"
            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white dir-ltr text-left font-mono outline-none focus:border-emerald-500 transition-colors"
            dir="ltr"
          />
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            اگه این رو پر کنی، هر سفارش جدید (با عکس فیش پرداخت) مستقیم به همین آیدی عددی توی تلگرام هم ارسال میشه — جدا از کانال دیتابیس، حتی اگه کانالی تنظیم نکرده باشی.
          </p>
        </div>

        <div className="pt-4 border-t border-white/5 space-y-3">
          <label className="block text-xs font-bold text-slate-300 mb-1.5">آیدی عددی پشتیبانی (اختیاری)</label>
          <input
            value={supportChatId}
            onChange={(e) => setSupportChatId(e.target.value)}
            placeholder="مثال: 987654321"
            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white dir-ltr text-left font-mono outline-none focus:border-emerald-500 transition-colors"
            dir="ltr"
          />
          <p className="text-xs text-slate-400 leading-relaxed">
            وقتی خریدارهای ربات دستور /support رو بزنن یا دکمه‌ی پشتیبانی رو لمس کنن، پیامشون مستقیم به همین آیدی میرسه — جدا از اعلان سفارش‌ها. اگه خالی بمونه، همون آیدی عددی ادمین استفاده میشه.
          </p>

          <button
            type="button"
            onClick={addSupportButtonToRootMenu}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-2 mt-2 w-full md:w-auto"
          >
            <Plus size={16} />
            <span>افزودن دکمه‌ی پشتیبانی به منوی اصلی</span>
          </button>
        </div>
      </div>
    </GlassCard>
  );
};
