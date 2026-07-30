import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface FormCheckboxSimulatorProps {
  options: string[];
  onSubmit: (selected: string[]) => void;
}

export const FormCheckboxSimulator: React.FC<FormCheckboxSimulatorProps> = ({ options, onSubmit }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (opt: string) => {
    setSelected(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {options.map((opt, oIdx) => {
          const isChecked = selected.includes(opt);
          return (
            <div
              key={oIdx}
              onClick={() => toggle(opt)}
              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                isChecked
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200'
                  : 'bg-black/20 border-white/10 text-slate-300 hover:bg-white/5'
              }`}
            >
              <span>{opt}</span>
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/30'}`}>
                {isChecked && <Check size={12} />}
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => onSubmit(selected.length > 0 ? selected : ['هیچ گزینه‌ای انتخاب نشد'])}
        className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
      >
        تایید و ارسال ({selected.length} گزینه انتخاب شده)
      </button>
    </div>
  );
};
