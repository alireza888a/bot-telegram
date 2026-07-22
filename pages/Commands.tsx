import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Command, Plus, Trash2, Save, Terminal, Play, CloudUpload, Info, Menu, Type, CheckCircle } from 'lucide-react';
import { CommandConfig, MenuPage } from '../types';
import { telegramService } from '../services/telegramService';
import { syncNow } from '../services/cloudSync';

export const Commands: React.FC = () => {
    const token = localStorage.getItem('bot_token') || '';
    
    // Load Commands from Storage
    const [commands, setCommands] = useState<CommandConfig[]>(() => {
        try { return JSON.parse(localStorage.getItem('bot_commands') || '[]'); } catch { return []; }
    });

    // Load available menus (to link commands to menus)
    const [menus, setMenus] = useState<Record<string, MenuPage>>(() => {
        try { return JSON.parse(localStorage.getItem('kb_menus') || '{}'); } catch { return {}; }
    });

    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        localStorage.setItem('bot_commands', JSON.stringify(commands));
        syncNow();
    }, [commands]);

    const addCommand = () => {
        setCommands([...commands, {
            command: '',
            description: '',
            actionType: 'menu',
            actionValue: 'root'
        }]);
    };

    const removeCommand = (index: number) => {
        setCommands(commands.filter((_, i) => i !== index));
    };

    const updateCommand = (index: number, field: keyof CommandConfig, value: string) => {
        setCommands(commands.map((cmd, i) => i === index ? { ...cmd, [field]: value } : cmd));
    };

    const syncToTelegram = async () => {
        if (!token) return alert('لطفا ابتدا توکن ربات را در بخش "اتصال ربات" وارد کنید.');
        if (commands.some(c => !c.command || !c.description)) return alert('لطفا تمام فیلدهای دستور و توضیحات را پر کنید.');
        
        // Telegram validation: commands must be lowercase, alphanumeric + underscore
        const invalidCmd = commands.find(c => !/^[a-z0-9_]+$/.test(c.command));
        if (invalidCmd) return alert(`فرمت دستور "${invalidCmd.command}" اشتباه است. فقط حروف کوچک انگلیسی، اعداد و زیرخط مجاز است (بدون /).`);

        setIsSyncing(true);
        const apiCommands = commands.map(c => ({ command: c.command, description: c.description }));
        
        const res = await telegramService.setMyCommands(token, apiCommands);
        
        if (res.ok) {
            alert('✅ دستورات با موفقیت در تلگرام ذخیره شدند. دکمه منوی ربات آپدیت شد.');
        } else {
            alert('❌ خطا در سینک: ' + res.description);
        }
        setIsSyncing(false);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white text-slate-800 flex items-center gap-2">
                        <Terminal className="text-orange-500" />
                        مدیریت دستورات ربات (Commands)
                    </h2>
                    <p className="text-xs dark:text-white/50 text-slate-500 mt-1">
                        دستوراتی که با اسلش (/) شروع می‌شوند را اینجا تعریف کنید (مثل start, help).
                    </p>
                </div>

                <button 
                    onClick={syncToTelegram}
                    disabled={isSyncing}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all"
                >
                    {isSyncing ? <CloudUpload size={18} className="animate-bounce"/> : <CloudUpload size={18}/>}
                    {isSyncing ? 'در حال ارسال...' : 'ذخیره در سرور تلگرام'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
                
                {/* --- COMMANDS LIST EDITOR --- */}
                <div className="space-y-4">
                    {commands.length === 0 && (
                         <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-xl p-8 text-center flex flex-col items-center gap-3">
                             <Command size={48} className="text-white/20"/>
                             <p className="text-slate-400">هنوز دستوری تعریف نکرده‌اید.</p>
                             <button onClick={addCommand} className="text-blue-400 text-sm hover:underline">افزودن اولین دستور</button>
                         </div>
                    )}

                    {commands.map((cmd, index) => (
                        <GlassCard key={index} className="relative group overflow-visible">
                             <button 
                                onClick={() => removeCommand(index)}
                                className="absolute top-2 left-2 text-red-400/50 hover:text-red-400 p-1 transition-colors"
                             >
                                 <Trash2 size={16}/>
                             </button>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {/* Left: Definition */}
                                 <div className="space-y-3">
                                     <div>
                                         <label className="text-xs text-slate-500 block mb-1">نام دستور (بدون /)</label>
                                         <div className="relative">
                                             <span className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-500 text-sm">/</span>
                                             <input 
                                                 value={cmd.command}
                                                 onChange={(e) => updateCommand(index, 'command', e.target.value.toLowerCase())}
                                                 placeholder="start"
                                                 className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pr-6 pl-2 text-white outline-none dir-ltr text-left font-mono focus:border-orange-500"
                                                 dir="ltr"
                                             />
                                         </div>
                                     </div>
                                     <div>
                                         <label className="text-xs text-slate-500 block mb-1">توضیحات (نمایش در لیست)</label>
                                         <input 
                                             value={cmd.description}
                                             onChange={(e) => updateCommand(index, 'description', e.target.value)}
                                             placeholder="شروع مجدد ربات"
                                             className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                                         />
                                     </div>
                                 </div>

                                 {/* Right: Logic */}
                                 <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                     <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
                                         <Play size={12}/>
                                         عملیات اجرایی:
                                     </div>
                                     
                                     <div className="flex gap-2 mb-3">
                                         <button 
                                            onClick={() => updateCommand(index, 'actionType', 'menu')}
                                            className={`flex-1 py-1.5 text-xs rounded-md border ${cmd.actionType === 'menu' ? 'bg-purple-600 border-purple-500 text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                                         >
                                             باز کردن منو
                                         </button>
                                         <button 
                                            onClick={() => updateCommand(index, 'actionType', 'text')}
                                            className={`flex-1 py-1.5 text-xs rounded-md border ${cmd.actionType === 'text' ? 'bg-green-600 border-green-500 text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                                         >
                                             ارسال متن
                                         </button>
                                     </div>

                                     {cmd.actionType === 'menu' ? (
                                         <select 
                                            value={cmd.actionValue}
                                            onChange={(e) => updateCommand(index, 'actionValue', e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-sm text-white outline-none"
                                         >
                                             {Object.values(menus).map((m: MenuPage) => (
                                                 <option key={m.id} value={m.id} className="bg-slate-800">{m.title} ({m.id})</option>
                                             ))}
                                         </select>
                                     ) : (
                                         <textarea 
                                             value={cmd.actionValue}
                                             onChange={(e) => updateCommand(index, 'actionValue', e.target.value)}
                                             placeholder="متنی که ربات در پاسخ ارسال می‌کند..."
                                             className="w-full h-20 bg-black/20 border border-white/10 rounded p-2 text-xs text-white outline-none resize-none"
                                         />
                                     )}
                                 </div>
                             </div>
                        </GlassCard>
                    ))}

                    <button 
                        onClick={addCommand}
                        className="w-full py-3 border-2 border-dashed border-white/10 hover:border-white/30 rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 text-sm font-bold"
                    >
                        <Plus size={16} />
                        افزودن دستور جدید
                    </button>
                </div>

                {/* --- PREVIEW & HELP --- */}
                <div className="space-y-6">
                    <GlassCard title="راهنمای دستورات ویژه">
                         <div className="space-y-3 text-sm text-slate-300">
                             <div className="flex items-start gap-2">
                                 <span className="font-mono bg-white/10 px-1 rounded text-orange-400">/start</span>
                                 <p className="text-xs">معمولاً برای "شروع" استفاده می‌شود. بهتر است آن را به منوی <span className="text-white font-bold">root</span> متصل کنید.</p>
                             </div>
                             <div className="flex items-start gap-2">
                                 <span className="font-mono bg-white/10 px-1 rounded text-orange-400">/clear</span>
                                 <p className="text-xs">ربات‌ها <b>نمی‌توانند</b> تاریخچه چت کاربر را پاک کنند (محدودیت تلگرام). اما می‌توانید پیامی تنظیم کنید که بگوید "برای پاکسازی روی ۳ نقطه بالا کلیک کنید و Clear History بزنید".</p>
                             </div>
                             <div className="flex items-start gap-2">
                                 <span className="font-mono bg-white/10 px-1 rounded text-orange-400">/help</span>
                                 <p className="text-xs">برای راهنمایی کاربران. می‌توانید یک متن راهنما بنویسید یا به یک منوی "آموزش" وصل کنید.</p>
                             </div>
                         </div>
                    </GlassCard>

                    {/* Telegram Menu Preview */}
                    <div className="flex flex-col items-center">
                         <div className="text-xs text-slate-500 mb-2">پیش‌نمایش دکمه منو در تلگرام</div>
                         <div className="telegram-simulator w-[280px] bg-[#1c2431] rounded-xl border border-white/10 overflow-hidden relative">
                             {/* Fake Chat Area */}
                             <div className="h-32 bg-[#0e1621] p-2 flex flex-col justify-end">
                                 <div className="bg-[#2b5278] self-end p-2 rounded-lg text-xs text-white mb-2 max-w-[80%]">/start</div>
                                 <div className="bg-[#182533] self-start p-2 rounded-lg text-xs text-white max-w-[80%]">سلام! خوش آمدید.</div>
                             </div>
                             
                             {/* Input Area */}
                             <div className="bg-[#1c2431] p-2 flex items-center gap-2">
                                 <div className="w-8 h-8 rounded-full bg-transparent hover:bg-white/5 flex items-center justify-center cursor-pointer transition-colors border border-blue-500/30 group">
                                     <div className="text-blue-500 font-bold text-xs group-hover:scale-110 transition-transform">/</div>
                                 </div>
                                 <div className="flex-1 text-xs text-slate-500">Message...</div>
                             </div>

                             {/* The Menu Popup (Simulation) */}
                             <div className="absolute bottom-12 left-2 bg-[#1c2431]/95 backdrop-blur-xl border border-white/10 rounded-lg w-48 shadow-2xl p-1 z-10 animate-slide-up">
                                 {commands.length === 0 ? (
                                     <div className="text-[10px] text-center text-slate-500 p-2">لیست خالی است</div>
                                 ) : (
                                     commands.map((c, i) => (
                                         <div key={i} className="flex justify-between items-center p-2 hover:bg-white/10 rounded cursor-pointer">
                                             <span className="text-xs text-white font-mono">/{c.command}</span>
                                             <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{c.description}</span>
                                         </div>
                                     ))
                                 )}
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};