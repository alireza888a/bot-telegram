import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Users, Send, Plus, Trash2, Calendar as CalIcon, Clock, Image as ImageIcon, Link as LinkIcon, Lock, Unlock, CheckCircle, X, AlertTriangle, Music, Video, RefreshCw, Pin, BellOff, ShieldAlert, Bold, Italic, Code, Eye, Sparkles, Cloud, ListChecks, Megaphone, Layers, LayoutGrid, Settings, AlertCircle, Check, ChevronRight, ChevronLeft, Vote, Trophy, HelpCircle, Save } from 'lucide-react';
import { QueueItem, InlineRow, SavedChannel, SentMessageLog, MediaFile } from '../types';
import { telegramService } from '../services/telegramService';
import { generateBroadcastMessage } from '../services/geminiService';

// --- UTILITIES (Accurate Jalali/Gregorian Conversion) ---
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

interface ChannelsProps {
    onNavigate?: (page: string) => void;
}

export const Channels: React.FC<ChannelsProps> = ({ onNavigate }) => {
    const token = localStorage.getItem('bot_token') || '';
    const dbChannel = localStorage.getItem('bot_db_channel') || '';
    
    // TAB STATE
    const [activeTab, setActiveTab] = useState<'compose' | 'calendar' | 'queue' | 'poll' | 'quiz'>(() => {
        try { return localStorage.getItem('channels_active_tab') as any || 'compose'; } catch { return 'compose'; }
    });
    
    const [channels, setChannels] = useState<SavedChannel[]>(() => {
        try { return JSON.parse(localStorage.getItem('saved_channels') || '[]'); } catch { return []; }
    });
    
    const [forceJoinEnabled, setForceJoinEnabled] = useState(() => localStorage.getItem('force_join_enabled') === 'true');
    const [queue, setQueue] = useState<QueueItem[]>(() => { try { return JSON.parse(localStorage.getItem('channel_queue') || '[]'); } catch { return []; } });
    const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
    
    // Compose State
    const [text, setText] = useState('');
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [inlineRows, setInlineRows] = useState<InlineRow[]>([]); 
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isUploading, setIsUploading] = useState(false); 

    // Settings
    const [settings, setSettings] = useState({
        pin: false, silent: false, protect: false, addReactions: false
    });

    // Schedule
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [scheduledDateObj, setScheduledDateObj] = useState<Date>(new Date());
    const [isScheduledEnabled, setIsScheduledEnabled] = useState(false);

    // --- SEPARATE POLL & QUIZ STATE ---
    
    // Poll State (Regular)
    const [pollConfig, setPollConfig] = useState({
        question: '',
        options: ['', ''],
        multipleAnswers: false,
        isAnonymous: true
    });

    // Quiz State
    const [quizConfig, setQuizConfig] = useState({
        question: '',
        options: ['', ''],
        correctOptionId: 0,
        explanation: ''
    });

    const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
    const [newChannelId, setNewChannelId] = useState('');
    const [verifyingChannel, setVerifyingChannel] = useState(false);
    const [sendingProgress, setSendingProgress] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Persistence & Drafts
    useEffect(() => { localStorage.setItem('channels_active_tab', activeTab); }, [activeTab]);
    useEffect(() => { localStorage.setItem('saved_channels', JSON.stringify(channels)); }, [channels]);
    useEffect(() => { localStorage.setItem('channel_queue', JSON.stringify(queue)); }, [queue]);
    useEffect(() => { localStorage.setItem('force_join_enabled', String(forceJoinEnabled)); }, [forceJoinEnabled]);

    // --- AUTO-SAVE DRAFT (RESTORE ON MOUNT) ---
    useEffect(() => {
        const draft = localStorage.getItem('channels_draft');
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (parsed.text) setText(parsed.text);
                if (parsed.inlineRows) setInlineRows(parsed.inlineRows);
                // Note: File objects cannot be restored from JSON, only text/metadata
            } catch {}
        }
    }, []);

    // --- AUTO-SAVE DRAFT (SAVE ON CHANGE) ---
    useEffect(() => {
        const draft = { text, inlineRows };
        localStorage.setItem('channels_draft', JSON.stringify(draft));
    }, [text, inlineRows]);
    
    const handleClearDraft = () => {
        setText('');
        setInlineRows([]);
        setMediaFiles([]);
        localStorage.removeItem('channels_draft');
        setToast({ message: 'پیش‌نویس پاک شد', type: 'success' });
    };

    // Queue Sync
    useEffect(() => {
        const interval = setInterval(() => {
            const q = JSON.parse(localStorage.getItem('channel_queue') || '[]');
            if (q.length !== queue.length || q.some((item: QueueItem, i: number) => item.status !== queue[i]?.status)) {
                setQueue(q);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [queue]);

    // Helpers
    const toggleChannelSelection = (id: string) => setSelectedChannelIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    const toggleSelectAll = () => setSelectedChannelIds(selectedChannelIds.length === channels.length ? [] : channels.map(c => c.id.toString()));
    const toggleChannelLock = (e: React.MouseEvent, id: string | number) => { 
        e.stopPropagation(); 
        setChannels(prev => prev.map(c => c.id.toString() === id.toString() ? { ...c, isLocked: !c.isLocked } : c)); 
    };
    const handleDeleteChannel = (e: React.MouseEvent, id: string | number) => {
        e.stopPropagation();
        setChannels(prev => prev.filter(c => c.id.toString() !== id.toString()));
        setSelectedChannelIds(prev => prev.filter(c => c !== id.toString()));
        setToast({ message: 'کانال با موفقیت حذف شد', type: 'success' });
    };

    const refreshChannelAdminStatus = async (channel: SavedChannel) => {
        try {
            const meRes = await telegramService.getMe(token);
            if (!meRes.ok || !meRes.result) return;
            
            const memberRes = await telegramService.getChatMember(token, String(channel.id), meRes.result.id);
            const isAdmin = memberRes.ok && (memberRes.result?.status === 'administrator' || memberRes.result?.status === 'creator');
            
            setChannels(prev => prev.map(c => c.id === channel.id ? { ...c, isAdmin, statusCheckTime: Date.now() } : c));
            if (isAdmin) setToast({ message: `وضعیت ${channel.title}: ادمین ✅`, type: 'success' });
            else setToast({ message: `وضعیت ${channel.title}: دسترسی محدود ⛔️`, type: 'error' });
        } catch (e) {
            setToast({ message: 'خطا در بررسی وضعیت', type: 'error' });
        }
    };

    const handleAddChannel = async () => {
        if (!newChannelId) return;
        setVerifyingChannel(true);
        let cleanId = newChannelId.trim();
        // Standardize input
        if (!cleanId.startsWith('-100') && !cleanId.startsWith('@')) cleanId = '@' + cleanId.replace(/https:\/\/t.me\//, '');

        try {
            const res = await telegramService.getChat(token, cleanId);
            if (res.ok && res.result) {
                const realId = res.result.id;
                if (channels.some(c => c.id === realId)) {
                    setVerifyingChannel(false);
                    return setToast({ message: 'این کانال قبلاً اضافه شده است', type: 'error' });
                }
                let isAdmin = false;
                try {
                    const meRes = await telegramService.getMe(token);
                    if (meRes.ok && meRes.result) {
                        const adminRes = await telegramService.getChatMember(token, String(realId), meRes.result.id);
                        isAdmin = adminRes.ok && (adminRes.result?.status === 'administrator' || adminRes.result?.status === 'creator');
                    }
                } catch(e) { console.error('Admin check failed', e); }

                const newChannel: SavedChannel = { 
                    ...res.result, id: realId, type: 'channel', title: res.result.title || cleanId, 
                    username: res.result.username || '', addedAt: Date.now(), isAdmin: isAdmin, 
                    statusCheckTime: Date.now(), isLocked: false 
                };
                setChannels(prev => [...prev, newChannel]);
                setSelectedChannelIds([realId.toString()]);
                if (isAdmin) setToast({ message: 'کانال با موفقیت اضافه شد (ادمین هستید) ✅', type: 'success' });
                else setToast({ message: 'کانال اضافه شد اما ربات ادمین نیست! ⚠️', type: 'error' });
            } else { 
                setToast({ message: 'کانال یافت نشد. اگر خصوصی است، آیدی عددی (-100...) وارد کنید.', type: 'error' }); 
            }
        } catch { setToast({ message: 'خطا در ارتباط با تلگرام', type: 'error' }); }
        setNewChannelId('');
        setVerifyingChannel(false);
    };

    const handleSend = async (isScheduled: boolean = false) => {
        if (selectedChannelIds.length === 0) return setToast({ message: 'کانال انتخاب کنید', type: 'error' });
        if (!text && mediaFiles.length === 0) return setToast({ message: 'متن یا فایل الزامی است', type: 'error' });

        // Validate buttons (Link types must have URL)
        for (const row of inlineRows) {
            for (const btn of row.buttons) {
                if (btn.type === 'link' && !btn.value) return setToast({ message: 'لینک دکمه نمی‌تواند خالی باشد', type: 'error' });
            }
        }

        // SANITIZE: Replace legacy <spoiler> with proper <tg-spoiler>
        const cleanText = text.replace(/<spoiler>/g, '<tg-spoiler>').replace(/<\/spoiler>/g, '</tg-spoiler>');

        if (isScheduled && isScheduledEnabled) {
            const newItems: QueueItem[] = selectedChannelIds.map(targetId => ({
                id: Date.now().toString() + Math.random(),
                content: cleanText,
                hasMedia: mediaFiles.length > 0,
                mediaFiles: mediaFiles.map(m => ({ id: m.id, type: m.type, name: m.file?.name || 'file', url: m.preview, previewUrl: m.preview, fileId: m.fileId })),
                rows: inlineRows,
                settings: settings,
                targetChannelId: targetId,
                status: 'pending',
                createdAt: scheduledDateObj.getTime()
            }));
            const newQueue = [...queue, ...newItems];
            setQueue(newQueue);
            localStorage.setItem('channel_queue', JSON.stringify(newQueue));
            setToast({ message: `${newItems.length} پیام در صف زمان‌بندی (به تفکیک کانال) قرار گرفت`, type: 'success' });
            // Cleanup on schedule
            setText(''); setMediaFiles([]); setInlineRows([]);
            localStorage.removeItem('channels_draft');
            return;
        }

        setSendingProgress(true);
        let successCount = 0;
        let failCount = 0;
        const sendOpts = { disable_notification: settings.silent, protect_content: settings.protect };
        
        let kb: any = undefined;
        let finalRows = [...inlineRows];
        
        // --- ADD REACTION BUTTONS (LIKE/DISLIKE) ---
        if (settings.addReactions) {
            finalRows.push({
                id: 'reaction_row',
                buttons: [
                    { id: 'like', text: '👍 0', type: 'callback', value: 'reaction_like' },
                    { id: 'dislike', text: '👎 0', type: 'callback', value: 'reaction_dislike' }
                ]
            });
        }

        if (finalRows.length > 0) {
            kb = { 
                inline_keyboard: finalRows.map(r => r.buttons.map(b => ({ 
                    text: b.text, 
                    url: b.type === 'link' ? b.value : undefined, 
                    callback_data: b.type !== 'link' ? (b.value || 'noop') : undefined 
                }))) 
            };
        }

        for (const targetId of selectedChannelIds) {
            try {
                let res;
                if (mediaFiles.length > 0) {
                    const m = mediaFiles[0];
                    const fileRef = m.fileId || m.file; 
                    
                    if (m.type === 'image') res = await telegramService.sendPhoto(token, targetId, fileRef as any, cleanText, kb, sendOpts);
                    else if (m.type === 'video') res = await telegramService.sendVideo(token, targetId, fileRef as any, cleanText, kb, sendOpts);
                    else res = await telegramService.sendDocument(token, targetId, fileRef as any, cleanText, kb, sendOpts);
                } else {
                    res = await telegramService.sendMessage(token, targetId, cleanText, kb, sendOpts);
                }
                
                if (res.ok) {
                    successCount++;
                    if (settings.pin && res.result) await telegramService.pinChatMessage(token, targetId, res.result.message_id, settings.silent);
                } else {
                    console.error('Telegram Error:', res.description);
                    failCount++;
                }
            } catch (e) {
                console.error('Network/Internal Error:', e);
                failCount++;
            }
        }
        setSendingProgress(false);
        
        if (successCount > 0 && failCount === 0) {
            setToast({ message: `ارسال موفق به ${successCount} کانال`, type: 'success' });
            setText(''); setMediaFiles([]); setInlineRows([]);
            localStorage.removeItem('channels_draft');
        } else if (successCount > 0 && failCount > 0) {
            setToast({ message: `ارسال نیمی موفق: ${successCount} ارسال شد، ${failCount} خطا`, type: 'error' });
        } else {
            setToast({ message: 'خطا در ارسال. لطفا وضعیت ادمین بودن ربات را چک کنید.', type: 'error' });
        }
    };

    const handleSendPoll = async (type: 'regular' | 'quiz') => {
        if (selectedChannelIds.length === 0) return setToast({ message: 'لطفا کانال مقصد را انتخاب کنید', type: 'error' });
        
        const config = type === 'regular' ? pollConfig : quizConfig;
        
        // Validation
        if (!config.question.trim()) return setToast({ message: 'لطفا سوال را وارد کنید', type: 'error' });
        const validOptions = config.options.filter(o => o.trim().length > 0);
        if (validOptions.length < 2) return setToast({ message: 'حداقل ۲ گزینه لازم است', type: 'error' });
        if (validOptions.length > 10) return setToast({ message: 'حداکثر ۱۰ گزینه مجاز است', type: 'error' });

        setSendingProgress(true);
        let successCount = 0;
        
        for (const targetId of selectedChannelIds) {
            try {
                let res;
                if (type === 'regular') {
                    // Regular Poll
                    res = await telegramService.sendPoll(token, targetId, config.question, validOptions, (config as any).isAnonymous, (config as any).multipleAnswers, 'regular');
                } else {
                    // Quiz
                    res = await telegramService.sendPoll(token, targetId, config.question, validOptions, true, false, 'quiz', (config as any).correctOptionId, (config as any).explanation);
                }

                if (res.ok) successCount++;
            } catch (e) { console.error(e); }
        }
        
        setSendingProgress(false);
        if (successCount > 0) setToast({ message: `نظرسنجی به ${successCount} کانال ارسال شد ✅`, type: 'success' });
        else setToast({ message: 'خطا در ارسال نظرسنجی', type: 'error' });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true);
            const newFiles: MediaFile[] = [];
            const fileList: File[] = Array.from(e.target.files);
            
            for (const f of fileList) {
                const type = f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'image';
                const preview = URL.createObjectURL(f);
                let fileId = undefined;
                
                // Attempt to upload to DB Channel if configured
                if (token && dbChannel) {
                    try {
                        const uploadedId = await telegramService.uploadToDb(token, dbChannel, f, type as any);
                        if (uploadedId) fileId = uploadedId;
                    } catch(e) { console.error('DB Upload failed', e); }
                }
                
                newFiles.push({ 
                    id: Date.now().toString() + Math.random(), 
                    file: f, 
                    type: type as any, 
                    preview, 
                    fileId // Stores the file_id if upload succeeded
                });
            }
            
            setMediaFiles(prev => [...prev, ...newFiles]);
            setIsUploading(false);
        }
    };

    const removeMedia = (index: number) => { setMediaFiles(prev => prev.filter((_, i) => i !== index)); };
    const addInlineRow = () => setInlineRows([...inlineRows, { id: Date.now().toString(), buttons: [{ id: Date.now()+'_0', text: 'دکمه', type: 'link', value: '' }] }]);
    const updateButton = (rowId: string, btnId: string, field: any, value: string) => setInlineRows(rows => rows.map(r => r.id === rowId ? { ...r, buttons: r.buttons.map(b => b.id === btnId ? { ...b, [field]: value } : b) } : r));
    const addBtnToRow = (rowId: string) => setInlineRows(rows => rows.map(r => r.id === rowId ? { ...r, buttons: [...r.buttons, { id: Date.now().toString(), text: 'دکمه', type: 'link', value: '' }] } : r));
    const removeRow = (id: string) => setInlineRows(r => r.filter(x => x.id !== id));

    const insertTag = (tag: string) => { 
        if (textAreaRef.current) { 
            const start = textAreaRef.current.selectionStart; 
            const end = textAreaRef.current.selectionEnd; 
            // Fix: Use tg-spoiler instead of spoiler
            const tagCode = tag === 'spoiler' ? 'tg-spoiler' : tag;
            setText(text.substring(0, start) + `<${tagCode}>${text.substring(start, end)}</${tagCode}>` + text.substring(end)); 
        } 
    };
    const handleAIWrite = async () => { setIsLoadingAI(true); setText(await generateBroadcastMessage(text)); setIsLoadingAI(false); };

    if (!token) return <div className="text-center p-10">ابتدا ربات را متصل کنید</div>;

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 animate-fade-in relative pb-10">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <PersianDatePicker isOpen={showDatePicker} onClose={() => setShowDatePicker(false)} initialDate={scheduledDateObj} onSelect={(d) => { setScheduledDateObj(d); setIsScheduledEnabled(true); }}/>

            {/* SIDEBAR - CHANNEL LIST */}
            <div className="w-full lg:w-72 flex flex-col gap-4 lg:h-full">
                 <GlassCard className="flex-1 !p-0 flex flex-col overflow-hidden min-h-[300px]">
                     <div className="p-4 border-b border-white/10 bg-white/5">
                         <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                             <div className="flex items-center gap-2 text-white font-bold text-sm">
                                 <Lock size={16} className={forceJoinEnabled ? "text-red-400" : "text-slate-400"} />
                                 قفل جوین اجباری
                             </div>
                             <div onClick={() => setForceJoinEnabled(!forceJoinEnabled)} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${forceJoinEnabled ? 'bg-red-500' : 'bg-slate-600'}`}>
                                 <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${forceJoinEnabled ? 'left-5' : 'left-0.5'}`}></div>
                             </div>
                         </div>
                         <h3 className="font-bold text-white flex items-center gap-2"><Users size={18}/> لیست کانال‌ها</h3>
                         <div className="flex gap-2 mt-3">
                             <input value={newChannelId} onChange={e=>setNewChannelId(e.target.value)} placeholder="@channel" className="w-full bg-black/20 rounded px-2 text-sm text-white border border-white/10 outline-none dir-ltr text-left"/>
                             <button onClick={handleAddChannel} disabled={verifyingChannel} className="bg-blue-600 rounded px-2 text-white hover:bg-blue-500 disabled:opacity-50">
                                 {verifyingChannel ? <RefreshCw className="animate-spin" size={16}/> : <Plus size={20}/>}
                             </button>
                         </div>
                         <div className="mt-3 flex justify-between items-center">
                             <button onClick={toggleSelectAll} className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"><ListChecks size={14}/> {selectedChannelIds.length === channels.length ? 'لغو همه' : 'انتخاب همه'}</button>
                             <span className="text-xs text-blue-400">{selectedChannelIds.length} انتخاب شده</span>
                         </div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-2 space-y-2">
                         {channels.map(ch => {
                             const isSelected = selectedChannelIds.includes(ch.id.toString());
                             return (
                                 <div key={ch.id} onClick={() => toggleChannelSelection(ch.id.toString())} className={`w-full p-2.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer border relative overflow-hidden group ${isSelected ? 'bg-blue-600/20 border-blue-500 shadow-lg' : 'bg-white/5 border-transparent hover:bg-white/10'} ${ch.isAdmin ? 'border-r-4 border-r-green-500' : 'border-r-4 border-r-red-500'}`}>
                                     <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-500 text-transparent'}`}><Check size={14} strokeWidth={3}/></div>
                                     <div className="flex-1 min-w-0">
                                         <div className="flex justify-between items-center">
                                             <span className={`truncate text-sm font-bold ${isSelected ? 'text-blue-200' : 'text-slate-300'}`}>{ch.title || ch.username}</span>
                                             {ch.isLocked ? <Lock size={12} className="text-red-400"/> : null}
                                         </div>
                                         <div className="flex items-center gap-1 mt-0.5">
                                             {ch.isAdmin ? <span className="text-[9px] text-green-400 bg-green-500/10 px-1 rounded">ادمین ✅</span> : <span className="text-[9px] text-red-400 bg-red-500/10 px-1 rounded flex items-center gap-1"><AlertTriangle size={8}/> دسترسی محدود</span>}
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-1 shrink-0 z-10">
                                         <button onClick={(e) => { e.stopPropagation(); refreshChannelAdminStatus(ch); }} className="text-blue-400 p-1.5 hover:bg-white/10 rounded transition-colors" title="به‌روزرسانی وضعیت"><RefreshCw size={12}/></button>
                                         <button onClick={(e) => toggleChannelLock(e, ch.id)} className={`p-1.5 ${ch.isLocked ? 'text-red-400' : 'text-slate-400'} hover:bg-white/10 rounded transition-colors`} title="تغییر وضعیت قفل">{ch.isLocked ? <Lock size={12}/> : <Unlock size={12}/>}</button>
                                         <button onClick={(e) => handleDeleteChannel(e, ch.id)} className="text-red-400 p-1.5 hover:bg-red-500/20 rounded transition-colors" title="حذف کانال"><Trash2 size={12}/></button>
                                     </div>
                                 </div>
                             );
                         })}
                         {channels.length === 0 && <div className="text-center text-xs text-slate-500 mt-4">هیچ کانالی اضافه نشده است</div>}
                     </div>
                 </GlassCard>
            </div>
            
            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* TABS */}
                <div className="flex justify-between items-center bg-black/20 p-1 rounded-xl border border-white/5 shrink-0 overflow-x-auto">
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('compose')} className={`px-4 py-2 rounded-lg text-sm font-bold flex gap-2 whitespace-nowrap transition-colors ${activeTab === 'compose' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><Megaphone size={16}/> پست جدید</button>
                        <button onClick={() => setActiveTab('poll')} className={`px-4 py-2 rounded-lg text-sm font-bold flex gap-2 whitespace-nowrap transition-colors ${activeTab === 'poll' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}><Vote size={16}/> نظرسنجی</button>
                        <button onClick={() => setActiveTab('quiz')} className={`px-4 py-2 rounded-lg text-sm font-bold flex gap-2 whitespace-nowrap transition-colors ${activeTab === 'quiz' ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-white'}`}><Trophy size={16}/> آزمون (Quiz)</button>
                        <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 rounded-lg text-sm font-bold flex gap-2 whitespace-nowrap transition-colors ${activeTab === 'calendar' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}><CalIcon size={16}/> زمان‌بندی</button>
                        <button onClick={() => setActiveTab('queue')} className={`px-4 py-2 rounded-lg text-sm font-bold flex gap-2 whitespace-nowrap transition-colors ${activeTab === 'queue' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}><Layers size={16}/> صف</button>
                    </div>
                    {/* Draft Indicator */}
                    <div className="hidden lg:flex items-center gap-2 px-3">
                         <Save size={14} className="text-blue-400"/>
                         <span className="text-[10px] text-slate-400">ذخیره خودکار</span>
                         <button onClick={handleClearDraft} className="p-1 text-red-400 hover:text-red-300 transition-colors" title="حذف پیش‌نویس">
                             <Trash2 size={14}/>
                         </button>
                    </div>
                </div>

                <GlassCard className="flex-1 !p-0 overflow-hidden relative flex flex-col">
                    {/* --- COMPOSE TAB --- */}
                    {activeTab === 'compose' && (
                        <div className="flex flex-col xl:flex-row h-full">
                            {/* Editor Column */}
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                 {/* Toolbar */}
                                 <div className="flex items-center gap-1 mb-2 bg-black/20 w-fit p-1 rounded-lg border border-white/5">
                                     <button onClick={() => insertTag('b')} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Bold"><Bold size={14}/></button>
                                     <button onClick={() => insertTag('i')} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Italic"><Italic size={14}/></button>
                                     <button onClick={() => insertTag('code')} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Monospace"><Code size={14}/></button>
                                     <button onClick={() => insertTag('spoiler')} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Spoiler"><Eye size={14}/></button>
                                     <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                                     <button onClick={handleAIWrite} disabled={isLoadingAI} className="p-1.5 hover:bg-purple-500/20 rounded text-purple-400 hover:text-purple-300 flex items-center gap-1 text-xs px-2">
                                         {isLoadingAI ? <RefreshCw className="animate-spin" size={12}/> : <Sparkles size={12}/>} هوش مصنوعی
                                     </button>
                                 </div>

                                 <textarea ref={textAreaRef} value={text} onChange={e => setText(e.target.value)} placeholder="متن پست خود را بنویسید..." className="w-full h-40 bg-black/10 border border-white/10 rounded-xl p-4 text-white resize-none outline-none focus:border-blue-500 transition-colors font-vazir text-sm"/>
                                 
                                 {/* Media Upload */}
                                 <div className="mt-4 flex flex-wrap gap-2">
                                     {mediaFiles.map((m, idx) => ( 
                                         <div key={idx} className="relative w-16 h-16 rounded border border-white/10 overflow-hidden group"> 
                                             <img src={m.preview} className="w-full h-full object-cover"/> 
                                             {m.fileId ? (
                                                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 shadow" title="آپلود شده در دیتابیس"></div>
                                             ) : (
                                                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500 shadow" title="فایل محلی"></div>
                                             )}
                                             <button onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400"><X size={16}/></button>
                                         </div> 
                                     ))}
                                     <label className={`w-16 h-16 border-2 border-dashed border-white/10 hover:border-blue-500 rounded-lg flex flex-col items-center justify-center text-slate-500 cursor-pointer transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}> 
                                         {isUploading ? <RefreshCw className="animate-spin" size={20}/> : <Plus size={20}/>}
                                         <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,video/*,audio/*" disabled={isUploading}/> 
                                     </label>
                                 </div>
                                 <div className="mt-1 flex items-center gap-2">
                                     {isUploading && <span className="text-[10px] text-blue-400">در حال آپلود به دیتابیس...</span>}
                                     {!dbChannel && mediaFiles.some(m => !m.fileId) && <span className="text-[10px] text-orange-400 flex items-center gap-1"><AlertCircle size={10}/> کانال دیتابیس تنظیم نشده. فایل‌ها موقت هستند.</span>}
                                 </div>

                                 {/* Inline Buttons */}
                                 <div className="mt-6 border-t border-white/10 pt-4">
                                     <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><LayoutGrid size={16} className="text-blue-400"/> دکمه‌های شیشه‌ای</h4>
                                     {inlineRows.map(row => (
                                         <div key={row.id} className="flex gap-2 mb-2">
                                             {row.buttons.map(btn => (
                                                 <div key={btn.id} className="flex-1 bg-white/5 p-1 rounded flex gap-1 border border-white/5">
                                                     <input value={btn.text} onChange={e => updateButton(row.id, btn.id, 'text', e.target.value)} className="w-1/2 bg-transparent text-xs text-white outline-none text-center" placeholder="عنوان"/>
                                                     <div className="w-[1px] bg-white/10"></div>
                                                     <input value={btn.value} onChange={e => updateButton(row.id, btn.id, 'value', e.target.value)} className="w-1/2 bg-transparent text-xs text-blue-300 outline-none dir-ltr text-center" placeholder="لینک/دیتا"/>
                                                 </div>
                                             ))}
                                             <button onClick={() => addBtnToRow(row.id)} className="text-slate-500 hover:text-white"><Plus size={16}/></button>
                                             <button onClick={() => removeRow(row.id)} className="text-red-400"><Trash2 size={16}/></button>
                                         </div>
                                     ))}
                                     <button onClick={addInlineRow} className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-2"><Plus size={12}/> افزودن ردیف جدید</button>
                                 </div>

                                 {/* ADVANCED SETTINGS */}
                                 <div className="mt-6 bg-white/5 border border-white/5 rounded-2xl p-5">
                                     <div className="flex items-center gap-2 mb-4">
                                         <Settings size={18} className="text-purple-400"/>
                                         <span className="text-sm font-bold text-white">تنظیمات پیشرفته پیام</span>
                                     </div>
                                     <div className="flex flex-wrap gap-3">
                                         <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all flex-1 min-w-[140px] ${settings.pin ? 'bg-orange-500/10 border-orange-500/50 text-orange-200' : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/10'}`}>
                                             <Pin size={18} className={settings.pin ? 'text-orange-500' : 'opacity-50'}/>
                                             <div className="flex flex-col">
                                                 <span className="text-xs font-bold">سنجاق کردن</span>
                                                 <span className="text-[9px] opacity-70">Pin Message</span>
                                             </div>
                                             <input type="checkbox" className="hidden" checked={settings.pin} onChange={() => setSettings(s => ({...s, pin: !s.pin}))}/>
                                             {settings.pin && <CheckCircle size={14} className="mr-auto text-orange-500"/>}
                                         </label>
                                         <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all flex-1 min-w-[140px] ${settings.silent ? 'bg-blue-500/10 border-blue-500/50 text-blue-200' : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/10'}`}>
                                             <BellOff size={18} className={settings.silent ? 'text-blue-500' : 'opacity-50'}/>
                                             <div className="flex flex-col">
                                                 <span className="text-xs font-bold">ارسال بی‌صدا</span>
                                                 <span className="text-[9px] opacity-70">Silent Mode</span>
                                             </div>
                                             <input type="checkbox" className="hidden" checked={settings.silent} onChange={() => setSettings(s => ({...s, silent: !s.silent}))}/>
                                             {settings.silent && <CheckCircle size={14} className="mr-auto text-blue-500"/>}
                                         </label>
                                         <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all flex-1 min-w-[140px] ${settings.protect ? 'bg-green-500/10 border-green-500/50 text-green-200' : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/10'}`}>
                                             <ShieldAlert size={18} className={settings.protect ? 'text-green-500' : 'opacity-50'}/>
                                             <div className="flex flex-col">
                                                 <span className="text-xs font-bold">محافظت محتوا</span>
                                                 <span className="text-[9px] opacity-70">Anti-Copy</span>
                                             </div>
                                             <input type="checkbox" className="hidden" checked={settings.protect} onChange={() => setSettings(s => ({...s, protect: !s.protect}))}/>
                                             {settings.protect && <CheckCircle size={14} className="mr-auto text-green-500"/>}
                                         </label>
                                         <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all flex-1 min-w-[140px] ${settings.addReactions ? 'bg-purple-500/10 border-purple-500/50 text-purple-200' : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/10'}`}>
                                             <Vote size={18} className={settings.addReactions ? 'text-purple-500' : 'opacity-50'}/>
                                             <div className="flex flex-col">
                                                 <span className="text-xs font-bold">دکمه لایک/دیس‌لایک</span>
                                                 <span className="text-[9px] opacity-70">Add Reactions</span>
                                             </div>
                                             <input type="checkbox" className="hidden" checked={settings.addReactions} onChange={() => setSettings(s => ({...s, addReactions: !s.addReactions}))}/>
                                             {settings.addReactions && <CheckCircle size={14} className="mr-auto text-purple-500"/>}
                                         </label>
                                     </div>
                                 </div>

                                 <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                     <button onClick={() => setShowDatePicker(true)} className={`flex-1 py-3 border border-white/10 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-white/5 ${isScheduledEnabled ? 'text-blue-400 border-blue-500/50' : 'text-slate-400'}`}>
                                         <CalIcon size={16}/> {isScheduledEnabled ? `زمان‌بندی: ${scheduledDateObj.toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})} ${new Intl.DateTimeFormat('fa-IR').format(scheduledDateObj)}` : 'زمان‌بندی ارسال'}
                                     </button>
                                     <button onClick={() => handleSend(isScheduledEnabled)} disabled={sendingProgress || selectedChannelIds.length === 0} className={`flex-[2] py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 text-white transition-all disabled:opacity-50 ${isScheduledEnabled ? 'bg-purple-600 hover:bg-purple-500' : 'bg-green-600 hover:bg-green-500'}`}>
                                         {sendingProgress ? <RefreshCw className="animate-spin" size={18}/> : <Send size={18}/>}
                                         {isScheduledEnabled ? 'ثبت در صف ارسال' : 'ارسال آنی به کانال‌ها'}
                                     </button>
                                 </div>
                            </div>

                            {/* Live Monitor Column */}
                            <div className="w-[360px] bg-[#0f172a] border-r border-white/5 p-4 hidden xl:flex flex-col items-center justify-center relative shadow-2xl z-10">
                                <div className="mb-4 flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-slate-300 font-medium">مانیتور نمایش زنده</span>
                                </div>
                                <div className="telegram-simulator w-[300px] h-[600px] bg-[#1c2431] rounded-[35px] border-[8px] border-[#2d3748] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col">
                                    <div className="bg-[#242f3d] h-14 flex items-center px-4 gap-3 shrink-0 shadow-sm relative z-10">
                                         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs">CH</div>
                                         <div className="flex-1">
                                             <div className="text-white text-xs font-bold">پیش‌نمایش کانال</div>
                                             <div className="text-[10px] text-slate-400">bot subscribers</div>
                                         </div>
                                    </div>
                                    <div className="flex-1 bg-[#0e1621] p-2 overflow-y-auto bg-[url('https://web.telegram.org/img/bg_0.png')] flex flex-col">
                                         <div className="mt-auto mb-2">
                                             <div className="bg-[#182533] rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-none shadow-md overflow-hidden max-w-[95%] ml-auto">
                                                 {mediaFiles.length > 0 && (
                                                     <div className="relative">
                                                         {mediaFiles[0].type === 'image' && <img src={mediaFiles[0].preview} className="w-full h-auto object-cover max-h-[200px]" />}
                                                         {mediaFiles[0].type === 'video' && <video src={mediaFiles[0].preview} className="w-full h-auto object-cover max-h-[200px]" controls={false} />}
                                                         {mediaFiles[0].type === 'audio' && <div className="w-full h-12 bg-[#2b5278] flex items-center justify-center text-white"><Music size={20}/></div>}
                                                         {mediaFiles.length > 1 && <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">+{mediaFiles.length - 1} فایل</div>}
                                                     </div>
                                                 )}
                                                 <div className="p-3 text-white text-sm whitespace-pre-wrap dir-rtl text-right leading-relaxed font-vazir" dangerouslySetInnerHTML={{ __html: text || 'متن پیام شما...' }}></div>
                                                 <div className="px-2 pb-1 text-right"><span className="text-[10px] text-white/40 font-mono">12:30 PM</span></div>
                                             </div>
                                             {inlineRows.length > 0 && (
                                                 <div className="mt-1 space-y-1 max-w-[95%] ml-auto">
                                                     {inlineRows.map(row => (
                                                         <div key={row.id} className="flex gap-1">
                                                             {row.buttons.map(btn => (
                                                                 <button key={btn.id} className="flex-1 bg-[#2b5278]/40 hover:bg-[#2b5278]/60 text-white text-xs py-2 rounded-md backdrop-blur-sm transition-colors border border-white/5">{btn.text}{btn.type === 'link' && <LinkIcon size={10} className="inline ml-1 opacity-50"/>}</button>
                                                             ))}
                                                         </div>
                                                     ))}
                                                 </div>
                                             )}
                                             {settings.addReactions && (
                                                 <div className="mt-1 max-w-[95%] ml-auto flex gap-1">
                                                     <button className="flex-1 bg-[#2b5278]/40 text-white text-xs py-2 rounded-md border border-white/5">👍 0</button>
                                                     <button className="flex-1 bg-[#2b5278]/40 text-white text-xs py-2 rounded-md border border-white/5">👎 0</button>
                                                 </div>
                                             )}
                                         </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ... (Poll and Quiz Tabs remain unchanged) ... */}
                    {activeTab === 'poll' && (
                        <div className="p-6 overflow-y-auto">
                             <div className="max-w-3xl mx-auto space-y-6">
                                 <div className="flex items-center gap-2 mb-4">
                                     <Vote className="text-cyan-400" size={28}/>
                                     <div>
                                         <h3 className="text-xl font-bold text-white">ایجاد نظرسنجی جدید</h3>
                                         <p className="text-xs text-slate-400">نظرسنجی عمومی با قابلیت انتخاب چندگانه</p>
                                     </div>
                                 </div>
                                 
                                 <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-4">
                                     <div>
                                         <label className="text-sm text-slate-300 mb-2 block">سوال نظرسنجی</label>
                                         <input value={pollConfig.question} onChange={e => setPollConfig({...pollConfig, question: e.target.value})} placeholder="سوال خود را مطرح کنید..." className="w-full bg-black/20 p-3 rounded-xl border border-white/10 text-white focus:border-cyan-500 outline-none transition-colors"/>
                                     </div>
                                     
                                     <div className="space-y-2">
                                         <label className="text-sm text-slate-300 mb-2 block">گزینه‌ها</label>
                                         {pollConfig.options.map((opt, i) => (
                                             <div key={i} className="flex gap-2 items-center">
                                                 <span className="text-xs text-slate-500 w-4">{i+1}.</span>
                                                 <input value={opt} onChange={e => {const n=[...pollConfig.options]; n[i]=e.target.value; setPollConfig({...pollConfig, options: n})}} placeholder={`گزینه ${i+1}`} className="flex-1 bg-black/20 p-3 rounded-lg border border-white/10 text-white focus:border-cyan-500 outline-none transition-colors"/>
                                                 {pollConfig.options.length > 2 && <button onClick={()=>{const n=[...pollConfig.options]; n.splice(i,1); setPollConfig({...pollConfig, options: n})}} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16}/></button>}
                                             </div>
                                         ))}
                                         {pollConfig.options.length < 10 && <button onClick={()=>setPollConfig({...pollConfig, options: [...pollConfig.options, '']})} className="text-cyan-400 text-sm flex items-center gap-1 hover:underline mt-2"><Plus size={14}/> افزودن گزینه</button>}
                                     </div>
                                 </div>

                                 <div className="flex gap-4">
                                     <label className={`flex-1 p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-colors ${pollConfig.isAnonymous ? 'bg-cyan-900/20 border-cyan-500/50' : 'bg-black/20 border-white/5'}`}>
                                         <input type="checkbox" className="hidden" checked={pollConfig.isAnonymous} onChange={e=>setPollConfig({...pollConfig, isAnonymous: e.target.checked})}/>
                                         <div className={`w-5 h-5 rounded border flex items-center justify-center ${pollConfig.isAnonymous ? 'bg-cyan-500 border-cyan-500' : 'border-slate-500'}`}>{pollConfig.isAnonymous && <Check size={14} className="text-white"/>}</div>
                                         <span className="text-sm text-white">رای‌گیری ناشناس</span>
                                     </label>
                                     <label className={`flex-1 p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-colors ${pollConfig.multipleAnswers ? 'bg-cyan-900/20 border-cyan-500/50' : 'bg-black/20 border-white/5'}`}>
                                         <input type="checkbox" className="hidden" checked={pollConfig.multipleAnswers} onChange={e=>setPollConfig({...pollConfig, multipleAnswers: e.target.checked})}/>
                                         <div className={`w-5 h-5 rounded border flex items-center justify-center ${pollConfig.multipleAnswers ? 'bg-cyan-500 border-cyan-500' : 'border-slate-500'}`}>{pollConfig.multipleAnswers && <Check size={14} className="text-white"/>}</div>
                                         <span className="text-sm text-white">انتخاب چند گزینه</span>
                                     </label>
                                 </div>

                                 <button onClick={() => handleSendPoll('regular')} disabled={sendingProgress} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2">
                                     {sendingProgress ? <RefreshCw className="animate-spin"/> : <Send/>}
                                     ارسال نظرسنجی
                                 </button>
                             </div>
                        </div>
                    )}

                    {/* QUIZ TAB */}
                    {activeTab === 'quiz' && (
                        <div className="p-6 overflow-y-auto">
                             <div className="max-w-3xl mx-auto space-y-6">
                                 <div className="flex items-center gap-2 mb-4">
                                     <Trophy className="text-yellow-400" size={28}/>
                                     <div>
                                         <h3 className="text-xl font-bold text-white">ایجاد آزمون (Quiz)</h3>
                                         <p className="text-xs text-slate-400">آزمون با یک گزینه صحیح و توضیحات تشریحی</p>
                                     </div>
                                 </div>
                                 
                                 <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-4">
                                     <div>
                                         <label className="text-sm text-slate-300 mb-2 block">سوال آزمون</label>
                                         <input value={quizConfig.question} onChange={e => setQuizConfig({...quizConfig, question: e.target.value})} placeholder="سوال آزمون را وارد کنید..." className="w-full bg-black/20 p-3 rounded-xl border border-white/10 text-white focus:border-yellow-500 outline-none transition-colors"/>
                                     </div>
                                     
                                     <div className="space-y-2">
                                         <label className="text-sm text-slate-300 mb-2 block">گزینه‌ها (گزینه صحیح را تیک بزنید)</label>
                                         {quizConfig.options.map((opt, i) => (
                                             <div key={i} className="flex gap-2 items-center">
                                                 <button 
                                                    onClick={()=>setQuizConfig({...quizConfig, correctOptionId: i})} 
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${quizConfig.correctOptionId === i ? 'bg-green-500 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-black/20 border-white/10 text-slate-500 hover:border-white/30'}`}
                                                    title="انتخاب به عنوان پاسخ صحیح"
                                                 >
                                                     {quizConfig.correctOptionId === i ? <CheckCircle size={20}/> : <div className="w-4 h-4 rounded-full border border-slate-500"></div>}
                                                 </button>
                                                 <input value={opt} onChange={e => {const n=[...quizConfig.options]; n[i]=e.target.value; setQuizConfig({...quizConfig, options: n})}} placeholder={`گزینه ${i+1}`} className={`flex-1 bg-black/20 p-3 rounded-lg border text-white outline-none transition-colors ${quizConfig.correctOptionId === i ? 'border-green-500/50' : 'border-white/10 focus:border-yellow-500'}`}/>
                                                 {quizConfig.options.length > 2 && <button onClick={()=>{const n=[...quizConfig.options]; n.splice(i,1); setQuizConfig({...quizConfig, options: n, correctOptionId: 0})}} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16}/></button>}
                                             </div>
                                         ))}
                                         {quizConfig.options.length < 10 && <button onClick={()=>setQuizConfig({...quizConfig, options: [...quizConfig.options, '']})} className="text-yellow-400 text-sm flex items-center gap-1 hover:underline mt-2"><Plus size={14}/> افزودن گزینه</button>}
                                     </div>

                                     <div>
                                         <label className="text-sm text-slate-300 mb-2 block flex items-center gap-2"><HelpCircle size={14}/> توضیحات تکمیلی (Explanation)</label>
                                         <textarea value={quizConfig.explanation} onChange={e => setQuizConfig({...quizConfig, explanation: e.target.value})} placeholder="متنی که پس از انتخاب گزینه توسط کاربر نمایش داده می‌شود (نکته آموزشی)..." className="w-full bg-black/20 p-3 rounded-xl border border-white/10 text-white h-24 resize-none focus:border-yellow-500 outline-none transition-colors"/>
                                         <p className="text-[10px] text-slate-500 mt-1">حداکثر ۲۰۰ کاراکتر</p>
                                     </div>
                                 </div>

                                 <button onClick={() => handleSendPoll('quiz')} disabled={sendingProgress} className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-yellow-500/20 transition-all flex items-center justify-center gap-2">
                                     {sendingProgress ? <RefreshCw className="animate-spin"/> : <Trophy/>}
                                     ارسال آزمون
                                 </button>
                             </div>
                        </div>
                    )}

                    {/* QUEUE TAB */}
                    {activeTab === 'queue' && (
                        <div className="p-6 overflow-y-auto">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Layers size={20}/> صف انتظار ارسال</h3>
                            {queue.length === 0 ? <div className="text-center text-slate-500 py-10">صف خالی است</div> : (
                                <div className="space-y-2">
                                    {queue.filter(q => q.targetChannelId !== 'all').map(q => {
                                        const channelInfo = channels.find(c => String(c.id) === String(q.targetChannelId));
                                        const date = new Date(q.createdAt);
                                        return (
                                            <div key={q.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-center bg-black/30 p-2 rounded-lg min-w-[70px]">
                                                        <span className="text-[10px] text-slate-400">{date.toLocaleDateString('fa-IR')}</span>
                                                        <span className="text-sm font-bold text-white">{date.toLocaleTimeString('fa-IR', {hour:'2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                                                                {channelInfo ? (channelInfo.title || channelInfo.username) : q.targetChannelId}
                                                            </span>
                                                            {q.hasMedia && <span className="text-[10px] text-purple-400 border border-purple-500/30 px-1 rounded">مدیا</span>}
                                                        </div>
                                                        <div className="text-white/80 text-sm line-clamp-1 max-w-[200px]">{q.content || 'پست بدون متن'}</div>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${q.status==='sent'?'bg-green-500/20 text-green-400':q.status==='failed'?'bg-red-500/20 text-red-400':'bg-orange-500/20 text-orange-400'}`}>
                                                    {q.status==='pending'?'در انتظار':q.status==='sent'?'ارسال شد':'خطا'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};