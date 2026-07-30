import React from 'react';
import { GlassCard } from '../GlassCard';
import { Eye } from 'lucide-react';

interface ForwardSettingsCardProps {
  forwardLink: string;
  setForwardLink: (val: string) => void;
}

export const ForwardSettingsCard: React.FC<ForwardSettingsCardProps> = ({
  forwardLink,
  setForwardLink,
}) => {
  return (
    <GlassCard title="تنظیمات فوروارد پست" className="border-t-4 border-t-blue-500">
      <div className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
          <Eye className="text-blue-400 shrink-0 mt-1"/>
          <div className="text-sm text-blue-200/80">
            <p className="font-bold mb-1">افزایش ویو (View) کانال</p>
            <p>با استفاده از این روش، پیام دقیقاً از کانال شما به کاربران فوروارد می‌شود و سین (View) پست اصلی افزایش می‌یابد.</p>
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-2 block">لینک پست کانال</label>
          <input
            value={forwardLink}
            onChange={e => setForwardLink(e.target.value)}
            placeholder="https://t.me/channelname/123"
            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white dir-ltr text-left font-mono outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </GlassCard>
  );
};
