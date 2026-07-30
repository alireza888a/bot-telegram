import React from 'react';
import { Package, RefreshCw, Loader2, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Order } from '../../types';

export interface OrdersTabProps {
  orders: Order[];
  ordersLoading: boolean;
  ordersError: string | null;
  fetchMyOrders: () => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  ordersLoading,
  ordersError,
  fetchMyOrders
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Package size={18} className="text-blue-400" />
          <span>سوابق سفارش‌های من</span>
        </h2>
        <button 
          onClick={fetchMyOrders} 
          disabled={ordersLoading}
          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
        >
          <RefreshCw size={13} className={ordersLoading ? 'animate-spin' : ''} />
          <span>بروزرسانی</span>
        </button>
      </div>

      {ordersLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-3">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
          <p className="text-xs text-slate-400">در حال دریافت سوابق سفارش‌ها...</p>
        </div>
      ) : ordersError ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-2">
          <AlertTriangle size={32} className="text-red-400 mx-auto" />
          <p className="text-xs text-red-300">{ordersError}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-3 my-8">
          <Package size={44} className="text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">سفارشی ثبت نشده است</h3>
          <p className="text-xs text-slate-400">شما هنوز هیچ سفارشی در این ربات ثبت نکرده‌اید.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((ord) => (
            <div key={ord.id} className="bg-[#151c2c]/80 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
              {/* Top Row: ID & Status Badge */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-400">#{ord.id}</span>
                  <span className="text-[11px] text-slate-400">
                    {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('fa-IR') : ''}
                  </span>
                </div>

                {ord.status === 'confirmed' && (
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    تایید شده
                  </span>
                )}
                {ord.status === 'pending' && (
                  <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock size={12} />
                    در انتظار بررسی
                  </span>
                )}
                {ord.status === 'rejected' && (
                  <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <XCircle size={12} />
                    رد شده
                  </span>
                )}
              </div>

              {/* Order Items List */}
              <div className="space-y-1.5 text-xs">
                {ord.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300">
                    <span className="font-medium">{item.name} <span className="text-slate-500">×{item.qty}</span></span>
                    <span className="font-mono text-slate-400">{(item.price * item.qty).toLocaleString('fa-IR')} تومان</span>
                  </div>
                ))}
              </div>

              {/* Total Price Row */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">جمع کل سفارش:</span>
                <span className="font-black text-emerald-400 text-sm">
                  {ord.total.toLocaleString('fa-IR')} تومان
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
