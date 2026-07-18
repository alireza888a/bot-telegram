import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { ShoppingCart, Check, X, Clock, User, DollarSign, Calendar, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { Order } from '../types';
import { telegramService } from '../services/telegramService';

export const Orders: React.FC = () => {
  const token = localStorage.getItem('bot_token') || '';

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bot_orders') || '[]');
    } catch {
      return [];
    }
  });

  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');

  useEffect(() => {
    localStorage.setItem('bot_orders', JSON.stringify(orders));
  }, [orders]);

  const handleConfirmOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (!token) {
      alert('خطا: توکن ربات تنظیم نشده است. ابتدا ربات را در تنظیمات متصل کنید تا پیام ارسال شود.');
      return;
    }

    try {
      // 1. Update order status locally
      const updatedOrders = orders.map(o =>
        o.id === orderId ? { ...o, status: 'confirmed' as const } : o
      );
      setOrders(updatedOrders);

      // 2. Send Telegram notification
      const messageText = "پرداخت شما تایید شد ✅ سفارشتون در حال آمادهسازیه.";
      const res = await telegramService.sendMessage(token, order.userId, messageText);
      if (res && res.ok) {
        alert('سفارش با موفقیت تایید شد و پیام اطلاع‌رسانی به خریدار ارسال گردید.');
      } else {
        console.warn('Telegram send message returned error:', res);
        alert('سفارش به عنوان تاییدشده ذخیره شد، اما ارسال پیام تلگرام ناموفق بود (احتمالاً به دلیل ریپورت یا استارت نبودن ربات توسط کاربر).');
      }
    } catch (e) {
      console.error(e);
      alert('خطایی در تایید سفارش رخ داد.');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (!token) {
      alert('خطا: توکن ربات تنظیم نشده است. ابتدا ربات را در تنظیمات متصل کنید تا پیام ارسال شود.');
      return;
    }

    try {
      // 1. Update order status locally
      const updatedOrders = orders.map(o =>
        o.id === orderId ? { ...o, status: 'rejected' as const } : o
      );
      setOrders(updatedOrders);

      // 2. Send Telegram notification
      const messageText = "متاسفانه پرداخت شما تایید نشد. لطفاً با پشتیبانی تماس بگیرید.";
      const res = await telegramService.sendMessage(token, order.userId, messageText);
      if (res && res.ok) {
        alert('سفارش رد شد و پیام اطلاع‌رسانی به خریدار ارسال گردید.');
      } else {
        console.warn('Telegram send message returned error:', res);
        alert('سفارش به عنوان ردشده ذخیره شد، اما ارسال پیام تلگرام ناموفق بود.');
      }
    } catch (e) {
      console.error(e);
      alert('خطایی در رد سفارش رخ داد.');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  // Helper to format date in Persian friendly format
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
      <div>
        <h2 className="text-2xl font-bold dark:text-white text-slate-800 flex items-center gap-2">
          <ShoppingCart className="text-[#3b82f6]" />
          مدیریت سفارش‌ها و فیش‌های دریافتی
        </h2>
        <p className="text-xs dark:text-white/50 text-slate-500 mt-1">
          سفارش‌های ثبت شده توسط مشتریان ربات را بررسی و وضعیت پرداخت آن‌ها را تعیین کنید.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'pending', 'confirmed', 'rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${
              filter === tab
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10'
                : 'bg-white/5 dark:text-slate-300 text-slate-600 dark:border-white/5 border-black/5 hover:bg-white/10'
            }`}
          >
            {tab === 'all' && 'همه سفارش‌ها'}
            {tab === 'pending' && 'در انتظار بررسی ⏳'}
            {tab === 'confirmed' && 'تایید شده ✅'}
            {tab === 'rejected' && 'رد شده ❌'}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <ShoppingCart size={64} className="text-slate-400 opacity-40 animate-pulse" />
          <h3 className="text-lg font-bold dark:text-white text-slate-700">هیچ سفارشی یافت نشد</h3>
          <p className="text-slate-400 max-w-md text-sm">
            لیست سفارش‌های مربوط به این وضعیت خالی است.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredOrders.map(order => (
            <GlassCard key={order.id} className="relative overflow-hidden flex flex-col justify-between">
              <div>
                {/* Order Header */}
                <div className="flex justify-between items-start pb-4 border-b dark:border-white/5 border-black/5 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm dark:text-white text-slate-800">سفارش #{order.id.slice(-6)}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          order.status === 'confirmed'
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : order.status === 'rejected'
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                        }`}
                      >
                        {order.status === 'confirmed' && 'تایید شده'}
                        {order.status === 'rejected' && 'رد شده'}
                        {order.status === 'pending' && 'در انتظار تایید فیش'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Calendar size={12} />
                      <span>{formatDateTime(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-1.5 text-blue-500 font-bold text-base" dir="ltr">
                      <span>{order.total.toLocaleString('fa-IR')}</span>
                      <span className="text-[10px]">تومان</span>
                    </div>
                  </div>
                </div>

                {/* User details */}
                <div className="bg-white/5 rounded-xl p-3 mb-4 space-y-2 border border-white/5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1"><User size={14} /> خریدار:</span>
                    <span className="dark:text-white text-slate-800 font-medium">{order.userFirstName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">شناسه عددی تلگرام:</span>
                    <span className="font-mono text-[11px] dark:text-white/80 text-slate-700">{order.userId}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 mb-2">لیست اقلام سفارش:</h4>
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-xs py-2 px-3 bg-black/10 dark:bg-black/20 rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        <span className="dark:text-white text-slate-800 font-medium">{item.name}</span>
                        <span className="text-[10px] text-slate-400">×{item.qty}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <span>{(item.price * item.qty).toLocaleString('fa-IR')}</span>
                        <span className="text-[9px]">تومان</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Actions */}
              {order.status === 'pending' && (
                <div className="mt-6 pt-4 border-t dark:border-white/5 border-black/5 flex gap-3">
                  <button
                    onClick={() => handleConfirmOrder(order.id)}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-green-600/10 transition-all"
                  >
                    <Check size={16} />
                    تایید پرداخت و فعال‌سازی
                  </button>
                  <button
                    onClick={() => handleRejectOrder(order.id)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <X size={16} />
                    رد پرداخت
                  </button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
