import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { MessageSquare, RefreshCw, Send, CheckCircle2, Clock, User, MessageCircle } from 'lucide-react';
import { BotTicket } from '../types';

export const CustomerTickets: React.FC = () => {
  const [tickets, setTickets] = useState<BotTicket[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'answered'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const getLicenseCode = (): string => {
    const licenseCacheStr = localStorage.getItem('license_cache') || '{}';
    try {
      const parsed = JSON.parse(licenseCacheStr);
      return parsed.code || licenseCacheStr;
    } catch {
      return licenseCacheStr;
    }
  };

  const fetchTicketsApi = async (statusFilter: 'all' | 'open' | 'answered', beforeCursor?: number | null) => {
    const code = getLicenseCode();
    const payload: any = {
      code,
      limit: 30
    };

    if (statusFilter !== 'all') {
      payload.status = statusFilter;
    }

    if (beforeCursor) {
      payload.before = beforeCursor;
    }

    const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/support-tickets/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return await res.json();
  };

  const refreshTickets = async () => {
    setIsRefreshing(true);
    try {
      const result = await fetchTicketsApi(filter);
      if (result.ok) {
        setTickets(result.tickets || []);
        setHasMore(!!result.hasMore);
        setNextBefore(result.nextBefore ?? null);
      } else {
        alert('خطا در دریافت تیکت‌ها: ' + (result.reason || 'نامشخص'));
      }
    } catch (e) {
      console.error('Error fetching tickets:', e);
      alert('خطا در ارتباط با سرور هنگام دریافت تیکت‌ها.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextBefore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const result = await fetchTicketsApi(filter, nextBefore);
      if (result.ok) {
        setTickets(prev => [...prev, ...(result.tickets || [])]);
        setHasMore(!!result.hasMore);
        setNextBefore(result.nextBefore ?? null);
      } else {
        alert('خطا در دریافت ادامه تیکت‌ها: ' + (result.reason || 'نامشخص'));
      }
    } catch (e) {
      console.error('Error loading more tickets:', e);
      alert('خطا در دریافت ادامه تیکت‌ها.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    refreshTickets();
  }, [filter]);

  const handleReplyChange = (ticketId: string, text: string) => {
    setReplyTexts(prev => ({ ...prev, [ticketId]: text }));
  };

  const handleSendReply = async (ticket: BotTicket) => {
    const replyText = (replyTexts[ticket.id] || '').trim();
    if (!replyText) {
      alert('لطفاً متن پاسخ را وارد کنید.');
      return;
    }

    const code = getLicenseCode();
    if (!code) {
      alert('کد لایسنس یافت نشد. لطفاً ابتدا لایسنس خود را بررسی کنید.');
      return;
    }

    setSendingId(ticket.id);
    try {
      const res = await fetch('https://corepanel-api.tajikr450.workers.dev/api/ticket/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, ticketId: ticket.id, reply: replyText })
      });
      const result = await res.json();

      if (result.ok) {
        alert('پاسخ ارسال شد.');
        // Clear reply text for this ticket
        setReplyTexts(prev => ({ ...prev, [ticket.id]: '' }));
        // Refresh cloud & state
        await refreshTickets();
      } else {
        alert('خطا: ' + (result.reason || 'نامشخص'));
      }
    } catch (err: any) {
      alert('خطا در ارتباط با سرور: ' + (err?.message || 'خطای شبکه'));
    } finally {
      setSendingId(null);
    }
  };

  const formatDate = (dateVal: number | string) => {
    if (!dateVal) return 'نامشخص';
    try {
      const d = typeof dateVal === 'number' ? new Date(dateVal) : new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return String(dateVal);
    }
  };

  const openCount = tickets.filter(t => t.status === 'open').length;
  const answeredCount = tickets.filter(t => t.status === 'answered').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-blue-500" />
            تیکت‌های پشتیبانی کاربران ربات
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            پیام‌ها و سؤالات خریداران ربات شما در اینجا نمایش داده می‌شوند و می‌توانید مستقیم پاسخ دهید.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={refreshTickets}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>بروزرسانی</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-white/5 dark:bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <span>همه تیکت‌ها</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20">{tickets.length}</span>
        </button>

        <button
          onClick={() => setFilter('open')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            filter === 'open'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
              : 'bg-white/5 dark:bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Clock size={14} />
          <span>پاسخ‌نداده (باز)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20">{openCount}</span>
        </button>

        <button
          onClick={() => setFilter('answered')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            filter === 'answered'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-white/5 dark:bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 size={14} />
          <span>پاسخ داده‌شده</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20">{answeredCount}</span>
        </button>
      </div>

      {/* Ticket List */}
      {tickets.length === 0 ? (
        <GlassCard className="text-center py-12">
          <MessageCircle className="mx-auto text-slate-500 mb-3" size={40} />
          <h3 className="font-bold text-slate-300 text-sm">تیکتی یافت نشد</h3>
          <p className="text-xs text-slate-500 mt-1">
            {filter === 'open'
              ? 'هیچ تیکت پاسخ‌نداده‌ای وجود ندارد.'
              : filter === 'answered'
              ? 'هیچ تیکت پاسخ‌داده‌شده‌ای وجود ندارد.'
              : 'هنوز هیچ تیکتی از طرف خریداران ربات دریافت نشده است.'}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {tickets.map(ticket => (
              <GlassCard
                key={ticket.id}
                className={`border-l-4 transition-all ${
                  ticket.status === 'open'
                    ? 'border-l-amber-500 bg-amber-500/5'
                    : 'border-l-emerald-500 bg-emerald-500/5'
                }`}
              >
                <div className="space-y-4">
                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-bold text-xs bg-white/10 text-blue-300 px-2.5 py-1 rounded-lg border border-white/10">
                        {ticket.id}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        <User size={14} className="text-slate-400" />
                        <span>{ticket.userFirstName || 'کاربر ربات'}</span>
                        <span className="text-slate-500 font-mono text-[11px] dir-ltr">({ticket.userId})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(ticket.createdAt)}
                      </span>
                      {ticket.status === 'open' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Clock size={11} />
                          در انتظار پاسخ
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          پاسخ داده شد
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Message */}
                  <div className="bg-black/20 border border-white/5 rounded-xl p-3.5 text-sm leading-relaxed dark:text-slate-200 text-slate-800 whitespace-pre-wrap">
                    <p className="text-[11px] font-bold text-slate-400 mb-1">متن سوال خریدار:</p>
                    {ticket.message}
                  </div>

                  {/* Reply section: Open vs Answered */}
                  {ticket.status === 'open' ? (
                    <div className="space-y-2 pt-1">
                      <label className="block text-xs font-bold text-slate-300">پاسخ به این تیکت:</label>
                      <textarea
                        rows={3}
                        value={replyTexts[ticket.id] || ''}
                        onChange={e => handleReplyChange(ticket.id, e.target.value)}
                        placeholder="متن پاسخ خود را بنویسید..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors resize-none"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleSendReply(ticket)}
                          disabled={sendingId === ticket.id}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {sendingId === ticket.id ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                          <span>ارسال پاسخ</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-emerald-400 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} />
                          پاسخ ارسال‌شده توسط ادمین:
                        </span>
                        {ticket.repliedAt && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {formatDate(ticket.repliedAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap pt-1">
                        {ticket.adminReply || 'پاسخ ثبت شده است.'}
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>
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
                <span>نمایش تیکت‌های قدیمی‌تر</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
