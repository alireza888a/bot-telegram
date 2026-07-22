
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Bot, Save, Globe, Lock, CheckCircle, XCircle, RefreshCw, Trash2, ShieldCheck, Activity, Terminal, MessageSquare } from 'lucide-react';
import { telegramService, TelegramUser, WebhookInfo } from '../services/telegramService';
import { syncNow } from '../services/cloudSync';

interface LogMessage {
    id: number;
    time: string;
    user: string;
    text: string;
    type: 'incoming' | 'outgoing' | 'system';
}

export const BotConnect: React.FC = () => {
  // Inputs
  const [token, setToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('bot_webhook_url') || '');
  
  // App State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Bot Data
  const [botInfo, setBotInfo] = useState<TelegramUser | null>(null);
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);

  // Live Monitor State (Listener)
  const [logs, setLogs] = useState<LogMessage[]>(() => {
      try { return JSON.parse(localStorage.getItem('bot_logs') || '[]'); } catch { return []; }
  });
  
  const [autoReply, setAutoReply] = useState(() => {
      return localStorage.getItem('bot_auto_reply') !== 'false';
  });

  // Listen to Global Bot Events from BotEngine
  useEffect(() => {
      const handleLog = (e: any) => {
          setLogs(prev => [...prev, e.detail].slice(-50)); // Keep last 50
      };
      window.addEventListener('bot-log', handleLog);
      return () => window.removeEventListener('bot-log', handleLog);
  }, []);

  // Sync AutoReply Setting
  useEffect(() => {
      localStorage.setItem('bot_auto_reply', String(autoReply));
  }, [autoReply]);

  // Load token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('bot_token');
    if (savedToken) {
      setToken(savedToken);
      checkConnection(savedToken);
    }
  }, []);

  // Auto-scroll logic
  const logsEndRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const clearLogs = () => {
      setLogs([]);
      localStorage.removeItem('bot_logs');
  };

  const checkConnection = async (apiToken: string) => {
    setIsLoading(true);
    setError(null);
    setBotInfo(null);
    setSuccessMsg(null);
    
    const data = await telegramService.getMe(apiToken);
    
    if (data.ok && data.result) {
      setBotInfo(data.result);
      localStorage.setItem('bot_token', apiToken);
      syncNow();

      let licenseCode = '';
      try {
        const licenseCache = JSON.parse(localStorage.getItem('license_cache') || '{}');
        licenseCode = licenseCache.code || '';
      } catch (e) {}

      if (licenseCode) {
        const centralWebhookUrl = `https://corepanel-api.tajikr450.workers.dev/api/bot/webhook/${licenseCode}`;
        const whRes = await telegramService.setWebhook(apiToken, centralWebhookUrl);
        if (whRes.ok) {
          localStorage.setItem('bot_webhook_url', centralWebhookUrl);
          setWebhookUrl(centralWebhookUrl);
          setSuccessMsg('✅ ربات شما فعال شد و مستقیم به سرور متصله — هیچ کار دیگری لازم نیست.');
        }
      }
      
      const whData = await telegramService.getWebhookInfo(apiToken);
      if (whData.ok && whData.result) {
        setWebhookInfo(whData.result);
        if (whData.result.url) setWebhookUrl(whData.result.url); 
        localStorage.setItem('bot_webhook_url', whData.result.url || '');
      }
    } else {
      setError(data.description || 'توکن نامعتبر است یا ارتباط برقرار نشد.');
    }
    
    setIsLoading(false);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setError('لطفا توکن را وارد کنید.');
    checkConnection(token);
  };

  const handleUpdateWebhook = async () => {
    if (!token) return;
    setIsLoading(true);
    
    let res;
    if (webhookUrl) {
      res = await telegramService.setWebhook(token, webhookUrl);
    } else {
      res = await telegramService.deleteWebhook(token);
    }

    if (res.ok) {
      setSuccessMsg(webhookUrl ? 'وب‌هوک با موفقیت تنظیم شد (موتور داخلی متوقف شد).' : 'وب‌هوک حذف شد (موتور داخلی فعال شد).');
      // Update local storage so BotEngine reacts
      localStorage.setItem('bot_webhook_url', webhookUrl);
      
      const whData = await telegramService.getWebhookInfo(token);
      if (whData.ok && whData.result) {
          setWebhookInfo(whData.result);
      }
    } else {
      setError(res.description || 'خطا در تنظیم وب‌هوک');
    }
    setIsLoading(false);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('bot_token');
    localStorage.removeItem('bot_logs');
    setLogs([]);
    setBotInfo(null);
    setWebhookInfo(null);
    setToken('');
    setWebhookUrl('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          اتصال به شبکه تلگرام
        </h2>
        <p className="dark:text-white/60 text-slate-500">
          وضعیت اتصال ربات خود را به صورت لحظه‌ای بررسی و مدیریت کنید
        </p>
      </div>

      <GlassCard className="relative overflow-hidden border-t-4 border-t-blue-500">
        {!botInfo ? (
          <form onSubmit={handleConnect} className="space-y-6">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
               <ShieldCheck className="text-yellow-500 shrink-0 mt-1" />
               <div className="text-sm dark:text-yellow-200/80 text-yellow-800">
                  <p className="font-bold mb-1">نکته امنیتی:</p>
                  <p>درخواست‌ها مستقیماً از مرورگر شما به سرور تلگرام ارسال می‌شوند (Client-Side). لطفاً از روشن بودن VPN اطمینان حاصل کنید.</p>
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-white/80 text-slate-700 flex items-center gap-2">
                <Lock size={16} className="text-purple-400" />
                توکن ربات (Bot Token)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="w-full dark:bg-black/20 bg-white/50 border dark:border-white/10 border-slate-300 rounded-xl p-4 pl-12 dark:text-white text-slate-800 focus:outline-none focus:border-purple-500 transition-all font-mono text-left dir-ltr shadow-inner"
                  dir="ltr"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500 opacity-50">
                   <Bot size={20} />
                </div>
              </div>
            </div>

            {successMsg && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2 animate-slide-up">
                <CheckCircle size={16} />
                {successMsg}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center gap-2 animate-slide-up">
                <XCircle size={16} />
                {error}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !token}
                className="group relative px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg overflow-hidden transition-all disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  {isLoading ? 'در حال بررسی...' : 'بررسی و اتصال'}
                  {!isLoading && <Activity size={20} />}
                </span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8 animate-fade-in">
             {successMsg && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2 animate-slide-up">
                  <CheckCircle size={16} />
                  {successMsg}
                </div>
             )}
             <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b dark:border-white/10 border-slate-200">
                <div className="flex items-center gap-5">
                   <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 p-[2px] shadow-xl">
                      <div className="w-full h-full rounded-full bg-[#1c2431] flex items-center justify-center text-white text-2xl font-bold uppercase">
                         {botInfo.username.substring(0, 2)}
                      </div>
                   </div>
                   <div>
                      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                         {botInfo.first_name}
                         <CheckCircle size={20} className="text-green-400 fill-green-400/20" />
                      </h3>
                      <p className="dark:text-white/50 text-slate-500 font-mono text-sm mt-1">@{botInfo.username}</p>
                   </div>
                </div>
                
                <button 
                  onClick={handleDisconnect}
                  className="px-4 py-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-sm"
                >
                   <Trash2 size={16} />
                   قطع اتصال
                </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <h4 className="font-bold dark:text-white/90 text-slate-800 flex items-center gap-2">
                      <Globe size={18} className="text-cyan-400"/>
                      تنظیمات وب‌هوک
                   </h4>
                   <div className="flex gap-2">
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://your-domain.com/api/webhook"
                        className="flex-1 dark:bg-black/20 bg-white/50 border dark:border-white/10 border-slate-300 rounded-lg p-3 dark:text-white text-slate-800 font-mono text-sm text-left dir-ltr"
                        dir="ltr"
                      />
                      <button 
                        onClick={handleUpdateWebhook}
                        disabled={isLoading}
                        className="px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center justify-center"
                      >
                         {isLoading ? <RefreshCw size={18} className="animate-spin"/> : <Save size={18} />}
                      </button>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className={`p-4 rounded-xl border ${webhookInfo?.url ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                      <p className="text-xs opacity-70 mb-1">وضعیت موتور داخلی</p>
                      <p className={`font-bold ${webhookInfo?.url ? 'text-red-400' : 'text-green-400'}`}>
                         {webhookInfo?.url ? '🔴 متوقف (وب‌هوک فعال است)' : '🟢 فعال (در حال مانیتورینگ)'}
                      </p>
                   </div>
                </div>
             </div>

             <div className="border-t dark:border-white/10 border-slate-200 pt-6">
                 <div className="flex justify-between items-center mb-4">
                     <h4 className="font-bold dark:text-white/90 text-slate-800 flex items-center gap-2">
                        <Terminal size={18} className="text-green-400"/>
                        لاگ‌های زنده
                     </h4>
                     <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                checked={autoReply} 
                                onChange={(e) => setAutoReply(e.target.checked)}
                                className="w-4 h-4 rounded bg-white/10 border border-white/20 text-blue-500"
                            />
                            <span className="dark:text-white/60 text-slate-500">پاسخگویی خودکار فعال</span>
                        </label>
                        <button onClick={clearLogs} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs rounded-lg transition-colors"><Trash2 size={12} /></button>
                     </div>
                 </div>

                 <div className="bg-[#1e1e1e] rounded-xl p-4 h-[300px] overflow-y-auto font-mono text-xs custom-scrollbar border border-white/10 shadow-inner">
                     {logs.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-2">
                             <MessageSquare size={30}/>
                             <p>منتظر دریافت پیام...</p>
                         </div>
                     ) : (
                         <div className="space-y-2">
                             {logs.map(log => (
                                 <div key={log.id} className={`flex gap-2 animate-slide-up ${log.type === 'system' ? 'opacity-50' : ''}`}>
                                     <span className="text-white/40">[{log.time}]</span>
                                     {log.type === 'incoming' && <span className="text-green-400 font-bold">{'<--'} {log.user}:</span>}
                                     {log.type === 'outgoing' && <span className="text-blue-400 font-bold">{'-->'} {log.user}:</span>}
                                     {log.type === 'system' && <span className="text-yellow-400 font-bold">[SYS]:</span>}
                                     <span className="text-white/90 break-all">{log.text}</span>
                                 </div>
                             ))}
                             <div ref={logsEndRef} />
                         </div>
                     )}
                 </div>
             </div>

          </div>
        )}
      </GlassCard>
    </div>
  );
};
