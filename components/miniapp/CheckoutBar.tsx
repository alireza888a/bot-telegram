import React from 'react';
import { Check } from 'lucide-react';

export interface CheckoutBarProps {
  totalItems: number;
  totalPrice: number;
  handleCheckout: () => void;
}

export const CheckoutBar: React.FC<CheckoutBarProps> = ({
  totalItems,
  totalPrice,
  handleCheckout
}) => {
  if (totalItems <= 0) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 bg-[#151c2c]/95 backdrop-blur-xl border-t border-white/10 p-3 shadow-[0_-10px_25px_rgba(0,0,0,0.5)] animate-slide-up">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] text-slate-400">جمع سفارش ({totalItems} اقلام):</div>
          <div className="text-base font-black text-emerald-400">
            {totalPrice.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-300">تومان</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          className="py-2.5 px-4 bg-gradient-to-l from-emerald-600 via-teal-600 to-green-600 hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
        >
          <Check size={16} />
          <span>تکمیل و ادامه در ربات</span>
        </button>
      </div>
    </div>
  );
};
