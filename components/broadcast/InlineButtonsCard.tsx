import React from 'react';
import { GlassCard } from '../GlassCard';
import { Plus, Trash2 } from 'lucide-react';
import { InlineRow } from '../../types';

interface InlineButtonsCardProps {
  inlineRows: InlineRow[];
  addInlineRow: (count: number) => void;
  removeInlineRow: (rowId: string) => void;
  addButtonToRow: (rowId: string) => void;
  removeButton: (rowId: string, btnId: string) => void;
  updateButton: (rowId: string, btnId: string, field: 'text' | 'value' | 'color', val: string) => void;
}

export const InlineButtonsCard: React.FC<InlineButtonsCardProps> = ({
  inlineRows,
  addInlineRow,
  removeInlineRow,
  addButtonToRow,
  removeButton,
  updateButton,
}) => {
  return (
    <GlassCard title="دکمه‌های شیشه‌ای">
      <div className="flex gap-2 mb-4">
        <button onClick={() => addInlineRow(1)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs border border-white/10">+ افزودن ردیف</button>
      </div>
      <div className="text-[10px] text-amber-500/90 mb-3 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg leading-relaxed">
        ⚠️ رنگ‌های طلایی و نارنجی فقط در پیش‌نمایش پنل دیده می‌شوند؛ تلگرام به صورت واقعی فقط آبی، سبز و قرمز را پشتیبانی می‌کند.
      </div>
      <div className="space-y-4">
        {inlineRows.map((row) => (
          <div key={row.id} className="bg-black/20 border border-white/5 rounded-xl p-3 relative">
            <button onClick={() => removeInlineRow(row.id)} className="absolute top-2 left-2 text-red-400 hover:bg-red-500/10 rounded p-1"><Trash2 size={12}/></button>
            <div className="flex gap-2 pr-6">
              {row.buttons.map((btn) => (
                <div key={btn.id} className="flex-1 min-w-[100px] space-y-1">
                  <input value={btn.text} onChange={e => updateButton(row.id, btn.id, 'text', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white text-center" placeholder="عنوان"/>
                  <input value={btn.value} onChange={e => updateButton(row.id, btn.id, 'value', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-blue-300 dir-ltr text-center" placeholder="Link/Data"/>
                  <select value={btn.color || 'default'} onChange={e => updateButton(row.id, btn.id, 'color', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[9px] text-slate-400 text-center">
                    <option value="default">معمولی</option>
                    <option value="blue">آبی</option>
                    <option value="green">سبز</option>
                    <option value="red">قرمز</option>
                    <option value="gold">طلایی</option>
                    <option value="orange">نارنجی</option>
                  </select>
                  {row.buttons.length > 1 && <button onClick={() => removeButton(row.id, btn.id)} className="w-full text-[10px] text-red-400">حذف</button>}
                </div>
              ))}
              {row.buttons.length < 4 && <button onClick={() => addButtonToRow(row.id)} className="w-8 flex items-center justify-center bg-white/5 rounded border border-white/5 text-slate-500 hover:text-white"><Plus size={14}/></button>}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
