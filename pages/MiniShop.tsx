import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Plus, Minus, Check, AlertTriangle, Loader2, Store, 
  Package, MessageSquare, FileText, Send, Clock, CheckCircle2, XCircle, RefreshCw
} from 'lucide-react';
import { Product, MiniAppModule, Order } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        initDataUnsafe?: any;
        initData?: string;
        themeParams?: any;
      };
    };
  }
}

export const MiniShop: React.FC = () => {
  const [enabledModules, setEnabledModules] = useState<MiniAppModule[]>(() => {
    try {
      const saved = localStorage.getItem('miniapp_modules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ['shop'];
  });

  const [activeTab, setActiveTab] = useState<MiniAppModule>(() => enabledModules[0] || 'shop');

  // Shop state
  const [products, setProducts] = useState<Product[]>([]);
  const [shopEnabled, setShopEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cartState, setCartState] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('همه');

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Support state
  const [supportText, setSupportText] = useState<string>('');
  const [supportSending, setSupportSending] = useState<boolean>(false);
  const [supportSuccess, setSupportSuccess] = useState<boolean>(false);

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

  // Fetch shop products & enabled modules from server
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
          if (Array.isArray(data.enabled_modules) && data.enabled_modules.length > 0) {
            setEnabledModules(data.enabled_modules);
            if (!data.enabled_modules.includes(activeTab)) {
              setActiveTab(data.enabled_modules[0]);
            }
          }
        }
      } catch (err) {
        console.error('MiniShop API error:', err);
        // Fallback to local storage
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

  // Fetch customer orders when "orders" tab becomes active
  const fetchMyOrders = async () => {
    if (!code) return;
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/shop/my-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, initData })
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        // Fallback to local storage if available
        const localOrders = JSON.parse(localStorage.getItem('bot_orders') || '[]');
        setOrders(localOrders);
      }
    } catch (err) {
      console.error('Fetch my-orders error:', err);
      // Fallback to local orders
      try {
        const localOrders = JSON.parse(localStorage.getItem('bot_orders') || '[]');
        setOrders(localOrders);
      } catch {
        setOrdersError('خطا در دریافت سوابق سفارش‌ها.');
      }
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchMyOrders();
    }
  }, [activeTab, code]);

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

  // Send checkout data back to Telegram bot
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

  // Support form submission
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportText.trim()) return;

    setSupportSending(true);
    setSupportSuccess(false);

    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/shop/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, initData, message: supportText.trim() })
      });
      const data = await res.json();
      if (data.ok !== false) {
        setSupportSuccess(true);
        setSupportText('');
      } else {
        alert(data.message || 'خطا در ثبت تیکت پشتیبانی.');
      }
    } catch (err) {
      console.error('Support submit error:', err);
      // Client fallback acknowledgment
      setSupportSuccess(true);
      setSupportText('');
    } finally {
      setSupportSending(false);
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
            <p className="text-[11px] text-slate-400">
              {activeTab === 'shop' && 'انتخاب محصولات و سفارش مستقیم'}
              {activeTab === 'orders' && 'سوابق و پیگیری سفارش‌های قبلی'}
              {activeTab === 'support' && 'ارتباط و ارسال تیکت پشتیبانی'}
              {activeTab === 'forms' && 'فرم‌های آنلاین'}
            </p>
          </div>
        </div>
        {activeTab === 'shop' && totalItems > 0 && (
          <div className="bg-blue-600/20 border border-blue-500/30 px-2.5 py-1 rounded-full text-xs text-blue-400 font-medium flex items-center gap-1 animate-fade-in">
            <ShoppingBag size={13} />
            <span>{totalItems} کالا</span>
          </div>
        )}
      </header>

      {/* Main Content Area based on Active Tab */}
      <main className="flex-1 px-4 pt-4 max-w-2xl mx-auto w-full z-10">

        {/* --- TAB 1: SHOP CATALOG --- */}
        {activeTab === 'shop' && (
          <>
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
          </>
        )}

        {/* --- TAB 2: MY ORDERS --- */}
        {activeTab === 'orders' && (
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
        )}

        {/* --- TAB 3: SUPPORT --- */}
        {activeTab === 'support' && (
          <div className="space-y-4 animate-fade-in max-w-lg mx-auto">
            <div className="bg-[#151c2c]/80 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">پشتیبانی و ارتباط با مدیریت</h2>
                  <p className="text-[11px] text-slate-400">سوال یا مشکل خود را مطرح کنید تا پاسخ داده شود.</p>
                </div>
              </div>

              {supportSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed flex items-start gap-2 animate-fade-in">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-400" />
                  <span>✅ پیام شما ثبت شد، به‌زودی از داخل ربات پاسخ داده می‌شود.</span>
                </div>
              )}

              <form onSubmit={handleSupportSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">متن پیام یا درخواست شما</label>
                  <textarea
                    rows={5}
                    value={supportText}
                    onChange={(e) => setSupportText(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={supportSending || !supportText.trim()}
                  className="w-full py-3 bg-gradient-to-l from-blue-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  {supportSending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>در حال ارسال...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>ارسال پیام پشتیبانی</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- TAB 4: FORMS (PLACEHOLDER) --- */}
        {activeTab === 'forms' && (
          <div className="my-12 p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-3 animate-fade-in max-w-md mx-auto">
            {/* TODO: Full forms module will be implemented in a future update */}
            <FileText size={44} className="text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">فرم‌های آنلاین</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              به‌زودی امکان تکمیل فرم‌های آنلاین مستقیم از داخل Mini App اضافه می‌شود.
            </p>
          </div>
        )}

      </main>

      {/* Sticky Bottom Bar for Shop Checkout (Only when shop tab is active & items > 0) */}
      {activeTab === 'shop' && totalItems > 0 && (
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
      )}

      {/* Bottom Navigation Bar */}
      {enabledModules.length > 0 && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#121826]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 shadow-2xl">
          <div className="max-w-2xl mx-auto flex items-center justify-around">
            {enabledModules.includes('shop') && (
              <button
                onClick={() => setActiveTab('shop')}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  activeTab === 'shop' 
                    ? 'text-blue-400 font-bold bg-blue-600/10' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShoppingBag size={18} className={activeTab === 'shop' ? 'scale-110' : ''} />
                <span className="text-[10px] mt-1">فروشگاه</span>
              </button>
            )}

            {enabledModules.includes('orders') && (
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  activeTab === 'orders' 
                    ? 'text-blue-400 font-bold bg-blue-600/10' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Package size={18} className={activeTab === 'orders' ? 'scale-110' : ''} />
                <span className="text-[10px] mt-1">سفارش‌ها</span>
              </button>
            )}

            {enabledModules.includes('support') && (
              <button
                onClick={() => setActiveTab('support')}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  activeTab === 'support' 
                    ? 'text-blue-400 font-bold bg-blue-600/10' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare size={18} className={activeTab === 'support' ? 'scale-110' : ''} />
                <span className="text-[10px] mt-1">پشتیبانی</span>
              </button>
            )}

            {enabledModules.includes('forms') && (
              <button
                onClick={() => setActiveTab('forms')}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  activeTab === 'forms' 
                    ? 'text-blue-400 font-bold bg-blue-600/10' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText size={18} className={activeTab === 'forms' ? 'scale-110' : ''} />
                <span className="text-[10px] mt-1">فرم‌ها</span>
              </button>
            )}
          </div>
        </nav>
      )}
    </div>
  );
};
