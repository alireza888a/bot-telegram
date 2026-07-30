import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { gregorianToJalali, jalaliToGregorian, jalaaliMonthLength, MONTH_NAMES, WEEK_DAYS } from '../../utils/jalaliCalendar';

interface PersianDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  initialDate?: Date;
}

export const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialDate,
}) => {
  const validDate = (initialDate && !isNaN(initialDate.getTime())) ? initialDate : new Date();

  const jDate = gregorianToJalali(validDate.getFullYear(), validDate.getMonth() + 1, validDate.getDate());
  const [viewYear, setViewYear] = useState(jDate.jy);
  const [viewMonth, setViewMonth] = useState(jDate.jm);
  const [selectedDay, setSelectedDay] = useState(jDate.jd);
  const [selectedHour, setSelectedHour] = useState(validDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(validDate.getMinutes());

  if (!isOpen) return null;

  const generateDays = () => {
    const gFirstDay = jalaliToGregorian(viewYear, viewMonth, 1);
    const dateObj = new Date(gFirstDay.gy, gFirstDay.gm - 1, gFirstDay.gd);
    let startDayOfWeek = dateObj.getDay() + 1;
    if (startDayOfWeek === 7) startDayOfWeek = 0;

    const daysInMonth = jalaaliMonthLength(viewYear, viewMonth);

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const handleConfirm = () => {
    const gDate = jalaliToGregorian(viewYear, viewMonth, selectedDay);
    const finalDate = new Date(gDate.gy, gDate.gm - 1, gDate.gd, selectedHour, selectedMinute);
    onSelect(finalDate);
    onClose();
  };

  const handlePrevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else { setViewMonth(m => m - 1); }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else { setViewMonth(m => m + 1); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-[350px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-lg relative z-10">
          <button onClick={handlePrevMonth} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors"><ChevronRight size={20}/></button>
          <span className="font-bold text-lg">{MONTH_NAMES[viewMonth - 1]} {viewYear}</span>
          <button onClick={handleNextMonth} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors"><ChevronLeft size={20}/></button>
        </div>

        {/* Days Grid */}
        <div className="bg-[#0f172a] grid grid-cols-7 text-center py-2 text-slate-400 text-xs border-b border-white/5">
          {WEEK_DAYS.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 p-2 gap-1 content-start bg-[#1e293b] min-h-[240px]">
          {generateDays().map((d, idx) => (
            <div key={idx} className="aspect-square flex items-center justify-center">
              {d ? (
                <button
                  onClick={() => setSelectedDay(d)}
                  className={`w-8 h-8 rounded-full text-sm transition-all flex items-center justify-center
                    ${selectedDay === d
                      ? 'bg-blue-500 text-white shadow-lg scale-110 font-bold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }
                    ${(d === jDate.jd && viewMonth === jDate.jm && viewYear === jDate.jy) ? 'border border-blue-500/50' : ''}
                  `}
                >
                  {d}
                </button>
              ) : <span/>}
            </div>
          ))}
        </div>

        {/* Time Picker */}
        <div className="border-t border-white/10 p-4 bg-[#0f172a] flex items-center justify-center gap-4" dir="ltr">
          <div className="flex flex-col items-center">
            <label className="text-[10px] text-slate-500 mb-1">ساعت</label>
            <input
              type="number" min="0" max="23"
              value={selectedHour}
              onChange={e => setSelectedHour(Math.max(0, Math.min(23, Number(e.target.value))))}
              className="w-16 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-white text-xl font-mono focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          <span className="text-white text-2xl pt-4 font-bold animate-pulse text-slate-500">:</span>
          <div className="flex flex-col items-center">
            <label className="text-[10px] text-slate-500 mb-1">دقیقه</label>
            <input
              type="number" min="0" max="59"
              value={selectedMinute}
              onChange={e => setSelectedMinute(Math.max(0, Math.min(59, Number(e.target.value))))}
              className="w-16 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-white text-xl font-mono focus:border-blue-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 flex gap-3 border-t border-white/5 bg-[#1e293b]">
          <button onClick={onClose} className="flex-1 py-2.5 text-slate-400 hover:text-white text-sm hover:bg-white/5 rounded-xl transition-colors font-medium">انصراف</button>
          <button onClick={handleConfirm} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all">تایید زمان</button>
        </div>
      </div>
    </div>
  );
};
