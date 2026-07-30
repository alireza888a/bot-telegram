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
    <GlassCard
      title="ساختار دکمه‌ها (چیدمان)"
      action={
        <div className="flex gap-2">
          <button onClick={() => addRow(1)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg transition-colors">
            + دکمه تکی
          </button>
          <button onClick={() => addRow(2)} className="text-xs bg-blue-600/50 hover:bg-blue-600 text-white px-2.5 py-1 rounded-lg transition-colors">
            + دوتا در یک ردیف
          </button>
          <button onClick={addSupportButton} className="text-xs bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-colors">
            + پشتیبانی / ثبت‌نام
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {currentMenu.rows.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed dark:border-white/10 border-slate-300 rounded-xl text-slate-500">
            هیچ دکمه‌ای در این ردیف وجود ندارد. از کلیدهای بالا استفاده کنید.
          </div>
        ) : (
          currentMenu.rows.map((row, rIdx) => (
            <div key={row.id} className="flex items-center gap-2 group">
              {/* Row Controls */}
              <div className="flex flex-col gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                <button
                  disabled={rIdx === 0}
                  onClick={() => moveRowUp(rIdx)}
                  className="p-1 hover:bg-white/10 rounded disabled:opacity-20 text-slate-400 hover:text-white"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  disabled={rIdx === currentMenu.rows.length - 1}
                  onClick={() => moveRowDown(rIdx)}
                  className="p-1 hover:bg-white/10 rounded disabled:opacity-20 text-slate-400 hover:text-white"
                >
                  <ArrowDown size={12} />
                </button>
              </div>

              {/* Row Grid */}
              <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${row.buttons.length}, minmax(0, 1fr))` }}>
                {row.buttons.map(btn => {
                  const isSelected = selectedButton?.rowId === row.id && selectedButton?.btnId === btn.id;
                  return (
                    <div
                      key={btn.id}
                      onClick={() => setSelectedButton({ rowId: row.id, btnId: btn.id })}
                      className={`relative p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[50px] ${
                        isSelected
                          ? 'bg-blue-600/30 border-blue-500 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-500'
                          : 'dark:bg-white/5 bg-slate-100 dark:border-white/10 border-slate-300 dark:text-slate-300 text-slate-700 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-sm font-medium">{getButtonDisplayText(btn)}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                        {btn.type === 'submenu' && <><Layers size={10} /> زیرمنو</>}
                        {btn.type === 'url' && <><LinkIcon size={10} /> لینک</>}
                        {btn.type === 'web_app' && <><Zap size={10} /> مینی‌آپ</>}
                        {btn.type === 'product' && <><ShoppingBag size={10} className="text-emerald-400" /> محصول</>}
                        {btn.type === 'form' && <><FileText size={10} className="text-blue-400" /> فرم</>}
                        {btn.type === 'command' && <><Command size={10} className="text-purple-400" /> دستور</>}
                        {btn.type === 'inquiry' && <><PhoneCall size={10} className="text-emerald-400" /> کاتالوگ</>}
                        {btn.type === 'web_url' && <><Globe size={10} className="text-cyan-400" /> وب‌سایت</>}
                        {btn.type === 'admin_chat' && <><MessageSquare size={10} className="text-amber-400" /> گفتگو با پشتیبان</>}
                      </span>

                      {/* VIP Lock Badge */}
                      {btn.isVipOnly && (
                        <div className="absolute top-1 right-1 bg-amber-500/20 text-amber-400 p-0.5 rounded border border-amber-500/30" title="مخصوص کاربران ویژه">
                          <Lock size={10} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Row Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => duplicateRow(row)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white" title="تکثیر ردیف">
                  <Copy size={14} />
                </button>
                <button onClick={() => removeRow(row.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400" title="حذف ردیف">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
};
