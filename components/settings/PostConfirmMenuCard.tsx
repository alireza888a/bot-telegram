import React from 'react';
import { GlassCard } from '../GlassCard';
import { MessageSquareCode } from 'lucide-react';

interface PostConfirmMenuCardProps {
  postConfirmMenuId: string;
  setPostConfirmMenuId: (val: string) => void;
  getKbMenus: () => Record<string, { id?: string; title?: string; content?: string }>;
}

export const PostConfirmMenuCard: React.FC<PostConfirmMenuCardProps> = ({
  postConfirmMenuId,
  setPostConfirmMenuId,
  getKbMenus,
}) => {
  return (
    <GlassCard className="border-t-4 border-t-blue-500">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquareCode className="text-blue-400" />
        <h3 className="font-bold text-lg dark:text-white text-slate-800">پیام بعد از تایید سفارش</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">انتخاب منوی ارسال خودکار</label>
          <select
            value={postConfirmMenuId}
            onChange={(e) => setPostConfirmMenuId(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-300">هیچکدام (پیش‌فرض)</option>
            {Object.entries(getKbMenus()).map(([id, menu]) => (
              <option key={id} value={id} className="bg-slate-900 text-white">
                {menu.title || menu.content || id} ({id})
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            وقتی سفارشی رو از صفحهی سفارشها تایید میکنی، علاوه بر پیام تایید، این منو (با هر متن، عکس، دکمه یا لینکی که توش گذاشتی) هم مستقیم برای خریدار ارسال میشه — مثلاً لینک دانلود، دکمهی پیگیری سفارش، یا راهنمای استفاده.
          </p>
        </div>
      </div>
    </GlassCard>
  );
};
