import React from 'react';
import { GlassCard } from '../GlassCard';
import { AppWindow } from 'lucide-react';
import { MiniAppModule } from '../../types';

interface MiniAppModulesCardProps {
  miniappModules: MiniAppModule[];
  toggleMiniAppModule: (mod: MiniAppModule) => void;
}

export const MiniAppModulesCard: React.FC<MiniAppModulesCardProps> = ({
  miniappModules,
  toggleMiniAppModule,
}) => {
  return (
    <GlassCard className="border-t-4 border-t-indigo-500">
      <div className="flex items-center gap-2 mb-4">
        <AppWindow className="text-indigo-400" />
        <h3 className="font-bold text-lg dark:text-white text-slate-800">ماژول‌های اپلیکیشن فروشگاه (Mini App)</h3>
      </div>

      <p className="text-xs text-slate-400 mb-5 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
        هر ماژولی که تیک بزنی، به‌عنوان یه تب داخل Mini App مشتری‌هات ظاهر میشه.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label
          onClick={() => toggleMiniAppModule('shop')}
          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
            miniappModules.includes('shop')
              ? 'bg-blue-600/15 border-blue-500/50 text-white'
              : 'bg-black/20 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          <input
            type="checkbox"
            checked={miniappModules.includes('shop')}
            onChange={() => {}}
            className="w-4 h-4 rounded text-blue-600 border-white/20 bg-black/40 focus:ring-0"
          />
          <span className="text-sm font-bold">🛍 فروشگاه</span>
        </label>

        <label
          onClick={() => toggleMiniAppModule('orders')}
          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
            miniappModules.includes('orders')
              ? 'bg-blue-600/15 border-blue-500/50 text-white'
              : 'bg-black/20 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          <input
            type="checkbox"
            checked={miniappModules.includes('orders')}
            onChange={() => {}}
            className="w-4 h-4 rounded text-blue-600 border-white/20 bg-black/40 focus:ring-0"
          />
          <span className="text-sm font-bold">📦 سوابق سفارش‌ها</span>
        </label>

        <label
          onClick={() => toggleMiniAppModule('support')}
          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
            miniappModules.includes('support')
              ? 'bg-blue-600/15 border-blue-500/50 text-white'
              : 'bg-black/20 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          <input
            type="checkbox"
            checked={miniappModules.includes('support')}
            onChange={() => {}}
            className="w-4 h-4 rounded text-blue-600 border-white/20 bg-black/40 focus:ring-0"
          />
          <span className="text-sm font-bold">💬 پشتیبانی</span>
        </label>

        <label
          onClick={() => toggleMiniAppModule('forms')}
          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
            miniappModules.includes('forms')
              ? 'bg-blue-600/15 border-blue-500/50 text-white'
              : 'bg-black/20 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          <input
            type="checkbox"
            checked={miniappModules.includes('forms')}
            onChange={() => {}}
            className="w-4 h-4 rounded text-blue-600 border-white/20 bg-black/40 focus:ring-0"
          />
          <span className="text-sm font-bold">📝 فرم‌ها</span>
        </label>

        <label
          onClick={() => toggleMiniAppModule('gallery')}
          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
            miniappModules.includes('gallery')
              ? 'bg-blue-600/15 border-blue-500/50 text-white'
              : 'bg-black/20 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          <input
            type="checkbox"
            checked={miniappModules.includes('gallery')}
            onChange={() => {}}
            className="w-4 h-4 rounded text-blue-600 border-white/20 bg-black/40 focus:ring-0"
          />
          <span className="text-sm font-bold">🖼 گالری</span>
        </label>

        <label
          onClick={() => toggleMiniAppModule('announcements')}
          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
            miniappModules.includes('announcements')
              ? 'bg-blue-600/15 border-blue-500/50 text-white'
              : 'bg-black/20 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          <input
            type="checkbox"
            checked={miniappModules.includes('announcements')}
            onChange={() => {}}
            className="w-4 h-4 rounded text-blue-600 border-white/20 bg-black/40 focus:ring-0"
          />
          <span className="text-sm font-bold">🔔 اعلانات</span>
        </label>
      </div>
    </GlassCard>
  );
};
