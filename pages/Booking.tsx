import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Edit3, CheckCircle2, XCircle, RefreshCw, AlertTriangle, Loader2, Save, User, Tag, Phone, Zap, Users } from 'lucide-react';
import { BookableService, WorkingHours, Booking, Provider } from '../types';
import { syncNow } from '../services/cloudSync';

export const BookingPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'bookings' | 'services' | 'providers' | 'hours'>('bookings');

  // License code
  const [code, setCode] = useState<string>('');

  // 1. Services state
  const [services, setServices] = useState<BookableService[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('booking_services') || '[]');
    } catch {
      return [];
    }
  });
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<BookableService | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState<number>(30);
  const [servicePrice, setServicePrice] = useState<string>('');
  const [serviceActive, setServiceActive] = useState(true);
  const [serviceProviderIds, setServiceProviderIds] = useState<string[]>([]);

  // 1.5. Providers state
  const [providers, setProviders] = useState<Provider[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('booking_providers') || '[]');
    } catch {
      return [];
    }
  });
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [providerName, setProviderName] = useState('');
  const [providerActive, setProviderActive] = useState(true);
  const [providerHours, setProviderHours] = useState<WorkingHours>({
    sat: { start: '09:00', end: '18:00' },
    sun: { start: '09:00', end: '18:00' },
    mon: { start: '09:00', end: '18:00' },
    tue: { start: '09:00', end: '18:00' },
    wed: { start: '09:00', end: '18:00' },
    thu: { start: '09:00', end: '18:00' },
    fri: null,
  });

  // 2. Working hours state
  const defaultHours: WorkingHours = {
    sat: { start: '09:00', end: '18:00' },
    sun: { start: '09:00', end: '18:00' },
    mon: { start: '09:00', end: '18:00' },
    tue: { start: '09:00', end: '18:00' },
    wed: { start: '09:00', end: '18:00' },
    thu: { start: '09:00', end: '14:00' },
    fri: null,
  };

  const [workingHours, setWorkingHours] = useState<WorkingHours>(() => {
    try {
      const saved = localStorage.getItem('booking_hours');
      return saved ? JSON.parse(saved) : defaultHours;
    } catch {
      return defaultHours;
    }
  });
  const [hoursSavedSuccess, setHoursSavedSuccess] = useState(false);

  // 3. Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const licenseStr = localStorage.getItem('license_cache') || '{}';
      const license = JSON.parse(licenseStr);
      if (license.code) setCode(license.code);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const getLicenseCode = (): string => {
    if (code) return code;
    try {
      const licenseStr = localStorage.getItem('license_cache') || '{}';
      const parsed = JSON.parse(licenseStr);
      return parsed.code || licenseStr;
    } catch {
      return localStorage.getItem('license_cache') || '';
    }
  };

  const handleAddBookingButtonToRoot = () => {
    try {
      const menus = JSON.parse(localStorage.getItem('kb_menus') || '{}');
      const rootKey = menus['root'] ? 'root' : (menus['main'] ? 'main' : Object.keys(menus)[0]);
      if (rootKey && menus[rootKey]) {
        const alreadyExists = menus[rootKey].rows?.some((r: any) =>
          r.buttons?.some((b: any) => b.type === 'callback' && b.value === 'booking')
        );
        if (!alreadyExists) {
          const newButton = { id: 'btn_' + Date.now(), text: '📅 رزرو نوبت', type: 'callback', value: 'booking' };
          menus[rootKey].rows = [...(menus[rootKey].rows || []), { id: 'row_' + Date.now(), buttons: [newButton] }];
          localStorage.setItem('kb_menus', JSON.stringify(menus));
          syncNow();
          alert('✅ دکمه‌ی «رزرو نوبت» به منوی اصلی اضافه شد. الان توی ربات /start بزن تا ببینیش.');
        } else {
          alert('این دکمه از قبل توی منوی اصلی هست.');
        }
      } else {
        alert('هنوز منوی اصلی (root) رو نساختی — اول برو دکمه‌ساز و منوی اصلی رو بساز.');
      }
    } catch (e) {
      console.error(e);
      alert('خطا در دسترسی به منوهای کیبورد.');
    }
  };

  // Fetch bookings from cloud D1 API
  const fetchBookingsApi = async (statusVal: 'all' | 'pending' | 'confirmed' | 'cancelled', beforeCursor?: number | null) => {
    const licenseCode = getLicenseCode();
    const payload: any = {
      code: licenseCode,
      limit: 30
    };
    if (statusVal !== 'all') {
      payload.status = statusVal;
    }
    if (beforeCursor) {
      payload.before = beforeCursor;
    }

    const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/bookings/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  };

  const refreshBookings = async () => {
    setIsLoading(true);
    try {
      const result = await fetchBookingsApi(statusFilter);
      if (result.ok) {
        setBookings(result.bookings || []);
        setHasMore(!!result.hasMore);
        setNextBefore(result.nextBefore ?? null);
      } else {
        alert('خطا در دریافت لیست نوبت‌ها: ' + (result.reason || 'نامشخص'));
      }
    } catch (e) {
      console.error(e);
      alert('خطا در ارتباط با سرور هنگام دریافت نوبت‌ها.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextBefore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const result = await fetchBookingsApi(statusFilter, nextBefore);
      if (result.ok) {
        setBookings(prev => [...prev, ...(result.bookings || [])]);
        setHasMore(!!result.hasMore);
        setNextBefore(result.nextBefore ?? null);
      } else {
        alert('خطا در دریافت ادامه نوبت‌ها: ' + (result.reason || 'نامشخص'));
      }
    } catch (e) {
      console.error(e);
      alert('خطا در دریافت ادامه نوبت‌ها.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    refreshBookings();
  }, [code, statusFilter]);

  // Service Handlers
  const handleOpenServiceModal = (service?: BookableService) => {
    if (service) {
      setEditingService(service);
      setServiceName(service.name);
      setServiceDuration(service.durationMinutes);
      setServicePrice(service.price ? String(service.price) : '');
      setServiceActive(service.active);
      setServiceProviderIds(service.providerIds || []);
    } else {
      setEditingService(null);
      setServiceName('');
      setServiceDuration(30);
      setServicePrice('');
      setServiceActive(true);
      setServiceProviderIds([]);
    }
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;

    const pIds = serviceProviderIds.length > 0 ? serviceProviderIds : undefined;

    let updated: BookableService[];
    if (editingService) {
      updated = services.map(s => s.id === editingService.id ? {
        ...s,
        name: serviceName.trim(),
        durationMinutes: Number(serviceDuration) || 30,
        price: servicePrice ? Number(servicePrice) : undefined,
        active: serviceActive,
        providerIds: pIds
      } : s);
    } else {
      const newSvc: BookableService = {
        id: 'svc_' + Math.random().toString(36).substr(2, 9),
        name: serviceName.trim(),
        durationMinutes: Number(serviceDuration) || 30,
        price: servicePrice ? Number(servicePrice) : undefined,
        active: serviceActive,
        providerIds: pIds
      };
      updated = [...services, newSvc];
    }

    setServices(updated);
    localStorage.setItem('booking_services', JSON.stringify(updated));
    syncNow();
    setIsServiceModalOpen(false);
  };

  const handleDeleteService = (id: string) => {
    if (!confirm('آیا از حذف این خدمت اطمینان دارید؟')) return;
    const updated = services.filter(s => s.id !== id);
    setServices(updated);
    localStorage.setItem('booking_services', JSON.stringify(updated));
    syncNow();
  };

  const handleToggleServiceActive = (id: string) => {
    const updated = services.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setServices(updated);
    localStorage.setItem('booking_services', JSON.stringify(updated));
    syncNow();
  };

  // Provider Handlers
  const handleOpenProviderModal = (provider?: Provider) => {
    if (provider) {
      setEditingProvider(provider);
      setProviderName(provider.name);
      setProviderActive(provider.active);
      setProviderHours(provider.workingHours || defaultHours);
    } else {
      setEditingProvider(null);
      setProviderName('');
      setProviderActive(true);
      setProviderHours(defaultHours);
    }
    setIsProviderModalOpen(true);
  };

  const handleSaveProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerName.trim()) return;

    let updated: Provider[];
    if (editingProvider) {
      updated = providers.map(p => p.id === editingProvider.id ? {
        ...p,
        name: providerName.trim(),
        active: providerActive,
        workingHours: providerHours
      } : p);
    } else {
      const newProv: Provider = {
        id: 'prov_' + Math.random().toString(36).substr(2, 9),
        name: providerName.trim(),
        active: providerActive,
        workingHours: providerHours
      };
      updated = [...providers, newProv];
    }

    setProviders(updated);
    localStorage.setItem('booking_providers', JSON.stringify(updated));
    syncNow();
    setIsProviderModalOpen(false);
  };

  const handleDeleteProvider = (id: string) => {
    if (!confirm('آیا از حذف این کارمند اطمینان دارید؟')) return;
    const updated = providers.filter(p => p.id !== id);
    setProviders(updated);
    localStorage.setItem('booking_providers', JSON.stringify(updated));
    syncNow();
  };

  const handleToggleProviderActive = (id: string) => {
    const updated = providers.map(p => p.id === id ? { ...p, active: !p.active } : p);
    setProviders(updated);
    localStorage.setItem('booking_providers', JSON.stringify(updated));
    syncNow();
  };

  const handleProviderDayToggle = (day: keyof WorkingHours) => {
    setProviderHours(prev => {
      const current = prev[day];
      return {
        ...prev,
        [day]: current ? null : { start: '09:00', end: '18:00' }
      };
    });
  };

  const handleProviderDayTimeChange = (day: keyof WorkingHours, field: 'start' | 'end', value: string) => {
    setProviderHours(prev => {
      const current = prev[day] || { start: '09:00', end: '18:00' };
      return {
        ...prev,
        [day]: { ...current, [field]: value }
      };
    });
  };

  // Working Hours Handlers
  const daysList: { key: keyof WorkingHours; label: string }[] = [
    { key: 'sat', label: 'شنبه' },
    { key: 'sun', label: 'یکشنبه' },
    { key: 'mon', label: 'دوشنبه' },
    { key: 'tue', label: 'سه‌شنبه' },
    { key: 'wed', label: 'چهارشنبه' },
    { key: 'thu', label: 'پنج‌شنبه' },
    { key: 'fri', label: 'جمعه' },
  ];

  const handleDayToggle = (day: keyof WorkingHours) => {
    setWorkingHours(prev => {
      const current = prev[day];
      return {
        ...prev,
        [day]: current ? null : { start: '09:00', end: '18:00' }
      };
    });
  };

  const handleDayTimeChange = (day: keyof WorkingHours, field: 'start' | 'end', value: string) => {
    setWorkingHours(prev => {
      const current = prev[day] || { start: '09:00', end: '18:00' };
      return {
        ...prev,
        [day]: { ...current, [field]: value }
      };
    });
  };

  const handleSaveWorkingHours = () => {
    localStorage.setItem('booking_hours', JSON.stringify(workingHours));
    syncNow();
    setHoursSavedSuccess(true);
    setTimeout(() => setHoursSavedSuccess(false), 3000);
  };

  // Booking action handlers
  const handleConfirmBooking = async (bookingId: string) => {
    if (!code) return;
    setActionLoadingId(bookingId);
    try {
      const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, bookingId })
      });
      const data = await res.json();
      if (data.ok !== false) {
        await refreshBookings();
      } else {
        alert(data.message || 'خطا در تایید نوبت');
      }
    } catch (e) {
      console.error(e);
      alert('خطا در ارتباط با سرور');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (!code) return;
    if (!confirm('آیا از رد این نوبت اطمینان دارید؟')) return;
    setActionLoadingId(bookingId);
    try {
      const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/booking/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, bookingId })
      });
      const data = await res.json();
      if (data.ok !== false) {
        await refreshBookings();
      } else {
        alert(data.message || 'خطا در رد نوبت');
      }
    } catch (e) {
      console.error(e);
      alert('خطا در ارتباط با سرور');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getServiceName = (serviceId: string) => {
    const found = services.find(s => s.id === serviceId);
    return found ? found.name : 'خدمت عمومی';
  };

  const getProviderName = (providerId?: string | null) => {
    if (!providerId) return null;
    const found = providers.find(p => p.id === providerId);
    return found ? found.name : null;
  };

  const formatBookingDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Tehran'
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1e293b]/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">مدیریت نوبت‌دهی و رزرو</h1>
            <p className="text-xs text-slate-400 mt-1">مدیریت خدمات قابل رزرو، کارمندان، ساعات کاری و بررسی نوبت‌های کاربران</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveSubTab('bookings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'bookings'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock size={16} />
            <span>نوبت‌ها ({bookings.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('services')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'services'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag size={16} />
            <span>خدمات ({services.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('providers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'providers'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={16} />
            <span>کارمندها ({providers.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('hours')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'hours'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar size={16} />
            <span>ساعات کاری</span>
          </button>
        </div>
      </div>

      {/* Bot Connection Card (🔌 اتصال به ربات) */}
      <div className="bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-slate-900/60 border border-cyan-500/30 p-5 rounded-2xl shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Zap size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🔌 اتصال به ربات</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              با افزودن دکمه‌ی «رزرو نوبت» به منوی اصلی ربات، کاربران می‌توانند مستقیم نوبت رزرو کنند.
            </p>
          </div>
        </div>

        <button
          onClick={handleAddBookingButtonToRoot}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 shrink-0"
        >
          <Plus size={16} />
          <span>افزودن دکمه‌ی رزرو به منوی اصلی</span>
        </button>
      </div>

      {/* --- TAB 1: BOOKINGS LIST --- */}
      {activeSubTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-[#1e293b]/40 border border-white/10 p-4 rounded-xl">
            {/* Status Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {[
                { id: 'all', label: 'همه نوبت‌ها' },
                { id: 'pending', label: 'در انتظار تایید' },
                { id: 'confirmed', label: 'تاییدشده' },
                { id: 'cancelled', label: 'ردشده / لغوشده' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    statusFilter === f.id
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={refreshBookings}
              disabled={isLoading}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium border border-white/10 flex items-center gap-1.5 transition-all shrink-0 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>بروزرسانی</span>
            </button>
          </div>

          {isLoading && bookings.length === 0 ? (
            <div className="p-12 text-center bg-[#1e293b]/30 border border-white/5 rounded-2xl space-y-3">
              <Loader2 size={32} className="text-blue-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">در حال دریافت لیست نوبت‌ها...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center bg-[#1e293b]/30 border border-white/5 rounded-2xl space-y-3">
              <Calendar size={40} className="text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-400">نوبتی در این بخش ثبت نشده است.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings.map(b => (
                  <div
                    key={b.id}
                    className="bg-[#1e293b]/60 border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg backdrop-blur-sm relative hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono">شناسه: {b.id}</span>
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                          <User size={14} className="text-blue-400" />
                          <span>{b.userFirstName || 'کاربر تلگرام'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({b.userId})</span>
                        </h3>
                        {b.contactInfo && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 mt-1">
                            <Phone size={12} className="text-amber-400 shrink-0" />
                            <span>تماس: <strong>{b.contactInfo}</strong></span>
                          </div>
                        )}
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : b.status === 'cancelled'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {b.status === 'confirmed'
                          ? 'تاییدشده'
                          : b.status === 'cancelled'
                          ? 'ردشده'
                          : 'در انتظار تایید'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300 bg-black/20 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">عنوان خدمت:</span>
                        <span className="font-bold text-white">{getServiceName(b.serviceId)}</span>
                      </div>
                      {getProviderName(b.providerId) && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">ارائه‌دهنده:</span>
                          <span className="font-bold text-cyan-300 flex items-center gap-1">
                            <span>👤 با: {getProviderName(b.providerId)}</span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">تاریخ نوبت:</span>
                        <span className="font-mono text-cyan-400 font-bold">{formatBookingDate(b.date)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">ساعت نوبت:</span>
                        <span className="font-mono text-amber-400 font-bold">{b.time}</span>
                      </div>
                    </div>

                    {b.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmBooking(b.id)}
                          disabled={actionLoadingId === b.id}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoadingId === b.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 size={14} />
                              <span>تأیید نوبت</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectBooking(b.id)}
                          disabled={actionLoadingId === b.id}
                          className="flex-1 py-2 px-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoadingId === b.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <XCircle size={14} />
                              <span>رد نوبت</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {isLoadingMore && <RefreshCw size={14} className="animate-spin" />}
                    <span>نمایش نوبت‌های قدیمی‌تر</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: BOOKABLE SERVICES --- */}
      {activeSubTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#1e293b]/40 border border-white/10 p-4 rounded-xl">
            <div>
              <h2 className="text-sm font-bold text-white">لیست خدمات قابل رزرو</h2>
              <p className="text-xs text-slate-400">خدماتی که کاربران در Mini App می‌توانند انتخاب کنند</p>
            </div>
            <button
              onClick={() => handleOpenServiceModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Plus size={16} />
              <span>افزودن خدمت جدید</span>
            </button>
          </div>

          {services.length === 0 ? (
            <div className="p-12 text-center bg-[#1e293b]/30 border border-white/5 rounded-2xl space-y-3">
              <Tag size={40} className="text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-400">هیچ خدمتی تعریف نشده است.</p>
              <button
                onClick={() => handleOpenServiceModal()}
                className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2"
              >
                <Plus size={14} />
                <span>تعریف اولین خدمت</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(s => (
                <div
                  key={s.id}
                  className={`bg-[#1e293b]/60 border rounded-2xl p-5 space-y-3 transition-all backdrop-blur-sm relative ${
                    s.active ? 'border-white/10 hover:border-white/20' : 'border-red-500/20 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{s.name}</h3>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                        <Clock size={12} className="text-blue-400" />
                        <span>مدت زمان: {s.durationMinutes} دقیقه</span>
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleServiceActive(s.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                        s.active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {s.active ? 'فعال' : 'غیرفعال'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="text-slate-400">قیمت خدمت:</span>
                    <span className="font-bold text-amber-400">
                      {s.price ? `${s.price.toLocaleString('fa-IR')} تومان` : 'رایگان / توافقی'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleOpenServiceModal(s)}
                      className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors border border-blue-500/20"
                      title="ویرایش"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteService(s.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-red-500/20"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: PROVIDERS --- */}
      {activeSubTab === 'providers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#1e293b]/40 border border-white/10 p-4 rounded-xl">
            <div>
              <h2 className="text-sm font-bold text-white">لیست کارمندها / ارائه‌دهندگان</h2>
              <p className="text-xs text-slate-400">مدیریت افراد ارائه‌دهنده خدمات و ساعات کاری اختصاصی هرکدام</p>
            </div>
            <button
              onClick={() => handleOpenProviderModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Plus size={16} />
              <span>افزودن کارمند جدید</span>
            </button>
          </div>

          {providers.length === 0 ? (
            <div className="p-12 text-center bg-[#1e293b]/30 border border-white/5 rounded-2xl space-y-3">
              <Users size={40} className="text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-400">هیچ کارمندی تعریف نشده است.</p>
              <button
                onClick={() => handleOpenProviderModal()}
                className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2"
              >
                <Plus size={14} />
                <span>تعریف اولین کارمند</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map(p => (
                <div
                  key={p.id}
                  className={`bg-[#1e293b]/60 border rounded-2xl p-5 space-y-3 transition-all backdrop-blur-sm relative ${
                    p.active ? 'border-white/10 hover:border-white/20' : 'border-red-500/20 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <User size={16} className="text-cyan-400" />
                        <span>{p.name}</span>
                      </h3>
                    </div>

                    <button
                      onClick={() => handleToggleProviderActive(p.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                        p.active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {p.active ? 'فعال' : 'غیرفعال'}
                    </button>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                    <Clock size={14} className="text-blue-400 shrink-0" />
                    <span>دارای تقویم و ساعات کاری اختصاصی</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleOpenProviderModal(p)}
                      className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors border border-blue-500/20"
                      title="ویرایش"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteProvider(p.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-red-500/20"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: WORKING HOURS --- */}
      {activeSubTab === 'hours' && (
        <div className="bg-[#1e293b]/60 border border-white/10 rounded-2xl p-6 space-y-6 max-w-2xl mx-auto backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-cyan-400" />
                <span>ساعات کاری هفتگی</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">تعیین زمان‌های باز و بسته بودن مجموعه‌ جهت زمان‌بندی نوبت‌ها</p>
            </div>

            <button
              onClick={handleSaveWorkingHours}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              <Save size={16} />
              <span>ذخیره تنظیمات</span>
            </button>
          </div>

          {hoursSavedSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs text-center font-medium animate-fade-in">
              ✅ ساعات کاری با موفقیت ذخیره و همگام‌سازی شد.
            </div>
          )}

          <div className="space-y-3">
            {daysList.map(({ key, label }) => {
              const dayData = workingHours[key];
              const isOpen = !!dayData;

              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    isOpen ? 'bg-black/20 border-white/10' : 'bg-black/40 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOpen}
                        onChange={() => handleDayToggle(key)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>

                    <span className="text-xs font-bold text-white min-w-[70px]">{label}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {isOpen ? 'باز' : 'تعطیل'}
                    </span>
                  </div>

                  {isOpen && dayData && (
                    <div className="flex items-center gap-2 text-xs" dir="ltr">
                      <input
                        type="time"
                        value={dayData.start}
                        onChange={(e) => handleDayTimeChange(key, 'start', e.target.value)}
                        className="bg-slate-900 border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 font-mono"
                      />
                      <span className="text-slate-500">تا</span>
                      <input
                        type="time"
                        value={dayData.end}
                        onChange={(e) => handleDayTimeChange(key, 'end', e.target.value)}
                        className="bg-slate-900 border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- SERVICE CREATE / EDIT MODAL --- */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {editingService ? 'ویرایش خدمت' : 'افزودن خدمت جدید'}
              </h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">عنوان خدمت *</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="مثلاً: مشاوره تلفنی / اصلاح سر"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">مدت زمان (دقیقه) *</label>
                <input
                  type="number"
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(Number(e.target.value))}
                  placeholder="30"
                  min="5"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">قیمت (تومان - اختیاری)</label>
                <input
                  type="number"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  placeholder="مثلاً: 250000"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Provider selection for service */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  کارمندان ارائه‌دهنده خدمت (اختیاری)
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  در صورت عدم انتخاب، از تقویم و ساعات کاری عمومی مجموعه‌ استفاده می‌شود.
                </p>
                {providers.filter(p => p.active).length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                    هنوز کارمند فعالی تعریف نشده است.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar bg-black/20 p-2.5 rounded-xl border border-white/5">
                    {providers.filter(p => p.active).map(p => {
                      const isChecked = serviceProviderIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setServiceProviderIds([...serviceProviderIds, p.id]);
                              } else {
                                setServiceProviderIds(serviceProviderIds.filter(id => id !== p.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/20"
                          />
                          <span className="text-xs text-white">{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceActive}
                    onChange={(e) => setServiceActive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/20"
                  />
                  <span className="text-xs text-white font-medium">خدمت فعال و قابل انتخاب باشد</span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20"
                >
                  ذخیره خدمت
                </button>
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-xl transition-colors border border-white/10"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PROVIDER CREATE / EDIT MODAL --- */}
      {isProviderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {editingProvider ? 'ویرایش کارمند' : 'افزودن کارمند جدید'}
              </h3>
              <button
                onClick={() => setIsProviderModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">نام و نام خانوادگی / عنوان *</label>
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="مثلاً: دکتر رضایی / آقای علی‌نژاد"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={providerActive}
                    onChange={(e) => setProviderActive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/20"
                  />
                  <span className="text-xs text-white font-medium">کارمند فعال و قابل انتخاب باشد</span>
                </label>
              </div>

              {/* Provider Working Hours */}
              <div className="pt-2 border-t border-white/5 space-y-3">
                <label className="block text-xs text-slate-300 font-bold">ساعات کاری هفتگی این کارمند</label>
                <div className="space-y-2">
                  {daysList.map(({ key, label }) => {
                    const dayData = providerHours[key];
                    const isOpen = !!dayData;

                    return (
                      <div
                        key={key}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isOpen ? 'bg-black/20 border-white/10' : 'bg-black/40 border-white/5 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isOpen}
                              onChange={() => handleProviderDayToggle(key)}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4.5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <span className="text-xs font-bold text-white min-w-[60px]">{label}</span>
                        </div>

                        {isOpen && dayData && (
                          <div className="flex items-center gap-1.5 text-xs" dir="ltr">
                            <input
                              type="time"
                              value={dayData.start}
                              onChange={(e) => handleProviderDayTimeChange(key, 'start', e.target.value)}
                              className="bg-slate-900 border border-white/10 text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500 font-mono"
                            />
                            <span className="text-slate-500 text-[10px]">تا</span>
                            <input
                              type="time"
                              value={dayData.end}
                              onChange={(e) => handleProviderDayTimeChange(key, 'end', e.target.value)}
                              className="bg-slate-900 border border-white/10 text-white rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500 font-mono"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20"
                >
                  ذخیره کارمند
                </button>
                <button
                  type="button"
                  onClick={() => setIsProviderModalOpen(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-xl transition-colors border border-white/10"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
