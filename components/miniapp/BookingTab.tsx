import React from 'react';
import { Calendar, RefreshCw, CheckCircle2, Loader2, AlertTriangle, Clock, Check } from 'lucide-react';
import { BookableService } from '../../types';

export interface BookingTabProps {
  bookingSuccessMsg: string | null;
  setBookingSuccessMsg: (msg: string | null) => void;
  bookingLoading: boolean;
  bookingError: string | null;
  bookingServices: BookableService[];
  fetchBookingServices: () => void;
  selectedService: BookableService | null;
  setSelectedService: (service: BookableService | null) => void;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string | null) => void;
  availableSlots: string[];
  slotsLoading: boolean;
  bookingName: string;
  setBookingName: (name: string) => void;
  bookingPhone: string;
  setBookingPhone: (phone: string) => void;
  bookingSubmitting: boolean;
  handleBookingSubmit: () => void;
  fetchAvailability: (serviceId: string, dateIso: string) => void;
  getNext7Days: () => Array<{ iso: string; dayName: string; dateStr: string; isToday: boolean }>;
}

export const BookingTab: React.FC<BookingTabProps> = ({
  bookingSuccessMsg,
  setBookingSuccessMsg,
  bookingLoading,
  bookingError,
  bookingServices,
  fetchBookingServices,
  selectedService,
  setSelectedService,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  availableSlots,
  slotsLoading,
  bookingName,
  setBookingName,
  bookingPhone,
  setBookingPhone,
  bookingSubmitting,
  handleBookingSubmit,
  fetchAvailability,
  getNext7Days
}) => {
  return (
    <div className="space-y-4 animate-fade-in max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar size={18} className="text-cyan-400" />
          <span>رزرو آنلاین نوبت</span>
        </h2>
        <button 
          onClick={fetchBookingServices} 
          disabled={bookingLoading}
          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
        >
          <RefreshCw size={13} className={bookingLoading ? 'animate-spin' : ''} />
          <span>بروزرسانی</span>
        </button>
      </div>

      {bookingSuccessMsg ? (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4 animate-fade-in my-6">
          <CheckCircle2 size={44} className="text-emerald-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">ثبت با موفقیت انجام شد</h3>
            <p className="text-xs text-emerald-300 leading-relaxed">{bookingSuccessMsg}</p>
          </div>

          <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-xs text-slate-300 space-y-1 text-right">
            <div>خدمت: <strong className="text-white">{selectedService?.name}</strong></div>
            <div>تاریخ: <strong className="text-cyan-400 font-mono">{selectedDate}</strong></div>
            <div>ساعت: <strong className="text-amber-400 font-mono">{selectedTime}</strong></div>
          </div>

          <button
            onClick={() => {
              setSelectedService(null);
              setSelectedDate(null);
              setSelectedTime(null);
              setBookingName('');
              setBookingPhone('');
              setBookingSuccessMsg(null);
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/20"
          >
            رزرو نوبت جدید
          </button>
        </div>
      ) : bookingLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-6 space-y-3">
          <Loader2 size={32} className="text-cyan-500 animate-spin" />
          <p className="text-xs text-slate-400">در حال دریافت خدمات قابل رزرو...</p>
        </div>
      ) : bookingError ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-2">
          <AlertTriangle size={32} className="text-red-400 mx-auto" />
          <p className="text-xs text-red-300">{bookingError}</p>
        </div>
      ) : bookingServices.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-3 my-8">
          <Calendar size={44} className="text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">خدمتی یافت نشد</h3>
          <p className="text-xs text-slate-400">در حال حاضر خدمتی برای رزرو فعال نیست.</p>
        </div>
      ) : !selectedService ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 mb-1">لطفاً خدمت مورد نظر خود را جهت رزرو انتخاب کنید:</p>
          {bookingServices.map((svc) => (
            <div
              key={svc.id}
              onClick={() => {
                setSelectedService(svc);
                setSelectedDate(null);
                setSelectedTime(null);
              }}
              className="bg-[#151c2c]/80 border border-white/10 hover:border-cyan-500/50 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] backdrop-blur-sm flex items-center justify-between group"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {svc.name}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-blue-400" />
                    <span>{svc.durationMinutes} دقیقه</span>
                  </span>
                  {svc.price && (
                    <span className="text-amber-400 font-bold font-mono">
                      {svc.price.toLocaleString('fa-IR')} تومان
                    </span>
                  )}
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium flex items-center gap-1 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                <span>انتخاب</span>
                <span>➔</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#151c2c]/80 border border-white/10 rounded-2xl p-5 space-y-5 backdrop-blur-sm">
          {/* Selected Service Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                خدمت انتخابی
              </span>
              <h3 className="text-sm font-bold text-white mt-1">{selectedService.name}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">مدت: {selectedService.durationMinutes} دقیقه</p>
            </div>

            <button
              onClick={() => {
                setSelectedService(null);
                setSelectedDate(null);
                setSelectedTime(null);
              }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium transition-colors border border-white/10"
            >
              تغییر خدمت
            </button>
          </div>

          {/* Step 1: Select Date */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-200">
              ۱. انتخاب روز رزرو:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {getNext7Days().map((d) => {
                const isSelected = selectedDate === d.iso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d.iso);
                      fetchAvailability(selectedService.id, d.iso);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-600/30'
                        : 'bg-black/30 border-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{d.dayName}</div>
                    <div className="text-[10px] opacity-80 mt-0.5 font-mono">{d.dateStr}</div>
                    {d.isToday && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded mt-1 inline-block">
                        امروز
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Time Slot */}
          {selectedDate && (
            <div className="space-y-2 pt-2 border-t border-white/5 animate-fade-in">
              <label className="block text-xs font-bold text-slate-200">
                ۲. انتخاب ساعت رزرو:
              </label>

              {slotsLoading ? (
                <div className="p-4 text-center space-y-2">
                  <Loader2 size={24} className="text-cyan-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">در حال دریافت ساعت‌های آزاد...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-xs text-red-300">
                  هیچ ساعت خالی برای این روز یافت نشد.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold font-mono transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30'
                            : 'bg-black/30 border-white/5 hover:border-white/20 text-slate-200'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Name & Contact Info + Submit */}
          {selectedDate && selectedTime && (
            <div className="space-y-3 pt-3 border-t border-white/5 animate-fade-in">
              <label className="block text-xs font-bold text-slate-200">
                ۳. مشخصات و اطلاعات تماس:
              </label>

              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    placeholder="مثلاً: علی محمدی"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">شماره تماس *</label>
                  <input
                    type="tel"
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono dir-ltr text-right"
                  />
                </div>
              </div>

              <button
                onClick={handleBookingSubmit}
                disabled={bookingSubmitting || !bookingName.trim() || !bookingPhone.trim()}
                className="w-full py-3 bg-gradient-to-l from-cyan-600 to-blue-600 hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-600/30 mt-4 active:scale-95 disabled:opacity-50"
              >
                {bookingSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>در حال ثبت نوبت...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>ثبت نوبت برای {selectedDate} ساعت {selectedTime}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
