import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { MessageCircle, Send, AlertTriangle, CheckCircle, Clock, MessageSquare, Loader2 } from 'lucide-react';

interface Ticket {
    id?: string | number;
    message?: string;
    content?: string;
    text?: string;
    admin_reply?: string;
    adminReply?: string;
    reply?: string;
    created_at?: string | number;
    createdAt?: string | number;
    date?: string | number;
}

export const Support: React.FC = () => {
    const [newMessage, setNewMessage] = useState('');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    let licenseCode = '';
    try {
        const licenseCache = JSON.parse(localStorage.getItem('license_cache') || '{}');
        licenseCode = licenseCache.code || '';
    } catch (e) {
        console.error('Error reading license_cache', e);
    }

    const fetchTickets = async () => {
        if (!licenseCode) return;
        setIsLoading(true);
        try {
            const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/tickets/list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: licenseCode })
            });
            if (!res.ok) throw new Error('API request failed');
            const data = await res.json();
            
            if (Array.isArray(data)) {
                setTickets(data);
            } else if (data && Array.isArray(data.tickets)) {
                setTickets(data.tickets);
            } else if (data && Array.isArray(data.data)) {
                setTickets(data.data);
            } else if (data && data.result && Array.isArray(data.result)) {
                setTickets(data.result);
            } else {
                setTickets([]);
            }
        } catch (err) {
            console.error('Error fetching tickets:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (licenseCode) {
            fetchTickets();
        }
    }, [licenseCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        if (!licenseCode) {
            setStatusMsg({ text: 'خطا: لایسنس‌کد معتبر یافت نشد. لطفا ابتدا پنل را فعال کنید.', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        setStatusMsg(null);
        try {
            const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/tickets/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: licenseCode, message: newMessage.trim() })
            });
            const data = await res.json();
            if (res.ok || data.ok) {
                setNewMessage('');
                setStatusMsg({ text: 'تیکت شما با موفقیت ثبت شد و در صف بررسی قرار گرفت.', type: 'success' });
                await fetchTickets();
            } else {
                setStatusMsg({ text: data.description || 'خطا در ثبت تیکت. لطفا دوباره تلاش کنید.', type: 'error' });
            }
        } catch (err) {
            console.error('Error submitting ticket:', err);
            setStatusMsg({ text: 'خطا در ارتباط با سرور. لطفا اتصال خود را بررسی کنید.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (val: any) => {
        if (!val) return 'ثبت شده';
        try {
            const d = new Date(val);
            if (isNaN(d.getTime())) return String(val);
            return new Intl.DateTimeFormat('fa-IR', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'Asia/Tehran'
            }).format(d);
        } catch (e) {
            return String(val);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400">
                    <MessageCircle size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold dark:text-white text-slate-800">پشتیبانی و ثبت تیکت</h2>
                    <p className="text-sm text-slate-500">ارتباط مستقیم با کارشناسان پشتیبانی پنل مدیریت</p>
                </div>
            </div>

            {/* Check Activation Status */}
            {!licenseCode && (
                <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-center gap-3">
                    <AlertTriangle size={20} />
                    <span>خطا: لایسنس‌کد معتبر یافت نشد. لطفا ابتدا از بخش داشبورد یا اتصال، پنل را فعال کنید.</span>
                </div>
            )}

            {licenseCode && (
                <div className="grid grid-cols-1 gap-8">
                    {/* Send Ticket Form */}
                    <GlassCard title="ثبت تیکت پشتیبانی جدید">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="سوال یا مشکل خود را به صورت کامل و واضح شرح دهید..."
                                    className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white text-sm h-36 resize-none outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500 leading-relaxed"
                                    required
                                />
                            </div>

                            {statusMsg && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${statusMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {statusMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                                    {statusMsg.text}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newMessage.trim()}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/20 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <Send size={18} className="rotate-180" />
                                    )}
                                    ارسال تیکت پشتیبانی
                                </button>
                            </div>
                        </form>
                    </GlassCard>

                    {/* Previous Tickets List */}
                    <GlassCard title="تاریخچه تیکت‌ها و پاسخ‌ها">
                        {isLoading && tickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                                <span className="text-slate-400 text-sm">در حال بارگذاری تیکت‌ها...</span>
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 border border-dashed border-white/5 rounded-2xl">
                                <MessageSquare size={48} className="text-slate-600 mb-3" />
                                <p className="font-bold text-white/80 mb-1">تاکنون تیکتی ثبت نکرده‌اید</p>
                                <p className="text-xs text-slate-400">با استفاده از فرم بالا می‌توانید پیام خود را برای پشتیبانی ارسال کنید.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1.5 custom-scrollbar">
                                {tickets.slice().reverse().map((ticket, index) => {
                                    const userMsg = ticket.message || ticket.content || ticket.text || '';
                                    const replyMsg = ticket.admin_reply || ticket.adminReply || ticket.reply || '';
                                    const dateVal = ticket.created_at || ticket.createdAt || ticket.date || '';

                                    return (
                                        <div 
                                            key={ticket.id || index} 
                                            className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4 hover:border-white/10 transition-all duration-300"
                                        >
                                            {/* Header */}
                                            <div className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Clock size={14} />
                                                    <span>{formatDate(dateVal)}</span>
                                                </div>
                                                
                                                {replyMsg ? (
                                                    <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full font-medium">
                                                        پاسخ داده شده ✅
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full font-medium">
                                                        در انتظار پاسخ ⏳
                                                    </span>
                                                )}
                                            </div>

                                            {/* User Message content */}
                                            <div className="text-sm text-slate-200 leading-relaxed bg-black/10 p-4 rounded-xl border border-white/5">
                                                {userMsg}
                                            </div>

                                            {/* Admin Reply content */}
                                            {replyMsg && (
                                                <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 space-y-2">
                                                    <div className="text-blue-400 font-bold text-xs flex items-center gap-1.5">
                                                        <MessageSquare size={14} />
                                                        <span>پاسخ پشتیبانی:</span>
                                                    </div>
                                                    <p className="text-sm text-slate-300 leading-relaxed">
                                                        {replyMsg}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
