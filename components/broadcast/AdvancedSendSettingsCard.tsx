import React from 'react';
import { GlassCard } from '../GlassCard';
import { Users, Zap, BellOff, ShieldCheck, CheckCircle, Send, Play, Pause, Square } from 'lucide-react';

interface AdvancedSendSettingsCardProps {
  targetAudience: 'all' | 'active' | 'vip' | 'new';
  setTargetAudience: (val: 'all' | 'active' | 'vip' | 'new') => void;
  realUsers: any[];
  sendSpeed: 'slow' | 'normal' | 'fast';
  setSendSpeed: (val: 'slow' | 'normal' | 'fast') => void;
  sendSilent: boolean;
  setSendSilent: (val: boolean) => void;
  contentProtect: boolean;
  setContentProtect: (val: boolean) => void;
  isSending: boolean;
  handleBroadcast: () => void;
  isPaused: boolean;
  setIsPaused: (val: boolean) => void;
  handleStop: () => void;
}

export const AdvancedSendSettingsCard: React.FC<AdvancedSendSettingsCardProps> = ({
  targetAudience,
  setTargetAudience,
  realUsers,
  sendSpeed,
  setSendSpeed,
  sendSilent,
  setSendSilent,
  contentProtect,
  setContentProtect,
  isSending,
  handleBroadcast,
  isPaused,
  setIsPaused,
  handleStop,
}) => {
  return (
    <GlassCard title="تنظیمات ارسال پیشرفته">
      <div className="space-y-4">

        {/* Target Audience */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block flex items-center gap-1">
            <Users className="text-purple-400" size={14}/> مخاطبین هدف:
          </label>
          <select
            value={targetAudience}
            onChange={e => setTargetAudience(e.target.value as any)}
            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500"
          >
            <option value="all">همه کاربران واقعی ({realUsers.filter(u => !u.isDemo).length} نفر)</option>
            <option value="active">کاربران فعال (بدون مسدودیت) ({realUsers.filter(u => !u.isDemo && u.status !== 'blocked').length} نفر)</option>
            <option value="vip">کاربران ویژه (مشتری VIP) ({realUsers.filter(u => !u.isDemo && u.tags?.some((t: string) => t.toLowerCase().includes('vip') || t.includes('ویژه') || t.includes('VIP'))).length} نفر)</option>
            <option value="new">کاربران جدید (۳ روز اخیر) ({
              realUsers.filter(u => {
                if (u.isDemo) return false;
                const joined = u.joinedAt || u.joined_at;
                if (!joined) return false;
                const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
                if (typeof joined === 'number') return joined >= threeDaysAgo;
                return new Date(joined).getTime() >= threeDaysAgo;
              }).length
            } نفر)</option>
          </select>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">کاربران نمایشی (Demo) به‌طور خودکار فیلتر می‌شوند و پیامی دریافت نخواهند کرد.</p>
        </div>

        {/* Speed Control */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block flex items-center gap-1"><Zap size={14} className="text-yellow-400"/> سرعت ارسال (ضد محدودیت):</label>
          <div className="grid grid-cols-3 gap-2 bg-black/20 p-1 rounded-lg">
            {[
              { id: 'slow', label: 'آهسته', desc: 'مطمئن' },
              { id: 'normal', label: 'معمولی', desc: 'استاندارد' },
              { id: 'fast', label: 'سریع', desc: 'خطرناک' }
            ].map(s => (
              <button key={s.id} onClick={() => setSendSpeed(s.id as any)} className={`py-2 rounded-md text-xs transition-all ${sendSpeed === s.id ? 'bg-yellow-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                <div className="font-bold">{s.label}</div>
                <div className="text-[9px] opacity-70">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Options Toggles */}
        <div className="space-y-2">
          <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${sendSilent ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>
            <div className="flex items-center gap-3"><BellOff size={18}/> <span className="text-sm">ارسال بی‌صدا</span></div>
            <input type="checkbox" className="hidden" checked={sendSilent} onChange={() => setSendSilent(!sendSilent)}/>
            {sendSilent && <CheckCircle size={16} className="text-blue-400"/>}
          </label>
          <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${contentProtect ? 'bg-green-600/20 border-green-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>
            <div className="flex items-center gap-3"><ShieldCheck size={18}/> <span className="text-sm">محافظت محتوا (ضد کپی)</span></div>
            <input type="checkbox" className="hidden" checked={contentProtect} onChange={() => setContentProtect(!contentProtect)}/>
            {contentProtect && <CheckCircle size={16} className="text-green-400"/>}
          </label>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5">
        {!isSending ? (
          <button onClick={handleBroadcast} disabled={realUsers.length === 0} className="w-full text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-cyan-500/20">
            شروع عملیات ارسال
            <Send size={20}/>
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setIsPaused(!isPaused)} className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isPaused ? 'bg-green-600' : 'bg-yellow-600'}`}>
              {isPaused ? <><Play size={20}/> ادامه</> : <><Pause size={20}/> مکث</>}
            </button>
            <button onClick={handleStop} className="px-6 bg-red-600 text-white rounded-xl flex items-center justify-center"><Square size={20}/></button>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
