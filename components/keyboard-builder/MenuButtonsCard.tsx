import React from 'react';
import { GlassCard } from '../GlassCard';
import {
  ArrowUp, ArrowDown, Zap, Link as LinkIcon, Layers, ShoppingBag,
  FileText, Command, PhoneCall, Globe, MessageSquare, Copy, Trash2, Lock
} from 'lucide-react';
import { MenuPage, InlineRow, InlineButton } from '../../types';

interface MenuButtonsCardProps {
  currentMenu: MenuPage;
  currentMenuId: string;
  selectedButton: { rowId: string; btnId: string } | null;
  setSelectedButton: (val: { rowId: string; btnId: string } | null) => void;
  addRow: (count: number) => void;
  addSupportButton: () => void;
  moveRowUp: (index: number) => void;
  moveRowDown: (index: number) => void;
  duplicateRow: (row: InlineRow) => void;
  removeRow: (rowId: string) => void;
  getButtonDisplayText: (btn: InlineButton) => string;
}

export const MenuButtonsCard: React.FC<MenuButtonsCardProps> = ({
  currentMenu,
  currentMenuId,
  selectedButton,
  setSelectedButton,
  addRow,
  addSupportButton,
  moveRowUp,
  moveRowDown,
  duplicateRow,
  removeRow,
  getButtonDisplayText,
}) => {
  return (
    <GlassCard title="دکمه‌های این منو">
       <div className="flex flex-wrap gap-2 mb-6">
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              onClick={() => addRow(num)}
              className="flex-1 py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 text-blue-500 dark:text-blue-300 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 min-w-[70px]"
            >
              <div className="flex gap-0.5">
                {Array(num).fill(0).map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-current rounded-[2px]" />
                ))}
              </div>
              <span className="text-xs font-bold">{num} تایی</span>
            </button>
          ))}
          <button
            onClick={addSupportButton}
            className="py-3 px-3 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 text-emerald-500 dark:text-emerald-300 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-xs font-bold"
            title="افزودن مستقیم دکمه پشتیبانی"
          >
            <div className="flex items-center gap-1">
              <span>💬</span>
            </div>
            <span>پشتیبانی</span>
          </button>
       </div>

       <div className="space-y-3">
         {currentMenu.rows.length === 0 && (
           <div className="text-center py-6 dark:text-white/20 text-slate-400 border-2 border-dashed dark:border-white/10 border-slate-300 rounded-xl mb-4">
             هنوز دکمه‌ای اضافه نکرده‌اید.
           </div>
         )}

         {currentMenu.rows.map((row, idx) => (
           <div key={row.id} className="relative group">
               {/* Row Content */}
               <div className="flex gap-2 pr-8">
                {/* Row Controls */}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveRowUp(idx)} disabled={idx === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-20"><ArrowUp size={14}/></button>
                    <button onClick={() => moveRowDown(idx)} disabled={idx === currentMenu.rows.length - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-20"><ArrowDown size={14}/></button>
                </div>

                {row.buttons.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setSelectedButton({ rowId: row.id, btnId: btn.id })}
                    className={`
                      flex-1 py-3 px-3 rounded-lg text-sm truncate transition-all
                      flex items-center justify-center gap-2 relative overflow-hidden
                      ${selectedButton?.btnId === btn.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-[1.02] ring-2 ring-white/20'
                        : 'dark:bg-white/5 bg-white border border-slate-200 dark:border-white/10 dark:hover:bg-white/10 hover:bg-slate-50 dark:text-white/80 text-slate-700'
                      }
                      ${(btn as any).color === 'blue' ? 'border-r-4 border-r-blue-500' : ''}
                      ${(btn as any).color === 'green' ? 'border-r-4 border-r-green-500' : ''}
                      ${(btn as any).color === 'red' ? 'border-r-4 border-r-red-500' : ''}
                      ${(btn as any).color === 'gold' ? 'border-r-4 border-r-amber-400' : ''}
                      ${(btn as any).color === 'orange' ? 'border-r-4 border-r-orange-500' : ''}
                    `}
                  >
                     {/* Icons */}
                     {btn.type === 'submenu' && (
                       <div className="absolute top-0 right-0 w-3 h-3 border-t-[3px] border-l-[3px] border-orange-500/50 rounded-tl-sm" />
                     )}
                     {(btn as any).condition?.type && (btn as any).condition.type !== 'none' && (
                       <div className="absolute top-1 left-1 text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded text-[10px] flex items-center gap-0.5" title="دکمه شرطی">
                         <Zap size={10} />
                       </div>
                     )}

                     {(btn.type as any) === 'link' && <LinkIcon size={12} className="opacity-50" />}
                     {btn.type === 'submenu' && <Layers size={12} className="opacity-50 text-orange-400" />}
                     {btn.type === 'product' && <ShoppingBag size={12} className="opacity-50 text-blue-400" />}
                     {btn.type === 'form' && <FileText size={12} className="opacity-50" />}
                     {btn.type === 'command' && <Command size={12} className="opacity-50" />}
                     {btn.type === 'inquiry' && <PhoneCall size={12} className="opacity-50 text-green-400" />}
                     {(btn.type as any) === 'api' && <Globe size={12} className="opacity-50 text-purple-400" />}
                     {((btn.type as any) === 'ticket' || (btn.type === 'callback' && (btn as any).value === 'support')) && <MessageSquare size={12} className="opacity-50 text-blue-400" />}

                     {getButtonDisplayText(btn)}
                  </button>
                ))}
              </div>
              {/* Right Side Actions */}
              <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-1 backdrop-blur">
                 <button
                   onClick={() => duplicateRow(row)}
                   className="p-1.5 text-blue-400 hover:text-blue-300"
                   title="کپی ردیف"
                 >
                   <Copy size={16} />
                 </button>
                 <button
                   onClick={() => removeRow(row.id)}
                   className="p-1.5 text-red-400 hover:text-red-500"
                   title="حذف"
                 >
                   <Trash2 size={16} />
                 </button>
              </div>
           </div>
         ))}

         {/* Auto Nav Footer - VISUAL INDICATOR FOR USER */}
         {currentMenuId !== 'root' && (
            <div className="relative opacity-70 mt-4 border-t border-dashed dark:border-white/10 border-slate-300 pt-4">
                <div className="text-[10px] dark:text-slate-400 text-slate-500 mb-2 flex items-center gap-2">
                <Lock size={12}/> دکمه‌های ناوبری (سیستم به صورت خودکار اضافه می‌کند)
                </div>
                <div className="flex gap-2 cursor-not-allowed">
                    <div className="flex-1 py-3 px-2 rounded-lg text-sm dark:bg-white/5 bg-slate-100 border dark:border-white/5 border-slate-200 dark:text-slate-500 text-slate-400 text-center flex items-center justify-center gap-2">🏠 منوی اصلی</div>
                    <div className="flex-1 py-3 px-2 rounded-lg text-sm dark:bg-white/5 bg-slate-100 border dark:border-white/5 border-slate-200 dark:text-slate-500 text-slate-400 text-center flex items-center justify-center gap-2">🔙 بازگشت</div>
                </div>
            </div>
         )}
       </div>
    </GlassCard>
  );
};
