import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, Check, ArrowRight, AlertTriangle, Loader2, Store } from 'lucide-react';
import { Product } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        initDataUnsafe?: any;
        themeParams?: any;
      };
    };
  }
}

export const MiniShop: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [shopEnabled, setShopEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cartState, setCartState] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('همه');

  // Extract license code from query string
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code') || '';

  // Initialize Telegram WebApp SDK on Mount
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  // Fetch shop products from server
  useEffect(() => {
    if (!code) {
      setError('کد لایسنس یا شناسه فروشگاه در آدرس یافت نشد.');
      setLoading(false);
      return;
    }

    const fetchShopData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://corepanel-api.tajikr450.workers.dev/api/shop/${encodeURIComponent(code)}/products`);
        const data = await res.json();
        
        if (data.ok === false) {
          setError(data.message || 'خطا در بارگیری اطلاعات فروشگاه.');
        } else {
          setShopEnabled(data.shop_enabled !== false);
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error('MiniShop API error:', err);
        // Fallback to local storage if available
        try {
          const localProds = JSON.parse(localStorage.getItem('bot_products') || '[]');
          setProducts(localProds);
          setShopEnabled(true);
        } catch {
          setError('خطا در ارتباط با سرور. لطفاً مجدداً تلاش کنید.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [code]);

  // Quantity controls
  const updateQty = (productId: string, delta: number) => {
    setCartState(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  // Cart summary calculations
  const totalItems = Object.values(cartState).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Object.entries(cartState).reduce((sum, [pId, qty]) => {
    const prod = products.find(p => p.id === pId);
    return sum + (prod ? prod.price * qty : 0);
  }, 0);

  // Send data back to Telegram bot
  const handleCheckout = () => {
    const cart = Object.entries(cartState)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, qty]) => ({ productId, qty }));

    if (cart.length === 0) return;

    if (window.Telegram?.WebApp?.sendData) {
      window.Telegram.WebApp.sendData(JSON.stringify({ cart }));
      window.Telegram.WebApp.close();
    } else {
      alert('سبد خرید شما آماده ارسال است: \n' + JSON.stringify({ cart }, null, 2));
    }
  };

  // Categories list
  const categories = ['همه', ...Array.from(new Set(products.map(p => (p.category || '').trim() || 'عمومی')))];

  const filteredProducts = selectedCategory === 'همه'
    ? products
    : products.filter(p => ((p.category || '').trim() || 'عمومی') === selectedCategory);

  return (
    <div dir="rtl" className="min-h-screen bg-[#0e131f] text-white flex flex-col font-sans pb-28 relative">
      {/* Background Glow */}
      <div className="fixed top-0 right-0 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#151c2c]/90 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
            <Store size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">فروشگاه آنلاین تلگرام</h1>
            <p className="text-[11px] text-slate-400">انتخاب و ثبت مستقیم در ربات</p>
          </div>
        </div>
        {totalItems > 0 && (
          <div className="bg-blue-600/20 border border-blue-500/30 px-2.5 py-1 rounded-full text-xs text-blue-400 font-medium flex items-center gap-1 animate-fade-in">
            <ShoppingBag size={13} />
            <span>{totalItems} کالا</span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 pt-4 max-w-2xl mx-auto w-full z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-3">
            <Loader2 size={36} className="text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400">در حال دریافت کاتالوگ محصولات...</p>
          </div>
        ) : error ? (
          <div className="my-10 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
            <AlertTriangle size={36} className="text-red-400 mx-auto" />
            <h3 className="text-base font-bold text-red-300">خطا در بارگیری</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
          </div>
        ) : !shopEnabled ? (
          <div className="my-12 p-8 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl">
              🛑
            </div>
            <h2 className="text-lg font-bold text-amber-300">فروشگاه غیرفعال است</h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              فروشگاه در حال حاضر غیرفعال است. جهت اطلاع از وضعیت با مدیریت ربات تماس بگیرید.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="my-12 p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-3">
            <ShoppingBag size={40} className="text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">محصولی یافت نشد</h3>
            <p className="text-xs text-slate-400">هیچ محصولی در کاتالوگ فروشگاه قرار ندارد.</p>
          </div>
        ) : (
          <>
            {/* Categories filter tabs */}
            {categories.length > 2 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-3 custom-scrollbar no-scrollbar mb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredProducts.map((p) => {
                const qty = cartState[p.id] || 0;
                return (
                  <div
                    key={p.id}
                    className={`bg-[#151c2c]/80 border rounded-2xl p-3.5 flex flex-col justify-between transition-all backdrop-blur-sm ${
                      qty > 0
                        ? 'border-blue-500/50 ring-1 ring-blue-500/30 shadow-lg shadow-blue-600/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      {/* Product Image */}
                      <div className="w-full h-36 rounded-xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center relative mb-3">
                        {p.imageUrl && p.imageUrl.trim() !== '' && (p.imageUrl.startsWith('http') || p.imageUrl.startsWith('blob:') || p.imageUrl.startsWith('data:')) ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-500 gap-1.5">
                            <ShoppingBag size={28} className="text-blue-400/60" />
                            <span className="text-[10px] text-slate-500">بدون تصویر</span>
                          </div>
                        )}
                        {p.category && (
                          <span className="absolute top-2 right-2 bg-black/60 border border-white/10 px-2 py-0.5 rounded-md text-[10px] text-slate-300 backdrop-blur-md">
                            {p.category}
                          </span>
                        )}
                      </div>

                      {/* Title & Price */}
                      <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{p.name}</h3>
                      {p.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                      <div className="text-xs font-black text-emerald-400 mb-3 dir-rtl">
                        {p.price.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-slate-400">تومان</span>
                      </div>
                    </div>

                    {/* Quantity Control Buttons */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      {qty === 0 ? (
                        <button
                          onClick={() => updateQty(p.id, 1)}
                          className="w-full py-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 text-blue-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                        >
                          <Plus size={14} />
                          <span>افزودن به سبد</span>
                        </button>
                      ) : (
                        <div className="w-full flex items-center justify-between bg-blue-600/10 border border-blue-500/30 rounded-xl p-1">
                          <button
                            onClick={() => updateQty(p.id, -1)}
                            className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-black text-white px-2 font-mono">{qty}</span>
                          <button
                            onClick={() => updateQty(p.id, 1)}
                            className="w-8 h-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Sticky Bottom Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#151c2c]/95 backdrop-blur-xl border-t border-white/10 p-3.5 shadow-[0_-10px_25px_rgba(0,0,0,0.5)] animate-slide-up">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-400">جمع سفارش ({totalItems} اقلام):</div>
              <div className="text-base font-black text-emerald-400">
                {totalPrice.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-300">تومان</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="py-3 px-5 bg-gradient-to-l from-emerald-600 via-teal-600 to-green-600 hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
            >
              <Check size={16} />
              <span>تکمیل و ادامه در ربات</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
