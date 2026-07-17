import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Send, Pause, Play, Square, Users, Zap, CheckCircle, XCircle, AlertTriangle, Sparkles, Image as ImageIcon, Link as LinkIcon, Plus, Trash2, Music, Video, Clock, ChevronRight, ChevronLeft, SplitSquareHorizontal, Paperclip, LayoutGrid, Copy, Save, Timer, BarChart3, Eye, Cloud, BellOff, Pin, Filter, RefreshCw, Calendar as CalIcon, Settings, CornerUpRight, ShieldCheck, UserX } from 'lucide-react';
import { InlineRow, MediaAttachment, InlineButton, QueueItem } from '../types';
import { telegramService } from '../services/telegramService';
import { generateBroadcastMessage } from '../services/geminiService';

// --- UTILITIES ---
const jalaaliMonthLength = (y: number, m: number) => {
    if (m <= 6) return 31;
    if (m <= 11) return 30;
    const isLeap = (y % 33 % 4 - 1) === Math.floor((y % 33 * 0.228)); 
    return isLeap ? 30 : 29;
};

const gregorianToJalali = (gy: number, gm: number, gd: number) => {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = (gy <= 1600) ? 0 : 979;
    gy -= (gy <= 1600) ? 621 : 1600;
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    jy += Math.floor((days - 1) / 365);
    if (days > 365) days = (days - 1) % 365;
    let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return { jy, jm, jd };
};

