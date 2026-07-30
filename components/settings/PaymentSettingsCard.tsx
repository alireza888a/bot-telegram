import React from 'react';
import { GlassCard } from '../GlassCard';
import { CreditCard } from 'lucide-react';

interface PaymentSettingsCardProps {
  cardNumber: string;
  setCardNumber: (val: string) => void;
  cardOwner: string;
  setCardOwner: (val: string) => void;
}

export const PaymentSettingsCard: React.FC<PaymentSettingsCardProps> = ({
  cardNumber,
  setCardNumber,
  cardOwner,
  setCardOwner,
}) => {
  return (
    <GlassCard className="border-t-4 border-t-yellow-500">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="text-yellow-400" />
        <h3 className="font-bold text-lg dark:text-white text-slate-800">اطلاعات پرداخت کارت‌به‌کارت (فروشگاه)</h3>
      </div>

      <div className="text-sm text-slate-400 mb-6 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
        <p>شماره کارت و نام صاحب حساب بانکی خود را جهت نمایش به کاربران ربات تلگرام در مرحله ثبت سفارش و تسویه حساب دستی وارد نمایید.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">شماره ۱۶ رقمی کارت بانکی</label>
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="مثال: ۶۰۳۷۹۹۱۸۱۲۳۴۵۶۷۸"
            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white dir-ltr text-left font-mono outline-none focus:border-yellow-500 transition-colors"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">نام و نام خانوادگی صاحب حساب</label>
          <input
            value={cardOwner}
            onChange={(e) => setCardOwner(e.target.value)}
            placeholder="مثال: علی جلالی"
            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-yellow-500 transition-colors"
          />
        </div>
      </div>
    </GlassCard>
  );
};
