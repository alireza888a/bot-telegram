
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    Users, Send, Activity, Bot, ArrowRight, Zap, ShieldCheck, 
    Layers, Command, Settings, Megaphone, CheckCircle, AlertCircle, 
    Clock, RefreshCw, BarChart3 
} from 'lucide-react';
import { telegramService, TelegramUser } from '../services/telegramService';

// --- TYPES ---
interface LogItem {
    id: number;
    time: string;
    user: string;
    text: string;
    type: 'incoming' | 'outgoing' | 'system';
}

interface DashboardProps {
    onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [token, setToken] = useState(localStorage.getItem('bot_token') || '');
  const [botInfo, setBotInfo] = useState<TelegramUser | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null); // null=checking, true=online, false=offline
  const [isLoading, setIsLoading] = useState(false);

  // Real-Time Stats
  const [stats, setStats] = useState({
      channelsCount: 0,
      queuePending: 0,
      commandsCount: 0,
      totalLogs: 0
  });

  const [recentLogs, setRecentLogs] = useState<LogItem[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // --- LOAD DATA ---
  useEffect(() => {
      if (!token) return;

      const loadDashboardData = async () => {
          setIsLoading(true);

          // 1. Check Bot Status (Live)
          try {
              const me = await telegramService.getMe(token);
              if (me.ok && me.result) {
                  setBotInfo(me.result);
                  setIsOnline(true);
              } else {
                  setIsOnline(false);
              }
          } catch {
              setIsOnline(false);
          }

          // 2. Load Stored Data (Real Metrics)
          try {
              const channels = JSON.parse(localStorage.getItem('saved_channels') || '[]');
              const queue = JSON.parse(localStorage.getItem('channel_queue') || '[]');
              const cmds = JSON.parse(localStorage.getItem('bot_commands') || '[]');
              const logs = JSON.parse(localStorage.getItem('bot_logs') || '[]');

              setStats({
                  channelsCount: channels.length,
                  queuePending: queue.filter((q: any) => q.status === 'pending').length,
                  commandsCount: cmds.length,
                  totalLogs: logs.length
              });

              setRecentLogs(logs.slice(-5).reverse());

              // Generate Chart Data (Mocking realistic activity curve based on logs count)
              // In a real backend app, this would be aggregated from DB.
              // Here we simulate a curve that peaks "Now".
              const baseActivity = logs.length > 0 ? Math.ceil(logs.length / 10) : 5;
              setChartData([
                  { name: '00:00', activity: baseActivity + 2 },
                  { name: '04:00', activity: baseActivity },
                  { name: '08:00', activity: baseActivity + 5 },
                  { name: '12:00', activity: baseActivity + 15 },
                  { name: '16:00', activity: baseActivity + 8 },
                  { name: '20:00', activity: baseActivity + 20 },
                  { name: 'Now', activity: baseActivity + 10 + Math.floor(Math.random() * 5) },
              ]);

          } catch (e) {
              console.error("Error loading local data", e);
          }

          setIsLoading(false);
      };

      loadDashboardData();
  }, [token]);

  // --- WELCOME SCREEN (No Token) ---
  if (!token) {
      return (
          <div className="h-[calc(100vh-140px)] flex items-center justify-center animate-fade-in relative">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>

              <GlassCard className="max-w-2xl w-full text-center p-10 relative border-t-4 border-t-blue-500 shadow-2xl">
                  <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-600/30">
                      <Bot size={48} className="text-white" />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-4">
                      به پنل مدیریت پیشرفته خوش آمدید
                  </h2>
                  
                  <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-lg mx-auto">
                      برای دسترسی به امکانات مدیریت کانال‌ها، ارسال پیام‌های زمان‌بندی شده، نظرسنجی و مشاهده آمار دقیق، ابتدا باید ربات تلگرام خود را متصل کنید.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-sm text-slate-300">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col items-center gap-2">
                          <Zap className="text-yellow-400"/>
                          <span>سرعت بالا</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col items-center gap-2">
                          <ShieldCheck className="text-green-400"/>
                          <span>امنیت کامل</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col items-center gap-2">
                          <Activity className="text-blue-400"/>
                          <span>آمار لحظه‌ای</span>
                      </div>
                  </div>

                  <button 
                    onClick={() => onNavigate('bot-connect')}
                    className="group bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-3 mx-auto"
                  >
                      اتصال ربات جدید
                      <ArrowRight className="group-hover:-translate-x-1 transition-transform" />
                  </button>
              </GlassCard>
          </div>
      );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="space-y-6 animate-fade-in pb-10">
        
        {/* 1. STATUS HEADER & BOT PROFILE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Bot size={150} className="text-white"/>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] shadow-lg">
                            <div className="w-full h-full rounded-full bg-[#1e293b] flex items-center justify-center text-3xl font-bold text-white uppercase">
                                {botInfo ? botInfo.username.substring(0, 2) : 'BOT'}
                            </div>
                        </div>
                        <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-[#1e293b] ${isOnline ? 'bg-green-500' : 'bg-red-500'} shadow-sm`}></div>
                    </div>
                    
                    <div className="text-center md:text-right flex-1">
                        <h2 className="text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                            {botInfo?.first_name || 'در حال بارگذاری...'}
                            {isOnline && <CheckCircle size={20} className="text-blue-400 fill-blue-400/20"/>}
                        </h2>
                        <div className="font-mono text-slate-400 mt-1 mb-3 bg-white/5 px-2 py-1 rounded inline-block text-sm">
                            @{botInfo?.username || 'checking...'}
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs flex items-center gap-1">
                                <Zap size={12}/> وضعیت: {isOnline ? 'آنلاین' : 'آفلاین'}
                            </div>
                            <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs flex items-center gap-1">
                                <Clock size={12}/> پاسخگویی: خودکار
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center w-full md:w-auto">
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <div className="text-2xl font-bold text-white">{stats.channelsCount}</div>
                            <div className="text-[10px] text-slate-400">کانال متصل</div>
                        </div>
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <div className="text-2xl font-bold text-orange-400">{stats.queuePending}</div>
                            <div className="text-[10px] text-slate-400">در صف</div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md">
                    <div className="p-2 bg-purple-500 rounded-lg w-fit text-white mb-2 shadow-lg shadow-purple-500/30"><Command size={20}/></div>
                    <div>
                        <div className="text-2xl font-bold text-white">{stats.commandsCount}</div>
                        <div className="text-xs text-slate-400">دستور فعال</div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-white/10 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md">
                    <div className="p-2 bg-orange-500 rounded-lg w-fit text-white mb-2 shadow-lg shadow-orange-500/30"><Activity size={20}/></div>
                    <div>
                        <div className="text-2xl font-bold text-white">{stats.totalLogs}</div>
                        <div className="text-xs text-slate-400">فعالیت ثبت شده</div>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. QUICK ACTIONS */}
        <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Layers size={20} className="text-blue-400"/> دسترسی سریع</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button onClick={() => onNavigate('broadcast')} className="group p-4 bg-white/5 hover:bg-blue-600 hover:text-white border border-white/10 rounded-xl transition-all flex items-center gap-4 text-slate-300">
                    <div className="p-3 rounded-full bg-white/5 group-hover:bg-white/20 transition-colors"><Megaphone size={20}/></div>
                    <div className="text-right">
                        <div className="font-bold">ارسال پیام</div>
                        <div className="text-[10px] opacity-60">همگانی یا زمان‌دار</div>
                    </div>
                </button>
                <button onClick={() => onNavigate('channels')} className="group p-4 bg-white/5 hover:bg-purple-600 hover:text-white border border-white/10 rounded-xl transition-all flex items-center gap-4 text-slate-300">
                    <div className="p-3 rounded-full bg-white/5 group-hover:bg-white/20 transition-colors"><Users size={20}/></div>
                    <div className="text-right">
                        <div className="font-bold">مدیریت کانال</div>
                        <div className="text-[10px] opacity-60">افزودن و ویرایش</div>
                    </div>
                </button>
                <button onClick={() => onNavigate('keyboard')} className="group p-4 bg-white/5 hover:bg-green-600 hover:text-white border border-white/10 rounded-xl transition-all flex items-center gap-4 text-slate-300">
                    <div className="p-3 rounded-full bg-white/5 group-hover:bg-white/20 transition-colors"><Layers size={20}/></div>
                    <div className="text-right">
                        <div className="font-bold">دکمه‌ساز</div>
                        <div className="text-[10px] opacity-60">طراحی کیبورد شیشه‌ای</div>
                    </div>
                </button>
                <button onClick={() => onNavigate('bot-connect')} className="group p-4 bg-white/5 hover:bg-orange-600 hover:text-white border border-white/10 rounded-xl transition-all flex items-center gap-4 text-slate-300">
                    <div className="p-3 rounded-full bg-white/5 group-hover:bg-white/20 transition-colors"><Settings size={20}/></div>
                    <div className="text-right">
                        <div className="font-bold">تنظیمات ربات</div>
                        <div className="text-[10px] opacity-60">توکن و وب‌هوک</div>
                    </div>
                </button>
            </div>
        </div>

        {/* 3. CHART & LOGS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2" title="نمودار فعالیت ربات">
                <div className="h-[300px] w-full dir-ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#8884d8' }}
                            />
                            <Area type="monotone" dataKey="activity" stroke="#8884d8" strokeWidth={3} fillOpacity={1} fill="url(#colorActivity)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            <GlassCard title="آخرین فعالیت‌ها">
                <div className="space-y-4">
                    {recentLogs.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-sm">هنوز فعالیتی ثبت نشده است.</div>
                    ) : (
                        recentLogs.map((log) => (
                            <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${log.type === 'incoming' ? 'bg-green-400' : log.type === 'outgoing' ? 'bg-blue-400' : 'bg-yellow-400'}`}></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-white">{log.user || 'System'}</span>
                                        <span className="text-[10px] text-slate-500 font-mono">{log.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-300 truncate dir-ltr text-right">{log.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                    {recentLogs.length > 0 && (
                        <button onClick={() => onNavigate('bot-connect')} className="w-full py-2 text-xs text-blue-400 hover:text-blue-300 transition-colors border-t border-white/5 mt-2">
                            مشاهده تمام لاگ‌ها
                        </button>
                    )}
                </div>
            </GlassCard>
        </div>
    </div>
  );
};