const jalaliToGregorian = (jy: number, jm: number, jd: number) => {
    let gy = (jy <= 979) ? 621 : 1600;
    jy -= (jy <= 979) ? 0 : 979;
    let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor((jy % 33 + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    gy += 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) {
        gy += 100 * Math.floor(--days / 36524);
        days %= 36524;
        if (days >= 365) days++;
    }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    gy += Math.floor((days - 1) / 365);
    if (days > 365) days = (days - 1) % 365;
    let gd = days + 1;
    const g_d_m = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    for (let i = 0; i < 13; i++) {
        const v = g_d_m[i] + (i === 2 && ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 1 : 0);
        if (gd <= v) { gm = i; break; }
        gd -= v;
    }
    return { gy, gm, gd };
};

const MONTH_NAMES = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const WEEK_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

interface Template {
    id: string;
    title: string;
    content: string;
    rows: InlineRow[];
}

// --- COMPONENTS ---
const PersianDatePicker: React.FC<{ isOpen: boolean; onClose: () => void; onSelect: (date: Date) => void; initialDate?: Date; }> = ({ isOpen, onClose, onSelect, initialDate }) => {
    const validDate = (initialDate && !isNaN(initialDate.getTime())) ? initialDate : new Date();
    
    // Initial Setup
    const jDate = gregorianToJalali(validDate.getFullYear(), validDate.getMonth() + 1, validDate.getDate());
    const [viewYear, setViewYear] = useState(jDate.jy);
    const [viewMonth, setViewMonth] = useState(jDate.jm);
    const [selectedDay, setSelectedDay] = useState(jDate.jd);
    const [selectedHour, setSelectedHour] = useState(validDate.getHours());
    const [selectedMinute, setSelectedMinute] = useState(validDate.getMinutes());

    if (!isOpen) return null;

    // Generate Calendar Grid
    const generateDays = () => {
        // Find weekday of the 1st day of the month
        const gFirstDay = jalaliToGregorian(viewYear, viewMonth, 1);
        const dateObj = new Date(gFirstDay.gy, gFirstDay.gm - 1, gFirstDay.gd);
        let startDayOfWeek = dateObj.getDay() + 1; // 0=Sun, 1=Mon, ..., 6=Sat in JS. We want 0=Sat, 1=Sun...
        if (startDayOfWeek === 7) startDayOfWeek = 0; // JS Sat is 6, +1 = 7 -> 0

        const daysInMonth = jalaaliMonthLength(viewYear, viewMonth);
        
        const days = [];
        // Empty slots for start of week
        for (let i = 0; i < startDayOfWeek; i++) days.push(null);
        // Days
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

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            <span>{message}</span>
        </div>
    );
};

export const Broadcast: React.FC = () => {
  const token = localStorage.getItem('bot_token') || '';
  const dbChannel = localStorage.getItem('bot_db_channel') || '';
  
  // --- CORE STATE ---
  const [broadcastMode, setBroadcastMode] = useState<'compose' | 'forward' | 'poll'>('compose');
  const [messageA, setMessageA] = useState('');
  const [messageB, setMessageB] = useState(''); 
  const [forwardLink, setForwardLink] = useState('');

  // --- POLL / QUIZ STATE ---
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['گزینه ۱', 'گزینه ۲']);
  const [pollType, setPollType] = useState<'regular' | 'quiz'>('regular');
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [quizCorrectOptionIndex, setQuizCorrectOptionIndex] = useState<number>(0);
  const [quizExplanation, setQuizExplanation] = useState('');
  const [previewVotedOption, setPreviewVotedOption] = useState<number | null>(null);
  const [previewVotes, setPreviewVotes] = useState<number[]>([12, 18]);

  const handleAddPollOption = () => {
    if (pollOptions.length >= 10) return;
    setPollOptions([...pollOptions, '']);
    setPreviewVotes([...previewVotes, 0]);
  };

  const handleUpdatePollOption = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length <= 2) return;
    const updatedOptions = pollOptions.filter((_, i) => i !== index);
    setPollOptions(updatedOptions);
    const updatedVotes = previewVotes.filter((_, i) => i !== index);
    setPreviewVotes(updatedVotes);
    if (quizCorrectOptionIndex >= updatedOptions.length) {
      setQuizCorrectOptionIndex(0);
    }
  };
  
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [activeVariant, setActiveVariant] = useState<'A' | 'B'>('A');

  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // --- STATS & REPORT ---
  const [realUsers, setRealUsers] = useState<any[]>(() => {
      try { return JSON.parse(localStorage.getItem('bot_users') || '[]'); } catch { return []; }
  });
  const [stats, setStats] = useState({ total: realUsers.length, sent: 0, blocked: 0, failed: 0 });
  const [showReport, setShowReport] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  // --- SETTINGS STATE ---
  const [sendSilent, setSendSilent] = useState(false);
  const [pinMessage, setPinMessage] = useState(false);
  const [contentProtect, setContentProtect] = useState(false);
  const [targetAudience, setTargetAudience] = useState<'all' | 'active' | 'vip' | 'new'>('all');
  const [sendSpeed, setSendSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  // --- SCHEDULING STATE ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduledDateObj, setScheduledDateObj] = useState<Date>(new Date());
  const [isScheduledEnabled, setIsScheduledEnabled] = useState(false);
  
  const [broadcastQueue, setBroadcastQueue] = useState<QueueItem[]>(() => {
      try { 
          const q = JSON.parse(localStorage.getItem('channel_queue') || '[]'); 
          return q.filter((item: QueueItem) => item.targetChannelId === 'all' || item.targetChannelId === 'BROADCAST_ALL');
      } catch { return []; }
  });

  // --- MEDIA ALBUM STATE ---
  const [mediaGroup, setMediaGroup] = useState<MediaAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // --- INLINE BUTTONS ---
  const [inlineRows, setInlineRows] = useState<InlineRow[]>([]);

  // --- TEMPLATES ---
  const [showTemplates, setShowTemplates] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<Template[]>(() => {
      try { return JSON.parse(localStorage.getItem('broadcast_templates') || '[]'); } catch { return []; }
  });

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // --- EFFECT: LOAD DRAFT ---
  useEffect(() => {
      const savedDraft = localStorage.getItem('broadcast_draft');
      if (savedDraft) {
          try {
              const draft = JSON.parse(savedDraft);
              if (draft.messageA) setMessageA(draft.messageA);
              if (draft.inlineRows) setInlineRows(draft.inlineRows);
              if (draft.settings) {
                  setSendSilent(draft.settings.sendSilent);
                  setPinMessage(draft.settings.pinMessage);
                  setSendSpeed(draft.settings.sendSpeed);
                  setContentProtect(draft.settings.contentProtect);
              }
          } catch(e) { console.error('Draft load error', e); }
      }
  }, []);

  // --- EFFECT: SAVE DRAFT ---
  useEffect(() => {
      const timeout = setTimeout(() => {
          setIsSavingDraft(true);
          const draft = {
              messageA,
              inlineRows,
              settings: { sendSilent, pinMessage, sendSpeed, contentProtect }
          };
          localStorage.setItem('broadcast_draft', JSON.stringify(draft));
          setTimeout(() => setIsSavingDraft(false), 500);
      }, 1000);
      return () => clearTimeout(timeout);
  }, [messageA, inlineRows, sendSilent, pinMessage, sendSpeed, contentProtect]);

  // Refresh Queue from LocalStorage
  const refreshQueue = () => {
      try { 
          const q = JSON.parse(localStorage.getItem('channel_queue') || '[]'); 
          setBroadcastQueue(q.filter((item: QueueItem) => item.targetChannelId === 'all' || item.targetChannelId === 'BROADCAST_ALL'));
      } catch { }
  };

  useEffect(() => {
      const interval = setInterval(refreshQueue, 2000);
      return () => clearInterval(interval);
  }, []);

  const stopSignal = useRef(false);

  // --- HANDLERS ---

  const handleMediaFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setIsUploading(true);
          const newFiles: MediaAttachment[] = [];

          for (const file of Array.from(e.target.files) as File[]) {
              const type = (file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image') as 'image' | 'video' | 'audio';
              const previewUrl = URL.createObjectURL(file);
              let finalUrl = previewUrl;
              let fileId = undefined;

              if (dbChannel && token) {
                  const uploadedId = await telegramService.uploadToDb(token, dbChannel, file, type);
                  if (uploadedId) {
                      finalUrl = uploadedId;
                      fileId = uploadedId;
                  }
              }

              newFiles.push({
                  id: Date.now() + Math.random().toString(),
                  type,
                  url: finalUrl,
                  previewUrl: previewUrl,
                  name: file.name,
                  fileId: fileId
              });
          }
          setMediaGroup(prev => [...prev, ...newFiles].slice(0, 10));
          setIsUploading(false);
      }
  };

  const removeMedia = (index: number) => {
      setMediaGroup(prev => prev.filter((_, i) => i !== index));
  };

  const addInlineRow = (count: number) => {
    const newButtons: InlineButton[] = Array.from({ length: count }).map((_, i) => ({
        id: `${Date.now()}_${i}`,
        text: count === 1 ? 'دکمه جدید' : `گزینه ${i + 1}`,
        type: 'link',
        value: ''
    }));
    setInlineRows([...inlineRows, { id: Date.now().toString(), buttons: newButtons }]);
  };

  const removeInlineRow = (rowId: string) => setInlineRows(inlineRows.filter(r => r.id !== rowId));
  
  const addButtonToRow = (rowId: string) => {
    const row = inlineRows.find(r => r.id === rowId);
    if (row && row.buttons.length >= 8) return;
    const newBtn: InlineButton = { id: Date.now().toString(), text: 'دکمه', type: 'link', value: '' };
    setInlineRows(inlineRows.map(r => r.id === rowId ? { ...r, buttons: [...r.buttons, newBtn] } : r));
  };

  const removeButton = (rowId: string, btnId: string) => {
    setInlineRows(inlineRows.map(r => r.id === rowId ? { ...r, buttons: r.buttons.filter(b => b.id !== btnId) } : r).filter(r => r.buttons.length > 0)); 
  };

  const updateButton = (rowId: string, btnId: string, field: 'text' | 'value', val: string) => {
    setInlineRows(inlineRows.map(r => r.id === rowId ? { ...r, buttons: r.buttons.map(b => b.id === btnId ? { ...b, [field]: val } : b) } : r));
  };

  const insertVariable = (variable: string) => {
      if (textAreaRef.current) {
          const start = textAreaRef.current.selectionStart;
          const end = textAreaRef.current.selectionEnd;
          const text = activeVariant === 'A' ? messageA : messageB;
          const newText = text.substring(0, start) + variable + text.substring(end);
          if (activeVariant === 'A') setMessageA(newText); else setMessageB(newText);
      }
  };

  // --- SENDING LOGIC ---
  const handleBroadcast = async () => {
    const content = activeVariant === 'A' ? messageA : messageB;
    
    // Check mode
    if (broadcastMode === 'compose') {
        if (!content && mediaGroup.length === 0) return setToast({message: 'لطفا متن پیام یا مدیا را وارد کنید', type: 'error'});
    } else if (broadcastMode === 'forward') {
        if (!forwardLink.includes('t.me/')) return setToast({message: 'لینک پست کانال معتبر نیست', type: 'error'});
    } else {
        if (!pollQuestion.trim()) return setToast({message: 'لطفا سوال نظرسنجی را وارد کنید', type: 'error'});
        if (pollOptions.some(opt => !opt.trim())) return setToast({message: 'لطفا تمامی گزینه‌های پاسخ را پر کنید', type: 'error'});
    }

    if (isScheduledEnabled) {
        setToast({ message: 'این ویژگی در نسخه دمو برای فوروارد فعال نیست', type: 'error' });
        return;
    }
    
    // Immediate Send (Manual Loop)
    executeRealBroadcast(content, inlineRows, mediaGroup, { 
        pin: pinMessage, 
        silent: sendSilent, 
        protect: contentProtect, 
        speed: sendSpeed 
    });
    localStorage.removeItem('broadcast_draft'); 
  };

  const executeRealBroadcast = async (content: string, rows: InlineRow[], media: MediaAttachment[], opts: any) => {
    const rawUsers = JSON.parse(localStorage.getItem('bot_users') || '[]');
    
    // EXCLUDE demo users from real API calls, only keep actual users
    const actualUsers = rawUsers.filter((u: any) => !u.isDemo);
    
    // Apply Target Audience filter
    let users = [...actualUsers];
    if (targetAudience === 'active') {
        users = actualUsers.filter((u: any) => u.status === 'active' || u.status === undefined);
    } else if (targetAudience === 'vip') {
        users = actualUsers.filter((u: any) => u.tags?.some((t: string) => t.toLowerCase().includes('vip') || t.includes('ویژه') || t.includes('VIP')));
    } else if (targetAudience === 'new') {
        const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
        users = actualUsers.filter((u: any) => {
            const joined = u.joinedAt || u.joined_at;
            if (!joined) return false;
            if (typeof joined === 'number') return joined >= threeDaysAgo;
            const d = new Date(joined).getTime();
            return d >= threeDaysAgo;
        });
    }

    if (users.length === 0) {
        if (actualUsers.length === 0) {
            return setToast({ message: 'هنوز هیچ کاربر واقعی در ربات ثبت نشده است (با /start در ربات خود تست کنید)', type: 'error' });
        } else {
            return setToast({ message: 'هیچ کاربر واقعی با شرایط فیلتر انتخاب شده یافت نشد.', type: 'error' });
        }
    }

    setIsSending(true);
    setShowReport(false);
    setIsPaused(false);
    stopSignal.current = false;
    setProgress(0);
    setStats({ total: users.length, sent: 0, blocked: 0, failed: 0 });

    // Speed Control
    let delay = 200; // Normal
    if (opts.speed === 'slow') delay = 1000;
    if (opts.speed === 'fast') delay = 50;

    const replyMarkup = { inline_keyboard: rows.map(r => r.buttons.map(b => ({
        text: b.text,
        url: b.type === 'link' ? b.value : undefined,
        callback_data: b.type === 'link' ? undefined : b.value
    }))) };

    const sendOpts = { disable_notification: opts.silent, protect_content: opts.protect };

    // Parse Forward Link if needed
    let forwardSource: { chatId: string, messageId: number } | null = null;
    if (broadcastMode === 'forward') {
        try {
            // Extracts channel ID and Msg ID from t.me/c/123123123/123 or t.me/username/123
            const parts = forwardLink.split('/');
            const msgId = parseInt(parts[parts.length - 1]);
            let chatRef = parts[parts.length - 2];
            
            // Handle private links (c/123456)
            if (parts.includes('c')) {
                chatRef = '-100' + parts[parts.indexOf('c') + 1];
            } else if (!chatRef.startsWith('@') && !chatRef.startsWith('-100')) {
                chatRef = '@' + chatRef;
            }
            
            forwardSource = { chatId: chatRef, messageId: msgId };
        } catch {
            setIsSending(false);
            return setToast({ message: 'فرمت لینک فوروارد اشتباه است', type: 'error' });
        }
    }

    for (let i = 0; i < users.length; i++) {
        if (stopSignal.current) break;
        while (isPaused) { await new Promise(r => setTimeout(r, 500)); if (stopSignal.current) break; }

        const user = users[i];
        let res;
        const finalContent = content.replace(/{first_name}|{نام}/g, user.firstName || user.first_name || 'کاربر')
                                    .replace(/{username}|{یوزرنیم}/g, user.username || 'ندارد')
                                    .replace(/{id}/g, user.id);

        try {
            if (broadcastMode === 'forward' && forwardSource) {
                res = await telegramService.forwardMessage(token, user.id, forwardSource.chatId, forwardSource.messageId, sendOpts);
            } else if (broadcastMode === 'poll') {
                res = await telegramService.sendPoll(
                    token,
                    user.id,
                    pollQuestion,
                    pollOptions,
                    isAnonymous,
                    allowMultipleAnswers,
                    pollType,
                    quizCorrectOptionIndex,
                    quizExplanation
                );
            } else {
                if (media.length > 0) {
                    if (media.length > 1) {
                        const albumFiles = media.map(m => ({ file: m.fileId || m.url, type: m.type }));
                        const albumRes = await telegramService.sendMediaGroup(token, user.id, albumFiles, finalContent, sendOpts);
                        res = { ok: albumRes.ok };
                    } else {
                        const m = media[0];
                        const fileRef = m.fileId || m.url;
                        if (m.type === 'image') res = await telegramService.sendPhoto(token, user.id, fileRef, finalContent, replyMarkup, sendOpts);
                        else if (m.type === 'video') res = await telegramService.sendVideo(token, user.id, fileRef, finalContent, replyMarkup, sendOpts);
                        else res = await telegramService.sendDocument(token, user.id, fileRef, finalContent, replyMarkup, sendOpts);
                    }
                } else {
                    res = await telegramService.sendMessage(token, user.id, finalContent, replyMarkup, sendOpts);
                }
            }

            if (res.ok) {
                setStats(prev => ({ ...prev, sent: prev.sent + 1 }));
                if (opts.pin && res.result) await telegramService.pinChatMessage(token, user.id, res.result.message_id, opts.silent);
            } else {
                // DEAD USER DETECTION
                const desc = res.description?.toLowerCase() || '';
                if (desc.includes('blocked') || desc.includes('user is deactivated') || desc.includes('initiate')) {
                    setStats(prev => ({ ...prev, blocked: prev.blocked + 1 }));
                    // Clean up DB
                    const currentUsers = JSON.parse(localStorage.getItem('bot_users') || '[]');
                    const newUsers = currentUsers.filter((u: any) => u.id !== user.id);
                    localStorage.setItem('bot_users', JSON.stringify(newUsers));
                } else {
                    setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
                }
            }
        } catch (e) {
            setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
        }

        setProgress(Math.round(((i + 1) / users.length) * 100));
        await new Promise(r => setTimeout(r, delay)); 
    }

    setIsSending(false);
    setShowReport(true);
    setToast({message: 'عملیات ارسال به پایان رسید', type: 'success'});
  };

  const handleStop = () => {
      if (window.confirm('آیا از توقف اضطراری ارسال اطمینان دارید؟')) {
          stopSignal.current = true;
          setIsPaused(false); 
      }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in pb-20">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <PersianDatePicker isOpen={showDatePicker} onClose={() => setShowDatePicker(false)} initialDate={scheduledDateObj} onSelect={(d) => { setScheduledDateObj(d); setIsScheduledEnabled(true); }}/>

      {/* Header Stats */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
         <div>
            <h2 className="text-2xl font-bold dark:text-white text-slate-800 flex items-center gap-2">
                <Users className="text-purple-500"/> پیام همگانی پیشرفته
            </h2>
            <div className="flex items-center gap-3 mt-1">
                <p className="text-sm dark:text-white/50 text-slate-500">ارسال انبوه، زمان‌بندی هوشمند و گزارش‌گیری</p>
            </div>
         </div>
         <div className="flex gap-3">
             <div className="text-center px-4 border-r border-white/10 border-l">
                 <div className="text-xl font-bold text-white">{stats.total.toLocaleString()}</div>
                 <div className="text-[10px] text-slate-400">کل مخاطبین</div>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 items-start">
          
          {/* COLUMN 1: EDITOR */}
          <div className="space-y-6">
              
              {/* MODE SWITCHER */}
              <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 w-fit">
                  <button onClick={() => setBroadcastMode('compose')} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${broadcastMode === 'compose' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                      <Send size={16}/> نوشتن پیام
                  </button>
                  <button onClick={() => setBroadcastMode('forward')} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${broadcastMode === 'forward' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                      <CornerUpRight size={16}/> فوروارد پست
                  </button>
                  <button onClick={() => setBroadcastMode('poll')} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${broadcastMode === 'poll' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                      <BarChart3 size={16}/> نظرسنجی و آزمون‌ساز
                  </button>
              </div>

              {broadcastMode === 'compose' ? (
                  <>
                    <GlassCard title="محتوای پیام" className="relative">
                        <div className="flex flex-wrap gap-2 mb-3 bg-white/5 p-2 rounded-lg border border-white/5">
                            <span className="text-xs text-slate-400 flex items-center gap-1 ml-2"><Sparkles size={12}/> متغیرها:</span>
                            {['{first_name}', '{username}', '{id}'].map(v => (
                                <button key={v} onClick={() => insertVariable(v)} className="px-2 py-1 bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 border border-white/10 rounded text-[10px] text-slate-300 transition-colors">{v}</button>
                            ))}
                        </div>

                        <textarea 
                            ref={textAreaRef}
                            value={messageA}
                            onChange={e => setMessageA(e.target.value)}
                            placeholder="متن پیام خود را بنویسید..."
                            className="w-full h-40 bg-black/20 border border-purple-500/30 rounded-xl p-4 text-white resize-none outline-none focus:border-purple-500 transition-colors font-vazir text-sm leading-relaxed"
                        />
                        
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors">
                                    <Paperclip size={18} className="text-slate-400"/>
                                    <span className="text-sm">افزودن مدیا (عکس/ویدیو)</span>
                                    <input type="file" className="hidden" multiple onChange={handleMediaFiles} accept="image/*,video/*,audio/*"/>
                                </label>
                                {isUploading && <span className="text-xs text-blue-400 flex items-center gap-1 animate-pulse"><Cloud size={12}/> در حال آپلود...</span>}
                            </div>
                            {mediaGroup.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 mt-2 custom-scrollbar">
                                    {mediaGroup.map((media, idx) => (
                                        <div key={idx} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-white/10 group">
                                            <img src={media.previewUrl || media.url} className="w-full h-full object-cover"/>
                                            <button onClick={() => removeMedia(idx)} className="absolute inset-0 bg-black/60 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-20"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard title="دکمه‌های شیشه‌ای">
                        <div className="flex gap-2 mb-4">
                            <button onClick={() => addInlineRow(1)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs border border-white/10">+ افزودن ردیف</button>
                        </div>
                        <div className="space-y-4">
                            {inlineRows.map((row) => (
                                <div key={row.id} className="bg-black/20 border border-white/5 rounded-xl p-3 relative">
                                    <button onClick={() => removeInlineRow(row.id)} className="absolute top-2 left-2 text-red-400 hover:bg-red-500/10 rounded p-1"><Trash2 size={12}/></button>
                                    <div className="flex gap-2 pr-6">
                                        {row.buttons.map((btn) => (
                                            <div key={btn.id} className="flex-1 min-w-[100px] space-y-1">
                                                <input value={btn.text} onChange={e => updateButton(row.id, btn.id, 'text', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white text-center" placeholder="عنوان"/>
                                                <input value={btn.value} onChange={e => updateButton(row.id, btn.id, 'value', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-blue-300 dir-ltr text-center" placeholder="Link/Data"/>
                                                <select value={btn.color || 'default'} onChange={e => updateButton(row.id, btn.id, 'color', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[9px] text-slate-400 text-center">
                                                    <option value="default">معمولی</option>
                                                    <option value="blue">آبی</option>
                                                    <option value="green">سبز</option>
                                                    <option value="red">قرمز</option>
                                                    <option value="gold">طلایی</option>
                                                    <option value="orange">نارنجی</option>
                                                </select>
                                                {row.buttons.length > 1 && <button onClick={() => removeButton(row.id, btn.id)} className="w-full text-[10px] text-red-400">حذف</button>}
                                            </div>
                                        ))}
                                        {row.buttons.length < 4 && <button onClick={() => addButtonToRow(row.id)} className="w-8 flex items-center justify-center bg-white/5 rounded border border-white/5 text-slate-500 hover:text-white"><Plus size={14}/></button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                  </>
              ) : broadcastMode === 'forward' ? (
                  <GlassCard title="تنظیمات فوروارد پست" className="border-t-4 border-t-blue-500">
                      <div className="space-y-4">
                          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                              <Eye className="text-blue-400 shrink-0 mt-1"/>
                              <div className="text-sm text-blue-200/80">
                                  <p className="font-bold mb-1">افزایش ویو (View) کانال</p>
                                  <p>با استفاده از این روش، پیام دقیقاً از کانال شما به کاربران فوروارد می‌شود و سین (View) پست اصلی افزایش می‌یابد.</p>
                              </div>
                          </div>
                          <div>
                              <label className="text-sm text-slate-400 mb-2 block">لینک پست کانال</label>
                              <input 
                                  value={forwardLink}
                                  onChange={e => setForwardLink(e.target.value)}
                                  placeholder="https://t.me/channelname/123"
                                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white dir-ltr text-left font-mono outline-none focus:border-blue-500"
                              />
                          </div>
                      </div>
                  </GlassCard>
              ) : (
                  <GlassCard title="تنظیمات نظرسنجی و آزمون‌ساز" className="border-t-4 border-t-emerald-500">
                      <div className="space-y-6">
                          <div>
                              <label className="text-sm text-slate-400 mb-2 block">پرسش یا سوال شما</label>
                              <input 
                                  value={pollQuestion}
                                  onChange={e => setPollQuestion(e.target.value)}
                                  placeholder="سوال خود را مطرح کنید (مثال: برنده بازی امشب کیست؟)"
                                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-sm text-slate-400 mb-2 block">نوع نظرسنجی</label>
                                  <select 
                                      value={pollType}
                                      onChange={e => {
                                        setPollType(e.target.value as any);
                                        setPreviewVotedOption(null);
                                      }}
                                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
                                  >
                                      <option value="regular">نظرسنجی معمولی</option>
                                      <option value="quiz">آزمون تستی (مسابقه)</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="text-sm text-slate-400 mb-2 block">حالت رای‌دهی</label>
                                  <select 
                                      value={isAnonymous ? 'anon' : 'public'}
                                      onChange={e => setIsAnonymous(e.target.value === 'anon')}
                                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
                                  >
                                      <option value="anon">رای‌گیری ناشناس</option>
                                      <option value="public">رای‌گیری شفاف (مشخص)</option>
                                  </select>
                              </div>
                          </div>

                          {pollType === 'regular' && (
                              <label className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer">
                                  <input 
                                      type="checkbox" 
                                      checked={allowMultipleAnswers}
                                      onChange={e => setAllowMultipleAnswers(e.target.checked)}
                                      className="rounded bg-black/20 border-white/10 text-emerald-600 focus:ring-0"
                                  />
                                  <span className="text-xs text-slate-300">امکان انتخاب چند گزینه همزمان</span>
                              </label>
                          )}

                          <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                  <label className="text-sm text-slate-400 font-bold">گزینه‌های پاسخ (حداقل ۲ و حداکثر ۱۰ گزینه)</label>
                                  {pollOptions.length < 10 && (
                                      <button 
                                          onClick={handleAddPollOption}
                                          className="text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1 transition-colors"
                                      >
                                          <Plus size={12}/> افزودن گزینه
                                      </button>
                                  )}
                              </div>

                              <div className="space-y-2">
                                  {pollOptions.map((opt, idx) => (
                                      <div key={idx} className="flex gap-2 items-center">
                                          <span className="text-xs text-slate-500 w-4">{idx + 1}.</span>
                                          <input 
                                              value={opt}
                                              onChange={e => handleUpdatePollOption(idx, e.target.value)}
                                              placeholder={`پاسخ ${idx + 1}`}
                                              className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                                          />
                                          {pollType === 'quiz' && (
                                              <button 
                                                  onClick={() => setQuizCorrectOptionIndex(idx)}
                                                  className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all shrink-0 ${
                                                      quizCorrectOptionIndex === idx 
                                                          ? 'bg-green-600 border-green-500 text-white' 
                                                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                                  }`}
                                              >
                                                  {quizCorrectOptionIndex === idx ? 'پاسخ صحیح' : 'علامت صحیح'}
                                              </button>
                                          )}
                                          {pollOptions.length > 2 && (
                                              <button 
                                                  onClick={() => handleRemovePollOption(idx)}
                                                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg shrink-0"
                                              >
                                                  <Trash2 size={14}/>
                                              </button>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          </div>

                          {pollType === 'quiz' && (
                              <div className="space-y-2 pt-2 border-t border-white/5">
                                  <label className="text-xs text-slate-400">توضیح یا راهنمایی پاسخ (اختیاری)</label>
                                  <textarea 
                                      value={quizExplanation}
                                      onChange={e => setQuizExplanation(e.target.value)}
                                      placeholder="توضیح دهید چرا این گزینه صحیح است. پس از کلیک روی گزینه اشتباه توسط کاربر، نمایش داده می‌شود."
                                      className="w-full h-20 bg-black/20 border border-white/10 rounded-xl p-3 text-xs text-white resize-none outline-none focus:border-emerald-500"
                                  />
                              </div>
                          )}
                      </div>
                  </GlassCard>
              )}
          </div>

          {/* COLUMN 2: MONITOR & SETTINGS & TARGETING */}
          <div className="space-y-6">
              
              {/* LIVE MONITOR */}
              <div className="telegram-simulator bg-[#0f172a] border border-white/10 rounded-3xl p-4 relative shadow-2xl mx-auto w-full max-w-[320px] overflow-hidden">
                  <div className="flex justify-center mb-2"><div className="w-16 h-4 bg-black/50 rounded-b-xl"></div></div>
                  <div className="bg-[#0e1621] h-[400px] rounded-xl overflow-y-auto custom-scrollbar bg-[url('https://web.telegram.org/img/bg_0.png')] relative flex flex-col">
                      <div className="p-2 space-y-2 pt-10">
                          {broadcastMode === 'poll' ? (
                              <div className="bg-[#182533] rounded-tr-xl rounded-tl-xl rounded-bl-xl rounded-br-none shadow-md overflow-hidden ml-auto max-w-[90%] border border-black/10 p-3.5 dir-rtl text-right">
                                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold mb-2">
                                      <BarChart3 size={12}/>
                                      <span>{pollType === 'quiz' ? 'آزمون تستی' : 'نظرسنجی ناشناس'}</span>
                                  </div>
                                  <div className="text-white text-xs font-bold font-vazir leading-relaxed mb-3">
                                      {pollQuestion || 'سوال خود را مطرح کنید...'}
                                  </div>
                                  
                                  <div className="space-y-2">
                                      {pollOptions.map((opt, idx) => {
                                          const totalVotes = previewVotes.reduce((sum, v) => sum + v, 0) || 1;
                                          const optVotes = previewVotes[idx] || 0;
                                          const percentage = Math.round((optVotes / totalVotes) * 100);
                                          
                                          const isVoted = previewVotedOption !== null;
                                          const isCorrect = idx === quizCorrectOptionIndex;
                                          
                                          const handleVoteClick = () => {
                                              if (previewVotedOption !== null) {
                                                  setPreviewVotedOption(null);
                                                  const updated = [...previewVotes];
                                                  updated[idx] = Math.max(0, updated[idx] - 1);
                                                  setPreviewVotes(updated);
                                              } else {
                                                  setPreviewVotedOption(idx);
                                                  const updated = [...previewVotes];
                                                  updated[idx] = updated[idx] + 1;
                                                  setPreviewVotes(updated);
                                              }
                                          };

                                          return (
                                              <button 
                                                  key={idx} 
                                                  onClick={handleVoteClick}
                                                  className="w-full text-right block relative overflow-hidden rounded-lg p-2.5 bg-white/5 border border-white/5 text-[11px] text-white transition-all hover:bg-white/10"
                                              >
                                                  {isVoted && (
                                                      <div 
                                                          className={`absolute inset-y-0 right-0 transition-all duration-500 ${
                                                              pollType === 'quiz' 
                                                                  ? (isCorrect ? 'bg-green-500/20' : (previewVotedOption === idx ? 'bg-red-500/20' : 'bg-white/5'))
                                                                  : 'bg-emerald-500/20'
                                                          }`}
                                                          style={{ width: `${percentage}%` }}
                                                      />
                                                  )}
                                                  
                                                  <div className="relative z-10 flex justify-between items-center w-full">
                                                      <span className="font-vazir">{opt || `گزینه ${idx + 1}`}</span>
                                                      {isVoted && (
                                                          <span className="font-mono text-[10px] text-slate-300">
                                                              {percentage}%
                                                          </span>
                                                      )}
                                                  </div>
                                              </button>
                                          );
                                      })}
                                  </div>
                                  
                                  {pollType === 'quiz' && previewVotedOption !== null && previewVotedOption !== quizCorrectOptionIndex && quizExplanation && (
                                      <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-300 leading-relaxed">
                                          <strong>راهنمایی:</strong> {quizExplanation}
                                      </div>
                                  )}

                                  <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center text-[9px] text-white/40">
                                      <span>{previewVotes.reduce((sum, v) => sum + v, 0)} رای</span>
                                      <span className="font-mono">14:05</span>
                                  </div>
                              </div>
                          ) : (
                              <div className="bg-[#182533] rounded-tr-xl rounded-tl-xl rounded-bl-xl rounded-br-none shadow-md overflow-hidden ml-auto max-w-[90%] border border-black/10">
                                  
                                  {/* Forward Header */}
                                  {broadcastMode === 'forward' && (
                                      <div className="px-3 pt-2 text-[10px] text-blue-400 font-bold flex items-center gap-1 border-b border-white/5 pb-1 mb-1">
                                          <CornerUpRight size={10}/> Forwarded from Channel
                                      </div>
                                  )}

                                  {/* Media */}
                                  {broadcastMode === 'compose' && mediaGroup.length > 0 && (
                                      <div className="mb-1 relative">
                                          {mediaGroup[0].type === 'image' && <img src={mediaGroup[0].previewUrl || mediaGroup[0].url} className="w-full h-32 object-cover"/>}
                                          {mediaGroup[0].type === 'video' && <video src={mediaGroup[0].previewUrl || mediaGroup[0].url} className="w-full h-32 object-cover" />}
                                          {mediaGroup[0].type === 'audio' && <div className="w-full h-12 bg-[#2b5278] flex items-center justify-center text-white"><Music size={16}/> Audio</div>}
                                          {mediaGroup.length > 1 && <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1.5 rounded-full">+{mediaGroup.length - 1}</div>}
                                      </div>
                                  )}

                                  {/* Text */}
                                  <div className="px-3 py-2 text-white text-xs whitespace-pre-wrap dir-rtl text-right font-vazir leading-relaxed">
                                      {broadcastMode === 'forward' 
                                          ? (forwardLink ? 'محتوای پست فوروارد شده...' : 'لینک پست را وارد کنید') 
                                          : ((activeVariant === 'A' ? messageA : messageB) || 'متن پیام...')}
                                  </div>
                                  <div className="px-2 pb-1 text-right text-[9px] text-white/40 font-mono">14:05</div>
                              </div>
                          )}

                          {/* Inline Buttons */}
                          {broadcastMode === 'compose' && inlineRows.length > 0 && (
                             <div className="space-y-[2px] ml-auto max-w-[90%]">
                                 {inlineRows.map(row => (
                                     <div key={row.id} className="flex gap-[2px]">
                                         {row.buttons.map(btn => (
                                             <div key={btn.id} className={`flex-1 text-[10px] py-2 text-center rounded-[4px] truncate px-1 border border-transparent transition-all
                                                  ${btn.color === 'blue' 
                                                    ? 'bg-blue-600/30 text-blue-100 border-blue-500/20' 
                                                    : btn.color === 'green'
                                                    ? 'bg-emerald-600/30 text-emerald-100 border-emerald-500/20'
                                                    : btn.color === 'red'
                                                    ? 'bg-red-600/30 text-red-100 border-red-500/20'
                                                    : btn.color === 'gold'
                                                    ? 'bg-amber-500/35 text-amber-200 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                                                    : btn.color === 'orange'
                                                    ? 'bg-orange-600/30 text-orange-100 border-orange-500/20'
                                                    : 'bg-[#2b5278]/20 text-white backdrop-blur-sm'
                                                  }`}>
                                                 {btn.text}
                                                 {btn.type === 'link' && <LinkIcon size={8} className="inline ml-1 opacity-50"/>}
                                             </div>
                                         ))}
                                     </div>
                                 ))}
                             </div>
                          )}
                      </div>
                  </div>
              </div>

              <GlassCard title="تنظیمات ارسال پیشرفته">
                  <div className="space-y-4">
                      
                      {/* Target Audience */}
                      <div>
                          <label className="text-xs text-slate-400 mb-2 block flex items-center gap-1">
                              <Users className="text-purple-400" size={14}/> مخاطبین هدف:
                          </label>
                          <select 
                              value={targetAudience}
                              onChange={e => setTargetAudience(e.target.value as any)}
                              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500"
                          >
                              <option value="all">همه کاربران واقعی ({realUsers.filter(u => !u.isDemo).length} نفر)</option>
                              <option value="active">کاربران فعال (بدون مسدودیت) ({realUsers.filter(u => !u.isDemo && u.status !== 'blocked').length} نفر)</option>
                              <option value="vip">کاربران ویژه (مشتری VIP) ({realUsers.filter(u => !u.isDemo && u.tags?.some((t: string) => t.toLowerCase().includes('vip') || t.includes('ویژه') || t.includes('VIP'))).length} نفر)</option>
                              <option value="new">کاربران جدید (۳ روز اخیر) ({
                                  realUsers.filter(u => {
                                      if (u.isDemo) return false;
                                      const joined = u.joinedAt || u.joined_at;
                                      if (!joined) return false;
                                      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
                                      if (typeof joined === 'number') return joined >= threeDaysAgo;
                                      return new Date(joined).getTime() >= threeDaysAgo;
                                  }).length
                              } نفر)</option>
                          </select>
                          <p className="text-[10px] text-slate-500 mt-1 font-sans">کاربران نمایشی (Demo) به‌طور خودکار فیلتر می‌شوند و پیامی دریافت نخواهند کرد.</p>
                      </div>

                      {/* Speed Control */}
                      <div>
                          <label className="text-xs text-slate-400 mb-2 block flex items-center gap-1"><Zap size={14} className="text-yellow-400"/> سرعت ارسال (ضد محدودیت):</label>
                          <div className="grid grid-cols-3 gap-2 bg-black/20 p-1 rounded-lg">
                              {[
                                  { id: 'slow', label: 'آهسته', desc: 'مطمئن' },
                                  { id: 'normal', label: 'معمولی', desc: 'استاندارد' },
                                  { id: 'fast', label: 'سریع', desc: 'خطرناک' }
                              ].map(s => (
                                  <button key={s.id} onClick={() => setSendSpeed(s.id as any)} className={`py-2 rounded-md text-xs transition-all ${sendSpeed === s.id ? 'bg-yellow-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                                      <div className="font-bold">{s.label}</div>
                                      <div className="text-[9px] opacity-70">{s.desc}</div>
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Options Toggles */}
                      <div className="space-y-2">
                          <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${sendSilent ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                              <div className="flex items-center gap-3"><BellOff size={18}/> <span className="text-sm">ارسال بی‌صدا</span></div>
                              <input type="checkbox" className="hidden" checked={sendSilent} onChange={() => setSendSilent(!sendSilent)}/>
                              {sendSilent && <CheckCircle size={16} className="text-blue-400"/>}
                          </label>
                          <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${contentProtect ? 'bg-green-600/20 border-green-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                              <div className="flex items-center gap-3"><ShieldCheck size={18}/> <span className="text-sm">محافظت محتوا (ضد کپی)</span></div>
                              <input type="checkbox" className="hidden" checked={contentProtect} onChange={() => setContentProtect(!contentProtect)}/>
                              {contentProtect && <CheckCircle size={16} className="text-green-400"/>}
                          </label>
                      </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/5">
                      {!isSending ? (
                          <button onClick={handleBroadcast} disabled={realUsers.length === 0} className="w-full text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-cyan-500/20">
                              شروع عملیات ارسال
                              <Send size={20}/>
                          </button>
                      ) : (
                          <div className="flex gap-2">
                              <button onClick={() => setIsPaused(!isPaused)} className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isPaused ? 'bg-green-600' : 'bg-yellow-600'}`}>
                                  {isPaused ? <><Play size={20}/> ادامه</> : <><Pause size={20}/> مکث</>}
                              </button>
                              <button onClick={handleStop} className="px-6 bg-red-600 text-white rounded-xl flex items-center justify-center"><Square size={20}/></button>
                          </div>
                      )}
                  </div>
              </GlassCard>

              {(progress > 0 || showReport) && (
                   <GlassCard className="!p-4 bg-black/40 border-t-4 border-t-green-500">
                      {isSending ? (
                          <>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-white flex items-center gap-2 animate-pulse">در حال ارسال به {stats.total} نفر...</span>
                                <span className="text-xs font-mono text-blue-300">{progress}%</span>
                            </div>
                            <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5 mb-4">
                                <div className={`h-full transition-all duration-300 relative ${isPaused ? 'bg-yellow-500' : 'bg-gradient-to-r from-green-500 to-blue-500'}`} style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div><span className="text-green-400 font-bold">{stats.sent}</span> موفق</div>
                                <div><span className="text-orange-400 font-bold">{stats.blocked}</span> بلاک</div>
                                <div><span className="text-red-400 font-bold">{stats.failed}</span> خطا</div>
                            </div>
                          </>
                      ) : showReport ? (
                          <div className="animate-fade-in">
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                  <BarChart3 size={16} className="text-green-400"/>
                                  <span className="font-bold text-sm text-white">گزارش نهایی ارسال</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="bg-green-500/10 rounded-lg p-2"><div className="text-lg font-bold text-green-400">{stats.sent}</div><div className="text-[10px]">موفق</div></div>
                                  <div className="bg-orange-500/10 rounded-lg p-2"><div className="text-lg font-bold text-orange-400">{stats.blocked}</div><div className="text-[10px]">بلاک (حذف شد)</div></div>
                                  <div className="bg-red-500/10 rounded-lg p-2"><div className="text-lg font-bold text-red-400">{stats.failed}</div><div className="text-[10px]">خطا</div></div>
                              </div>
                              {stats.blocked > 0 && (
                                  <div className="mt-3 text-[10px] text-orange-400 bg-orange-500/10 p-2 rounded flex items-center gap-2">
                                      <UserX size={12}/>
                                      <span>{stats.blocked} کاربر بلاک کننده به صورت خودکار از لیست حذف شدند تا سرعت ارسال افزایش یابد.</span>
                                  </div>
                              )}
                          </div>
                      ) : null}
                   </GlassCard>
              )}
          </div>
      </div>
    </div>
  );
};