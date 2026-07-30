import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Store, Package, MessageSquare, FileText, 
  Image as ImageIcon, Bell, Calendar
} from 'lucide-react';
import { Product, MiniAppModule, Order, GalleryImage, BookableService } from '../types';
import { ShopTab } from '../components/miniapp/ShopTab';
import { OrdersTab } from '../components/miniapp/OrdersTab';
import { SupportTab } from '../components/miniapp/SupportTab';
import { FormsTab, MiniAppForm } from '../components/miniapp/FormsTab';
import { GalleryTab } from '../components/miniapp/GalleryTab';
import { AnnouncementsTab, Announcement } from '../components/miniapp/AnnouncementsTab';
import { BookingTab } from '../components/miniapp/BookingTab';
import { BottomNavigation } from '../components/miniapp/BottomNavigation';
import { CheckoutBar } from '../components/miniapp/CheckoutBar';

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

  // Gallery state
  const [galleryList, setGalleryList] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState<boolean>(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState<boolean>(false);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);

  // Forms state
  const [formsList, setFormsList] = useState<MiniAppForm[]>([]);
  const [formsLoading, setFormsLoading] = useState<boolean>(false);
  const [formsError, setFormsError] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<MiniAppForm | null>(null);
  const [formValues, setFormValues] = useState<Record<number, any>>({});
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Booking state
  const [bookingServices, setBookingServices] = useState<BookableService[]>([]);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<BookableService | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingName, setBookingName] = useState<string>('');
  const [bookingPhone, setBookingPhone] = useState<string>('');
  const [bookingSubmitting, setBookingSubmitting] = useState<boolean>(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

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

  // Fetch gallery images
  const fetchGallery = async () => {
    if (!code) return;
    setGalleryLoading(true);
    setGalleryError(null);
    try {
      const res = await fetch(`https://corepanel-api.tajikr450.workers.dev/api/shop/${encodeURIComponent(code)}/gallery`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.gallery)) {
        setGalleryList(data.gallery);
      } else {
        const localGallery = JSON.parse(localStorage.getItem('gallery_images') || '[]');
        setGalleryList(localGallery);
      }
    } catch (err) {
      console.error('Fetch gallery error:', err);
      try {
        const localGallery = JSON.parse(localStorage.getItem('gallery_images') || '[]');
        setGalleryList(localGallery);
      } catch {
        setGalleryError('خطا در دریافت تصاویر گالری.');
      }
    } finally {
      setGalleryLoading(false);
    }
  };

  // Fetch announcements
  const fetchAnnouncements = async () => {
    if (!code) return;
    setAnnouncementsLoading(true);
    setAnnouncementsError(null);
    try {
      const res = await fetch(`https://corepanel-api.tajikr450.workers.dev/api/shop/${encodeURIComponent(code)}/announcements`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      } else {
        const localQueue = JSON.parse(localStorage.getItem('channel_queue') || '[]');
        const mapped = localQueue.map((item: any) => ({
          id: item.id,
          content: item.content || '',
          mediaFiles: item.mediaFiles || (item.hasMedia ? [{ type: item.mediaType || 'image', url: '' }] : []),
          createdAt: item.createdAt || Date.now()
        }));
        setAnnouncements(mapped);
      }
    } catch (err) {
      console.error('Fetch announcements error:', err);
      try {
        const localQueue = JSON.parse(localStorage.getItem('channel_queue') || '[]');
        const mapped = localQueue.map((item: any) => ({
          id: item.id,
          content: item.content || '',
          mediaFiles: item.mediaFiles || [],
          createdAt: item.createdAt || Date.now()
        }));
        setAnnouncements(mapped);
      } catch {
        setAnnouncementsError('خطا در دریافت اعلانات.');
      }
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  // Fetch forms
  const fetchForms = async () => {
    if (!code) return;
    setFormsLoading(true);
    setFormsError(null);
    try {
      const res = await fetch(`https://corepanel-api.tajikr450.workers.dev/api/shop/${encodeURIComponent(code)}/forms`);
      const data = await res.json();
      if (data.ok !== false && Array.isArray(data.forms)) {
        setFormsList(data.forms);
      } else {
        const localFormsObj = JSON.parse(localStorage.getItem('bot_forms') || '{}');
        const list: MiniAppForm[] = Object.values(localFormsObj);
        setFormsList(list);
      }
    } catch (err) {
      console.error('Fetch forms error:', err);
      try {
        const localFormsObj = JSON.parse(localStorage.getItem('bot_forms') || '{}');
        const list: MiniAppForm[] = Object.values(localFormsObj);
        setFormsList(list);
      } catch {
        setFormsError('خطا در دریافت لیست فرم‌ها.');
      }
    } finally {
      setFormsLoading(false);
    }
  };

  // Submit form answers
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;

    setFormSubmitting(true);
    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      const answers = selectedForm.questions.map((q, i) => {
        const val = formValues[i];
        let answerStr = '';
        if (Array.isArray(val)) {
          answerStr = val.join(', ');
        } else if (val !== undefined && val !== null) {
          answerStr = String(val);
        }
        return { q: q.text, a: answerStr };
      });

      const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/shop/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, initData, formId: selectedForm.id, answers })
      });

      const data = await res.json();
      if (data.ok !== false) {
        setFormSuccessMessage('✅ فرم شما با موفقیت ارسال شد');
      } else {
        alert(data.message || 'خطا در ارسال فرم.');
      }
    } catch (err) {
      console.error('Submit form error:', err);
      alert('خطا در ارتباط با سرور.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Fetch booking services
  const fetchBookingServices = async () => {
    if (!code) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const res = await fetch(`https://corepanel-api.tajikr450.workers.dev/api/shop/${encodeURIComponent(code)}/services`);
      const data = await res.json();
      if (data.ok !== false && Array.isArray(data.services)) {
        setBookingServices(data.services.filter((s: BookableService) => s.active !== false));
      } else {
        const localSvcs: BookableService[] = JSON.parse(localStorage.getItem('booking_services') || '[]');
        setBookingServices(localSvcs.filter(s => s.active !== false));
      }
    } catch (err) {
      console.error('Fetch services error:', err);
      try {
        const localSvcs: BookableService[] = JSON.parse(localStorage.getItem('booking_services') || '[]');
        setBookingServices(localSvcs.filter(s => s.active !== false));
      } catch {
        setBookingError('خطا در دریافت لیست خدمات.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // Fetch availability slots
  const fetchAvailability = async (serviceId: string, dateIso: string) => {
    if (!code) return;
    setSlotsLoading(true);
    setAvailableSlots([]);
    setSelectedTime(null);
    try {
      const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/shop/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, serviceId, date: dateIso })
      });
      const data = await res.json();
      if (data.ok !== false && Array.isArray(data.slots)) {
        setAvailableSlots(data.slots);
      } else {
        setAvailableSlots(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']);
      }
    } catch (err) {
      console.error('Fetch availability error:', err);
      setAvailableSlots(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Submit booking
  const handleBookingSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    if (!bookingName.trim() || !bookingPhone.trim()) {
      alert('لطفاً نام و شماره تماس خود را وارد کنید.');
      return;
    }
    setBookingSubmitting(true);
    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/shop/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          initData,
          serviceId: selectedService.id,
          date: selectedDate,
          time: selectedTime,
          contactInfo: `${bookingName.trim()} - ${bookingPhone.trim()}`
        })
      });
      const data = await res.json();
      if (data.ok !== false) {
        setBookingSuccessMsg('✅ نوبت شما ثبت شد، منتظر تایید ادمین باشید');
      } else {
        alert(data.message || 'خطا در ثبت نوبت.');
      }
    } catch (err) {
      console.error('Booking submit error:', err);
      alert('خطا در ارتباط با سرور.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Generate 7 upcoming days
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('fa-IR', { weekday: 'long' });
      const dateStr = d.toLocaleDateString('fa-IR', { month: 'numeric', day: 'numeric' });
      days.push({ iso, dayName, dateStr, isToday: i === 0 });
    }
    return days;
  };

  useEffect(() => {
    if (activeTab === 'orders') fetchMyOrders();
    if (activeTab === 'forms') fetchForms();
    if (activeTab === 'booking') fetchBookingServices();
    if (activeTab === 'gallery') fetchGallery();
    if (activeTab === 'announcements') fetchAnnouncements();
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

  // Helper for relative Iranian date format
  const formatRelativeTime = (timestamp: number | string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return String(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'همین الان';
    if (diffMinutes < 60) return `${diffMinutes.toLocaleString('fa-IR')} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours.toLocaleString('fa-IR')} ساعت پیش`;
    if (diffDays < 7) return `${diffDays.toLocaleString('fa-IR')} روز پیش`;
    return date.toLocaleDateString('fa-IR');
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
              {activeTab === 'gallery' && 'گالری تصاویر و نمونه‌کارها'}
              {activeTab === 'announcements' && 'اطلاعیه‌ها و اخبار جدید'}
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
        {activeTab === 'shop' && (
          <ShopTab
            loading={loading}
            error={error}
            shopEnabled={shopEnabled}
            products={products}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            cartState={cartState}
            updateQty={updateQty}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersTab
            orders={orders}
            ordersLoading={ordersLoading}
            ordersError={ordersError}
            fetchMyOrders={fetchMyOrders}
          />
        )}

        {activeTab === 'support' && (
          <SupportTab
            supportText={supportText}
            setSupportText={setSupportText}
            supportSending={supportSending}
            supportSuccess={supportSuccess}
            handleSupportSubmit={handleSupportSubmit}
          />
        )}

        {activeTab === 'forms' && (
          <FormsTab
            selectedForm={selectedForm}
            setSelectedForm={setSelectedForm}
            formValues={formValues}
            setFormValues={setFormValues}
            formSubmitting={formSubmitting}
            formSuccessMessage={formSuccessMessage}
            setFormSuccessMessage={setFormSuccessMessage}
            handleFormSubmit={handleFormSubmit}
            formsList={formsList}
            formsLoading={formsLoading}
            formsError={formsError}
            fetchForms={fetchForms}
          />
        )}

        {activeTab === 'gallery' && (
          <GalleryTab
            galleryList={galleryList}
            galleryLoading={galleryLoading}
            galleryError={galleryError}
            fetchGallery={fetchGallery}
            lightboxImage={lightboxImage}
            setLightboxImage={setLightboxImage}
          />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsTab
            announcements={announcements}
            announcementsLoading={announcementsLoading}
            announcementsError={announcementsError}
            fetchAnnouncements={fetchAnnouncements}
            formatRelativeTime={formatRelativeTime}
          />
        )}

        {activeTab === 'booking' && (
          <BookingTab
            bookingSuccessMsg={bookingSuccessMsg}
            setBookingSuccessMsg={setBookingSuccessMsg}
            bookingLoading={bookingLoading}
            bookingError={bookingError}
            bookingServices={bookingServices}
            fetchBookingServices={fetchBookingServices}
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            availableSlots={availableSlots}
            slotsLoading={slotsLoading}
            bookingName={bookingName}
            setBookingName={setBookingName}
            bookingPhone={bookingPhone}
            setBookingPhone={setBookingPhone}
            bookingSubmitting={bookingSubmitting}
            handleBookingSubmit={handleBookingSubmit}
            fetchAvailability={fetchAvailability}
            getNext7Days={getNext7Days}
          />
        )}
      </main>

      {/* Sticky Bottom Bar for Shop Checkout (Only when shop tab is active & items > 0) */}
      {activeTab === 'shop' && (
        <CheckoutBar
          totalItems={totalItems}
          totalPrice={totalPrice}
          handleCheckout={handleCheckout}
        />
      )}

      {/* Bottom Navigation Bar */}
      <BottomNavigation
        enabledModules={enabledModules}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};
