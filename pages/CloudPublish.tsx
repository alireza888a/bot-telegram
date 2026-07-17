
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Cloud, Zap, Copy, CheckCircle, AlertTriangle, Play, Pause, Globe, Code, ShieldCheck, Download, X } from 'lucide-react';
import { generateWorkerCode } from '../services/cloudGenerator.ts';
import { telegramService } from '../services/telegramService';

export const CloudPublish: React.FC = () => {
    const [token, setToken] = useState(localStorage.getItem('bot_token') || '');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{text: string, type: 'success' | 'error'} | null>(null);

    // Modal State
    const [showCloudModal, setShowCloudModal] = useState(false);
    const [workerUrlInput, setWorkerUrlInput] = useState('');

    // Initial Status Check
    useEffect(() => {
        if (!token) return;
        const checkWebhook = async () => {
            const res = await telegramService.getWebhookInfo(token);
            if (res.ok && res.result) {
                setWebhookUrl(res.result.url);
                if (res.result.url) {
                    localStorage.setItem('bot_webhook_url', res.result.url);
                }
            }
        };
        checkWebhook();
    }, [token]);

    const handleGenerate = () => {
        // Gather data
        const menus = JSON.parse(localStorage.getItem('kb_menus') || '{}');
        const commands = JSON.parse(localStorage.getItem('bot_commands') || '[]');
        const queue = JSON.parse(localStorage.getItem('channel_queue') || '[]');
        const channels = JSON.parse(localStorage.getItem('saved_channels') || '[]');

        const code = generateWorkerCode(token, menus, commands, queue, channels);
        setGeneratedCode(code);
        setStatusMsg({ text: 'کد با موفقیت تولید شد! حاوی منوها و پیام‌های زمان‌بندی شده.', type: 'success' });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([generatedCode], {type: 'text/javascript'});
        element.href = URL.createObjectURL(file);
        element.download = "worker.js";
        document.body.appendChild(element); 
        element.click();
    };

    // Open Modal Logic
    const handleOpenCloudModal = () => {
        if (!token) {
             setStatusMsg({ text: 'خطا: توکن ربات تنظیم نشده است. لطفا ابتدا در صفحه "اتصال ربات" توکن را وارد کنید.', type: 'error' });
             return;
        }
        setShowCloudModal(true);
    };

    // Confirm Logic
    const handleConfirmCloud = async () => {
        if (!workerUrlInput) return;
        
        let finalUrl = workerUrlInput.trim();
        if (!finalUrl.startsWith('https://')) {
             setStatusMsg({ text: 'آدرس باید با https:// شروع شود', type: 'error' });
             return;
        }

        setIsLoading(true);
        const res = await telegramService.setWebhook(token, finalUrl);
        if (res.ok) {
            setWebhookUrl(finalUrl);
            localStorage.setItem('bot_webhook_url', finalUrl);
            setStatusMsg({ text: 'حالت ابری فعال شد. مرورگر دیگر پیام دریافت نمی‌کند.', type: 'success' });
            setShowCloudModal(false);
        } else {
            setStatusMsg({ text: 'خطا در فعال‌سازی: ' + res.description, type: 'error' });
        }
        setIsLoading(false);
    };

    const handleDisableCloud = async () => {
        if (!token) return;
        setIsLoading(true);
        const res = await telegramService.deleteWebhook(token);
        if (res.ok) {
            setWebhookUrl('');
            localStorage.removeItem('bot_webhook_url');
            setStatusMsg({ text: 'حالت مرورگر فعال شد. اکنون پیام‌ها در همین تب دریافت می‌شوند.', type: 'success' });
        } else {
            setStatusMsg({ text: 'خطا: ' + res.description, type: 'error' });
        }
        setIsLoading(false);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20 relative">
            
            {/* ACTIVATION MODAL */}
            {showCloudModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
                        <button 
                            onClick={() => setShowCloudModal(false)} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={24}/>
                        </button>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-cyan-600/20 rounded-full text-cyan-400">
                                <Cloud size={24}/>
                            </div>
                            <h3 className="text-xl font-bold text-white">اتصال به Cloudflare</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-sm text-slate-300">
                                لطفا آدرسی که پس از Deploy در کلادفلر دریافت کردید را وارد کنید.
                                <br/>
                                <span className="text-xs text-slate-500 font-mono">مثال: https://my-bot.username.workers.dev</span>
                            </p>

                            <input 
                                value={workerUrlInput}
                                onChange={e => setWorkerUrlInput(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white dir-ltr text-left font-mono focus:border-cyan-500 outline-none transition-colors"
                                autoFocus
                            />

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowCloudModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors font-medium">
                                    انصراف
                                </button>
                                <button 
                                    onClick={handleConfirmCloud} 
                                    disabled={isLoading || !workerUrlInput} 
                                    className="flex-[2] py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-600/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-5 h-5 block"></span> : <Zap size={18}/>}
                                    تایید و اتصال
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-cyan-600/20 rounded-xl text-cyan-400">
                    <Cloud size={32}/>
                </div>
                <div>
                    <h2 className="text-2xl font-bold dark:text-white text-slate-800">انتشار ابری (Serverless)</h2>
                    <p className="text-sm text-slate-500">تبدیل ربات به کد جاوااسکریپت برای اجرا در Cloudflare Workers (رایگان و ۲۴ ساعته)</p>
                </div>
            </div>

            {/* MODE SWITCHER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Browser Mode Card */}
                 <GlassCard className={`border-t-4 transition-colors ${webhookUrl ? 'border-t-slate-600 opacity-60' : 'border-t-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)]'}`}>
                     <div className="flex justify-between items-start">
                         <div>
                             <h3 className="font-bold text-lg text-white flex items-center gap-2"><Globe size={20}/> حالت مرورگر (Browser Mode)</h3>
                             <p className="text-xs text-slate-400 mt-2">
                                 ربات روی سیستم شما اجرا می‌شود.<br/>
                                 نیاز است تب مرورگر باز باشد.<br/>
                                 مناسب برای: طراحی، تست و مدیریت روزمره.
                             </p>
                         </div>
                         {!webhookUrl && <div className="px-3 py-1 bg-green-500 text-white text-xs rounded-full animate-pulse">فعال</div>}
                     </div>
                     <button 
                        onClick={handleDisableCloud}
                        disabled={!webhookUrl || isLoading}
                        className="mt-6 w-full py-3 bg-white/5 hover:bg-green-600 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                         <Play size={18}/>
                         {webhookUrl ? 'فعال‌سازی حالت مرورگر' : 'هم‌اکنون فعال است'}
                     </button>
                 </GlassCard>

                 {/* Cloud Mode Card */}
                 <GlassCard className={`border-t-4 transition-colors ${webhookUrl ? 'border-t-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'border-t-slate-600 opacity-80'}`}>
                     <div className="flex justify-between items-start">
                         <div>
                             <h3 className="font-bold text-lg text-white flex items-center gap-2"><Cloud size={20}/> حالت ابری (Cloud Mode)</h3>
                             <p className="text-xs text-slate-400 mt-2">
                                 ربات روی سرورهای ابری اجرا می‌شود.<br/>
                                 بدون نیاز به روشن بودن سیستم.<br/>
                                 مناسب برای: مسافرت، پایداری ۲۴ ساعته.
                             </p>
                         </div>
                         {webhookUrl && <div className="px-3 py-1 bg-cyan-500 text-white text-xs rounded-full animate-pulse">فعال</div>}
                     </div>
                     <button 
                        onClick={handleOpenCloudModal}
                        disabled={!!webhookUrl || isLoading}
                        className="mt-6 w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-cyan-500/20 text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                         <Zap size={18}/>
                         {webhookUrl ? 'هم‌اکنون فعال است' : 'فعال‌سازی حالت ابری'}
                     </button>
                     {webhookUrl && <p className="text-[10px] text-center mt-2 text-cyan-300 break-all font-mono bg-black/20 p-1 rounded">{webhookUrl}</p>}
                 </GlassCard>
            </div>

            {statusMsg && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${statusMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {statusMsg.type === 'success' ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>}
                    {statusMsg.text}
                </div>
            )}

            {/* GENERATOR */}
            <GlassCard title="تولید کد Worker">
                <div className="mb-4 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3">
                    <ShieldCheck className="text-blue-400 shrink-0"/>
                    <div className="text-xs text-blue-200">
                        <p className="font-bold mb-1">راهنما:</p>
                        <p>۱. دکمه "تولید کد" را بزنید تا تنظیمات فعلی (منوها + پیام‌های زمان‌بندی شده) تبدیل به کد شوند.</p>
                        <p>۲. کد را کپی کنید و در <a href="https://workers.cloudflare.com/" target="_blank" className="underline text-white">Cloudflare Workers</a> پیست و Deploy کنید.</p>
                        <p>۳. آدرس دریافتی را در دکمه "فعال‌سازی حالت ابری" بالا وارد کنید.</p>
                    </div>
                </div>

                <div className="flex justify-end mb-4">
                     <button 
                        onClick={handleGenerate}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg transition-all flex items-center gap-2"
                     >
                         <Code size={18}/>
                         تولید کد ربات
                     </button>
                </div>

                <div className="relative">
                    <textarea 
                        value={generatedCode}
                        readOnly
                        placeholder="کد تولید شده اینجا نمایش داده می‌شود..."
                        className="w-full h-[400px] bg-[#1e1e1e] border border-white/10 rounded-xl p-4 text-xs font-mono text-green-400 resize-none dir-ltr text-left outline-none"
                        dir="ltr"
                    />
                    {generatedCode && (
                        <div className="absolute top-4 right-4 flex gap-2">
                             <button 
                                onClick={handleDownload}
                                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors"
                                title="دانلود فایل"
                             >
                                 <Download size={16}/>
                             </button>
                             <button 
                                onClick={handleCopy}
                                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors flex items-center gap-1"
                             >
                                 {isCopied ? <CheckCircle size={16} className="text-green-400"/> : <Copy size={16}/>}
                                 {isCopied ? 'کپی شد' : 'کپی'}
                             </button>
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
};
