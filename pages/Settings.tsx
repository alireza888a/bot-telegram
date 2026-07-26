
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { 
    Save, Database, Download, Upload, RefreshCcw, Server, 
    ShieldCheck, AlertTriangle, FileJson, CheckCircle, HardDrive, Link as LinkIcon, RefreshCw, Info, X, CreditCard, UserCog, MessageSquareCode, AppWindow, LayoutGrid, Image as ImageIcon, Plus, Trash2, Loader2, Bell
} from 'lucide-react';
import { telegramService } from '../services/telegramService';
import { syncNow } from '../services/cloudSync';
import { MiniAppModule, GalleryImage } from '../types';
import { getDisplayableImageUrl } from '../utils/image';

export const Settings: React.FC = () => {
    const [token, setToken] = useState(localStorage.getItem('bot_token') || '');
    // Initialize directly from localStorage
    const [dbChannel, setDbChannel] = useState(localStorage.getItem('bot_db_channel') || '');
    
    // Payment Card Settings States
    const [cardNumber, setCardNumber] = useState(localStorage.getItem('payment_card_number') || '');
    const [cardOwner, setCardOwner] = useState(localStorage.getItem('payment_card_owner') || '');

    // Admin Chat ID State
    const [adminChatId, setAdminChatId] = useState(localStorage.getItem('admin_chat_id') || '');

    // Support Chat ID State
    const [supportChatId, setSupportChatId] = useState(localStorage.getItem('support_chat_id') || '');

    // Post Confirm Menu State
    const [postConfirmMenuId, setPostConfirmMenuId] = useState(localStorage.getItem('post_confirm_menu_id') || '');

    // Mini App Modules State
    const [miniappModules, setMiniappModules] = useState<MiniAppModule[]>(() => {
        try {
            const saved = localStorage.getItem('miniapp_modules');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {}
        return ['shop'];
    });

    // Gallery Images State
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(() => {
        try {
            const saved = localStorage.getItem('gallery_images');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch {}
        return [];
    });
    const [isUploadingGallery, setIsUploadingGallery] = useState(false);

    const [isCheckingDb, setIsCheckingDb] = useState(false);
    const [dbStatus, setDbStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMsg, setStatusMsg] = useState('');
    
    const [showResetModal, setShowResetModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
    const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
    
    // Toast auto-clear
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // --- AUTO SAVE EFFECT & STATUS RESTORE ---
    useEffect(() => {
        localStorage.setItem('bot_db_channel', dbChannel);
        syncNow();
    }, [dbChannel]);

    useEffect(() => {
        localStorage.setItem('payment_card_number', cardNumber);
        syncNow();
    }, [cardNumber]);

    useEffect(() => {
        localStorage.setItem('payment_card_owner', cardOwner);
        syncNow();
    }, [cardOwner]);

    useEffect(() => {
        localStorage.setItem('admin_chat_id', adminChatId);
        syncNow();
    }, [adminChatId]);

    useEffect(() => {
        localStorage.setItem('support_chat_id', supportChatId);
        syncNow();
    }, [supportChatId]);

    useEffect(() => {
        localStorage.setItem('post_confirm_menu_id', postConfirmMenuId);
        syncNow();
    }, [postConfirmMenuId]);

    useEffect(() => {
        localStorage.setItem('miniapp_modules', JSON.stringify(miniappModules));
        syncNow();
    }, [miniappModules]);

    useEffect(() => {
        localStorage.setItem('gallery_images', JSON.stringify(galleryImages));
        syncNow();
    }, [galleryImages]);

    const toggleMiniAppModule = (mod: MiniAppModule) => {
        setMiniappModules(prev => {
            if (prev.includes(mod)) {
                const next = prev.filter(m => m !== mod);
                return next.length > 0 ? next : ['shop'];
            } else {
                return [...prev, mod];
            }
        });
    };

    const handleAddGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingGallery(true);
        try {
            let imageUrl = '';
            if (token && dbChannel) {
                const uploadedFileId = await telegramService.uploadToDb(token, dbChannel, file, 'image');
                if (uploadedFileId) {
                    imageUrl = uploadedFileId;
                }
            }
            if (!imageUrl) {
                // Read as base64 data URL for local storage persistence if no DB channel
                const reader = new FileReader();
                imageUrl = await new Promise<string>((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            }
            const newImg: GalleryImage = {
                id: Date.now().toString(),
                imageUrl,
                caption: ''
            };
            setGalleryImages(prev => [newImg, ...prev]);
            setToast({ message: 'عکس جدید با موفقیت به گالری اضافه شد', type: 'success' });
        } catch (err) {
            console.error('Gallery image upload failed:', err);
            setToast({ message: 'خطا در آپلود عکس گالری', type: 'error' });
        } finally {
            setIsUploadingGallery(false);
            e.target.value = '';
        }
    };

    const handleUpdateGalleryCaption = (id: string, caption: string) => {
        setGalleryImages(prev => prev.map(img => img.id === id ? { ...img, caption } : img));
    };

    const handleDeleteGalleryImage = (id: string) => {
        setGalleryImages(prev => prev.filter(img => img.id !== id));
        setToast({ message: 'عکس از گالری حذف شد', type: 'success' });
    };

    const getKbMenus = (): Record<string, { id?: string; title?: string; content?: string }> => {
        try {
            return JSON.parse(localStorage.getItem('kb_menus') || '{}');
        } catch {
            return {};
        }
    };

    // Restore visual status on mount if channel exists
    useEffect(() => {
        if (dbChannel) {
            setDbStatus('success');
        }
    }, []);

    // --- DB CHANNEL LOGIC ---
    const handleSaveDb = async () => {
        if (!dbChannel) return;
        if (!token) {
            setDbStatus('error');
            setStatusMsg('❌ ابتدا توکن ربات را در بخش "اتصال ربات" وارد کنید.');
            return;
        }

        setIsCheckingDb(true);
        setDbStatus('idle');
        setStatusMsg('⏳ در حال بررسی دسترسی ربات...');

        // 1. Smart ID Cleaning
        let cleanId = dbChannel.trim();
        // Remove standard URL prefixes
        cleanId = cleanId.replace(/^https?:\/\/(www\.)?t\.me\//i, '')
                         .replace(/^https?:\/\/(www\.)?telegram\.me\//i, '')
                         .replace(/\/$/, '');

        // 2. DETECT PRIVATE INVITE LINKS (Error handling)
        if (cleanId.startsWith('+') || cleanId.includes('joinchat')) {
            setDbStatus('error');
            setStatusMsg('⛔️ لینک دعوت (Invite Link) قابل قبول نیست! برای کانال خصوصی، باید "آیدی عددی" (که با -100 شروع می‌شود) را وارد کنید.');
            setIsCheckingDb(false);
            return;
        }

        // 3. Auto-format ID
        const isNumeric = /^-?\d+$/.test(cleanId);
        if (!isNumeric) {
            // Assume it's a public username
            if (!cleanId.startsWith('@')) {
                cleanId = '@' + cleanId;
            }
        } else {
            // It is numeric. Check if it needs -100 prefix (common mistake)
            // If user enters '123456789' (from web url), convert to '-100123456789'
            if (!cleanId.startsWith('-100') && !cleanId.startsWith('-')) {
                 cleanId = '-100' + cleanId;
            }
        }

        try {
            // 4. Check if chat exists
            const res = await telegramService.getChat(token, cleanId);
            if (!res.ok) {
                if (res.description?.includes('chat not found')) {
                    throw new Error('کانال یافت نشد. اگر خصوصی است، آیدی عددی (-100...) اشتباه است یا ربات عضو نیست.');
                }
                throw new Error(res.description || 'کانال یافت نشد.');
            }

            const realId = res.result?.id;
            const title = res.result?.title;
            
            // 5. Check Admin rights
            const me = await telegramService.getMe(token);
            if (!me.ok || !me.result) throw new Error('عدم ارتباط با تلگرام.');

            const memberRes = await telegramService.getChatMember(token, String(realId), me.result.id);
            
            if (memberRes.ok && (memberRes.result?.status === 'administrator' || memberRes.result?.status === 'creator')) {
                // Success
                const finalId = String(realId);
                setDbChannel(finalId); 
                localStorage.setItem('bot_db_channel', finalId);
                
                setDbStatus('success');
                setStatusMsg(`✅ متصل شد: ${title} (Admin)`);
            } else {
                throw new Error('ربات در این کانال "ادمین" نیست.');
            }

        } catch (e: any) {
            setDbStatus('error');
            setStatusMsg('❌ خطا: ' + (e.message || 'مشکل در اتصال'));
        }
        setIsCheckingDb(false);
    };

    // --- BACKUP LOGIC ---
    const handleBackup = () => {
        const backupData = {
            meta: {
                version: "2.5.3",
                exported_at: new Date().toISOString(),
                type: "full_backup"
            },
            config: {
                token: localStorage.getItem('bot_token'),
                db_channel: localStorage.getItem('bot_db_channel'),
                webhook_url: localStorage.getItem('bot_webhook_url'),
                theme: localStorage.getItem('theme'),
                force_join: localStorage.getItem('force_join_enabled'),
                payment_card_number: localStorage.getItem('payment_card_number'),
                payment_card_owner: localStorage.getItem('payment_card_owner'),
                admin_chat_id: localStorage.getItem('admin_chat_id'),
                support_chat_id: localStorage.getItem('support_chat_id'),
                post_confirm_menu_id: localStorage.getItem('post_confirm_menu_id')
            },
            data: {
                menus: JSON.parse(localStorage.getItem('kb_menus') || '{}'),
                forms: JSON.parse(localStorage.getItem('kb_forms') || '{}'),
                commands: JSON.parse(localStorage.getItem('bot_commands') || '[]'),
                channels: JSON.parse(localStorage.getItem('saved_channels') || '[]'),
                templates: JSON.parse(localStorage.getItem('broadcast_templates') || '[]')
            }
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `BotBackup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    // --- RESTORE LOGIC ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingRestoreFile(file);
        setShowRestoreModal(true);
        // Reset input so the same file could be selected again if needed
        e.target.value = '';
    };

    const confirmRestore = () => {
        if (!pendingRestoreFile) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                
                // Validate Basic Structure
                if (!json.data || !json.config) throw new Error('فرمت فایل نامعتبر است');

                // Restore Config
                if (json.config.token) localStorage.setItem('bot_token', json.config.token);
                if (json.config.db_channel) localStorage.setItem('bot_db_channel', json.config.db_channel);
                if (json.config.webhook_url) localStorage.setItem('bot_webhook_url', json.config.webhook_url);
                if (json.config.force_join) localStorage.setItem('force_join_enabled', json.config.force_join);
                if (json.config.payment_card_number) localStorage.setItem('payment_card_number', json.config.payment_card_number);
                if (json.config.payment_card_owner) localStorage.setItem('payment_card_owner', json.config.payment_card_owner);
                if (json.config.admin_chat_id) localStorage.setItem('admin_chat_id', json.config.admin_chat_id);
                if (json.config.support_chat_id) localStorage.setItem('support_chat_id', json.config.support_chat_id);
                if (json.config.post_confirm_menu_id) localStorage.setItem('post_confirm_menu_id', json.config.post_confirm_menu_id);

                // Restore Data
                localStorage.setItem('kb_menus', JSON.stringify(json.data.menus || {}));
                localStorage.setItem('kb_forms', JSON.stringify(json.data.forms || {}));
                localStorage.setItem('bot_commands', JSON.stringify(json.data.commands || []));
                localStorage.setItem('saved_channels', JSON.stringify(json.data.channels || []));
                localStorage.setItem('broadcast_templates', JSON.stringify(json.data.templates || []));

                setToast({ message: 'اطلاعات با موفقیت بازگردانی شد. در حال رفرش...', type: 'success' });
                setTimeout(() => window.location.reload(), 1500);

            } catch (err) {
                setToast({ message: 'خطا در خواندن فایل پشتیبان.', type: 'error' });
                console.error(err);
            }
        };
        reader.readAsText(pendingRestoreFile);
        setShowRestoreModal(false);
        setPendingRestoreFile(null);
    };

    const cancelRestore = () => {
        setShowRestoreModal(false);
        setPendingRestoreFile(null);
    };

    // --- FACTORY RESET ---
    const handleFactoryReset = () => {
        setShowResetModal(true);
    };
    
    const confirmFactoryReset = () => {
        localStorage.clear();
        setToast({ message: 'اطلاعات با موفقیت پاک شد. در حال رفرش...', type: 'success' });
        setTimeout(() => window.location.reload(), 1000);
    };

    const addSupportButtonToRootMenu = () => {
        try {
            const saved = localStorage.getItem('kb_menus');
            let menus = saved ? JSON.parse(saved) : {};

            if (!menus['root']) {
                setToast({ message: 'هنوز منوی اصلی (root) ساخته نشده است.', type: 'error' });
                alert('هنوز منوی اصلی (root) رو نساختی — اول برو دکمه‌ساز و منوی اصلی رو بساز.');
                return;
            }

            const alreadyExists = menus['root'].rows?.some((r: any) =>
                r.buttons?.some((b: any) => b.type === 'callback' && b.value === 'support')
            );

            if (alreadyExists) {
                setToast({ message: 'این دکمه از قبل توی منوی اصلی هست.', type: 'error' });
                alert('این دکمه از قبل توی منوی اصلی هست.');
                return;
            }

            const newButton = {
                id: 'btn_' + Date.now(),
                text: '💬 پشتیبانی',
                type: 'callback',
                value: 'support'
            };

            menus['root'].rows = [...(menus['root'].rows || []), { id: 'row_' + Date.now(), buttons: [newButton] }];
            localStorage.setItem('kb_menus', JSON.stringify(menus));
            syncNow();
            setToast({ message: 'دکمه‌ی پشتیبانی به منوی اصلی اضافه شد.', type: 'success' });
            alert('✅ دکمه‌ی «پشتیبانی» به منوی اصلی اضافه شد.');
        } catch (e) {
            console.error(e);
            alert('خطا در تغییر منوهای کیبورد.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
            {toast && (
                <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-xl shadow-black/20 flex items-center gap-2 border ${toast.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} animate-slide-up`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}
            
            {/* Modal for Factory Reset */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-red-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 text-red-500 mb-4 bg-red-500/10 p-3 rounded-xl w-fit">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">بازگشت به تنظیمات کارخانه</h3>
                        <p className="text-slate-300 text-sm leading-relaxed mb-6">
                            آیا مطمئن هستید؟ تمام کانال‌ها، منوها، پیام‌ها و تنظیمات <b>برای همیشه</b> پاک خواهند شد و این عملیات غیرقابل بازگشت است.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={confirmFactoryReset}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
                            >
                                بله، پاکسازی شود
                            </button>
                            <button 
                                onClick={() => setShowResetModal(false)}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-2.5 text-sm font-medium transition-colors"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Restore Backup */}
            {showRestoreModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-blue-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 text-blue-500 mb-4 bg-blue-500/10 p-3 rounded-xl w-fit">
                            <RefreshCw size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">بازگردانی اطلاعات</h3>
                        <p className="text-slate-300 text-sm leading-relaxed mb-6">
                            با بازگردانی نسخه پشتیبان، <b>تمام اطلاعات فعلی شما پاک شده و توسط فایل جدید جایگزین می‌شود.</b> آیا از این کار مطمئنید؟
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={confirmRestore}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
                            >
                                بازگردانی
                            </button>
                            <button 
                                onClick={cancelRestore}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-2.5 text-sm font-medium transition-colors"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400">
                    <Server size={32}/>
                </div>
                <div>
                    <h2 className="text-2xl font-bold dark:text-white text-slate-800">تنظیمات سیستم و دیتابیس</h2>
                    <p className="text-sm text-slate-500">مدیریت فضای ابری، پشتیبان‌گیری و تنظیمات کلی پنل</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. DATABASE CHANNEL CONFIG */}
                <GlassCard className="border-t-4 border-t-purple-500">
                    <div className="flex items-center gap-2 mb-4">
                        <Database className="text-purple-400"/>
                        <h3 className="font-bold text-lg dark:text-white text-slate-800">کانال دیتابیس (فضای نامحدود)</h3>
                    </div>
                    
                    <div className="text-sm text-slate-400 mb-6 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                        <p className="mb-2">⚠️ برای جلوگیری از پر شدن حافظه مرورگر، تمام عکس‌ها و فیلم‌ها باید در یک <b>کانال خصوصی تلگرام</b> ذخیره شوند.</p>
                        <ol className="list-decimal list-inside space-y-1 text-slate-300">
                            <li>یک کانال خصوصی بسازید.</li>
                            <li>ربات خود را در آن کانال <b>ادمین</b> کنید (دسترسی پست).</li>
                            <li><b>آیدی عددی</b> کانال (شروع با -100) را وارد کنید.</li>
                        </ol>
                        <div className="mt-2 flex items-start gap-1 text-[10px] text-blue-300 bg-blue-500/10 p-2 rounded">
                            <Info size={14} className="shrink-0 mt-0.5"/>
                            <span>نکته: لینک‌های دعوت (t.me/+) کار نمی‌کنند. آیدی عددی را از تلگرام وب یا @username_to_id_bot پیدا کنید.</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-xs text-slate-500">آیدی عددی (-100...) یا یوزرنیم (@)</label>
                        <div className="flex gap-2">
                            <input 
                                value={dbChannel}
                                onChange={(e) => setDbChannel(e.target.value)}
                                placeholder="-100123456789 یا @MyPublicChannel"
                                className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 text-white dir-ltr text-left font-mono outline-none focus:border-purple-500 transition-colors"
                                dir="ltr"
                            />
                            <button 
                                onClick={handleSaveDb}
                                disabled={isCheckingDb || !dbChannel}
                                className={`px-4 rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors ${dbStatus === 'success' ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-500'} text-white`}
                            >
                                {isCheckingDb ? <RefreshCw className="animate-spin"/> : <CheckCircle/>}
                            </button>
                        </div>
                        
                        {/* Status Message (If Check clicked) */}
                        {statusMsg && (
                            <div className={`text-xs p-3 rounded-lg flex items-center gap-2 ${dbStatus === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : (dbStatus === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400')}`}>
                                {dbStatus === 'error' && <AlertTriangle size={14}/>}
                                {statusMsg}
                            </div>
                        )}
                        
                        {/* Persistent Success Indicator (If loaded from storage) */}
                        {dbStatus === 'success' && !statusMsg && (
                            <div className="flex items-center gap-2 text-[10px] text-green-400 bg-green-500/10 p-2 rounded border border-green-500/20 mt-2">
                                <LinkIcon size={12}/>
                                <span>کانال متصل است و در حافظه ذخیره شده.</span>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* 2. BACKUP & RESTORE */}
                <GlassCard className="border-t-4 border-t-blue-500">
                    <div className="flex items-center gap-2 mb-4">
                        <HardDrive className="text-blue-400"/>
                        <h3 className="font-bold text-lg dark:text-white text-slate-800">مدیریت داده‌ها (پشتیبان‌گیری)</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button 
                            onClick={handleBackup}
                            className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 text-green-400 rounded-lg group-hover:scale-110 transition-transform"><Download size={20}/></div>
                                <div className="text-right">
                                    <div className="font-bold dark:text-white text-slate-800">دانلود فایل پشتیبان</div>
                                    <div className="text-[10px] text-slate-500">فرمت JSON شامل تمام تنظیمات</div>
                                </div>
                            </div>
                            <FileJson size={20} className="text-slate-600"/>
                        </button>

                        <label className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg group-hover:scale-110 transition-transform"><Upload size={20}/></div>
                                <div className="text-right">
                                    <div className="font-bold dark:text-white text-slate-800">بازگردانی اطلاعات</div>
                                    <div className="text-[10px] text-slate-500">آپلود فایل JSON و جایگزینی</div>
                                </div>
                            </div>
                            <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
                            <FileJson size={20} className="text-slate-600"/>
                        </label>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <button 
                            onClick={handleFactoryReset}
                            className="w-full py-3 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <AlertTriangle size={16}/>
                            بازگشت به تنظیمات کارخانه (پاکسازی کامل)
                        </button>
                    </div>
                </GlassCard>

                {/* 3. CARD PAYMENT SETTINGS */}
                <GlassCard className="border-t-4 border-t-yellow-500">
                    <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="text-yellow-400"/>
                        <h3 className="font-bold text-lg dark:text-white text-slate-800">اطلاعات پرداخت کارت‌به‌کارت (فروشگاه)</h3>
                    </div>
                    
                    <div className="text-sm text-slate-400 mb-6 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                        <p>شماره کارت و نام صاحب حساب بانکی خود را جهت نمایش به کاربران ربات تلگرام در مرحله ثبت سفارش و تسویه حساب دستی وارد نمایید.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1.5">شماره ۱۶ رقمی کارت بانکی</label>
                            <input 
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="مثال: ۶۰۳۷۹۹۱۸۱۲۳۴۵۶۷۸"
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white dir-ltr text-left font-mono outline-none focus:border-yellow-500 transition-colors"
                                dir="ltr"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-slate-500 mb-1.5">نام و نام خانوادگی صاحب حساب</label>
                            <input 
                                value={cardOwner}
                                onChange={(e) => setCardOwner(e.target.value)}
                                placeholder="مثال: علی جلالی"
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-yellow-500 transition-colors"
                            />
                        </div>
                    </div>
                </GlassCard>

                {/* 4. ADMIN & SUPPORT CHAT ID SETTINGS */}
                <GlassCard className="border-t-4 border-t-emerald-500">
                    <div className="flex items-center gap-2 mb-4">
                        <UserCog className="text-emerald-400"/>
                        <h3 className="font-bold text-lg dark:text-white text-slate-800">اعلان سفارش‌ها و پشتیبانی ادمین</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">آیدی عددی ادمین (اختیاری)</label>
                            <input 
                                value={adminChatId}
                                onChange={(e) => setAdminChatId(e.target.value)}
                                placeholder="مثال: 123456789"
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white dir-ltr text-left font-mono outline-none focus:border-emerald-500 transition-colors"
                                dir="ltr"
                            />
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                اگه این رو پر کنی، هر سفارش جدید (با عکس فیش پرداخت) مستقیم به همین آیدی عددی توی تلگرام هم ارسال میشه — جدا از کانال دیتابیس، حتی اگه کانالی تنظیم نکرده باشی.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-white/5 space-y-3">
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">آیدی عددی پشتیبانی (اختیاری)</label>
                            <input 
                                value={supportChatId}
                                onChange={(e) => setSupportChatId(e.target.value)}
                                placeholder="مثال: 987654321"
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white dir-ltr text-left font-mono outline-none focus:border-emerald-500 transition-colors"
                                dir="ltr"
                            />
                            <p className="text-xs text-slate-400 leading-relaxed">
                                وقتی خریدارهای ربات دستور /support رو بزنن یا دکمه‌ی پشتیبانی رو لمس کنن، پیامشون مستقیم به همین آیدی میرسه — جدا از اعلان سفارش‌ها. اگه خالی بمونه، همون آیدی عددی ادمین استفاده میشه.
                            </p>

                            <button
                                type="button"
                                onClick={addSupportButtonToRootMenu}
                                className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-2 mt-2 w-full md:w-auto"
                            >
                                <Plus size={16} />
                                <span>افزودن دکمه‌ی پشتیبانی به منوی اصلی</span>
                            </button>
                        </div>
                    </div>
                </GlassCard>

                {/* 5. POST CONFIRM MENU SETTINGS */}
                <GlassCard className="border-t-4 border-t-blue-500">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquareCode className="text-blue-400"/>
                        <h3 className="font-bold text-lg dark:text-white text-slate-800">پیام بعد از تایید سفارش</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">انتخاب منوی ارسال خودکار</label>
                            <select
                                value={postConfirmMenuId}
                                onChange={(e) => setPostConfirmMenuId(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors cursor-pointer"
                            >
                                <option value="" className="bg-slate-900 text-slate-300">هیچکدام (پیش‌فرض)</option>
                                {Object.entries(getKbMenus()).map(([id, menu]) => (
                                    <option key={id} value={id} className="bg-slate-900 text-white">
                                        {menu.title || menu.content || id} ({id})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                وقتی سفارشی رو از صفحهی سفارشها تایید میکنی، علاوه بر پیام تایید، این منو (با هر متن، عکس، دکمه یا لینکی که توش گذاشتی) هم مستقیم برای خریدار ارسال میشه — مثلاً لینک دانلود، دکمهی پیگیری سفارش، یا راهنمای استفاده.
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* 6. MINI APP MODULES SETTINGS */}
                <GlassCard className="border-t-4 border-t-indigo-500">
                    <div className="flex items-center gap-2 mb-4">
                        <AppWindow className="text-indigo-400"/>
                        <h3 className="font-bold text-lg dark:text-white text-slate-800">ماژول‌های اپلیکیشن فروشگاه (Mini App)</h3>
                    </div>

                    <p className="text-xs text-slate-400 mb-5 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                        هر ماژولی که تیک بزنی، به‌عنوان یه تب داخل Mini App مشتری‌هات ظاهر میشه.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label 
                            onClick={() => toggleMiniAppModule('shop')}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                miniappModules.includes('shop') 
                                    ? 'bg-blue-600/15 border-blue-500/50 text-white' 
                                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <input 
                                type="checkbox" 
                                checked={miniappModules.includes('shop')}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-blue-600 border-white/20 bg-black/40 focus:ring-0"
                            />
                            <span className="text-sm font-bold">🛍 فروشگاه</span>
                        </label>

                        <label 
                            onClick={() => toggleMiniAppModule('orders')}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                miniappModules.includes('orders') 
                                    ? 'bg-blue-600/15 border-blue-500/50 text-white' 
                                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <input 
                                type="checkbox" 
                                checked={miniappModules.includes('orders')}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-blue-600 border-white/20 bg-black/40 focus:ring-0"
                            />
                            <span className="text-sm font-bold">📦 سوابق سفارش‌ها</span>
                        </label>

                        <label 
                            onClick={() => toggleMiniAppModule('support')}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                miniappModules.includes('support') 
                                    ? 'bg-blue-600/15 border-blue-500/50 text-white' 
                                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <input 
                                type="checkbox" 
                                checked={miniappModules.includes('support')}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-blue-600 border-white/20 bg-black/40 focus:ring-0"
                            />
                            <span className="text-sm font-bold">💬 پشتیبانی</span>
                        </label>

                        <label 
                            onClick={() => toggleMiniAppModule('forms')}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                miniappModules.includes('forms') 
                                    ? 'bg-blue-600/15 border-blue-500/50 text-white' 
                                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <input 
                                type="checkbox" 
                                checked={miniappModules.includes('forms')}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-blue-600 border-white/20 bg-black/40 focus:ring-0"
                            />
                            <span className="text-sm font-bold">📝 فرم‌ها</span>
                        </label>

                        <label 
                            onClick={() => toggleMiniAppModule('gallery')}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                miniappModules.includes('gallery') 
                                    ? 'bg-blue-600/15 border-blue-500/50 text-white' 
                                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <input 
                                type="checkbox" 
                                checked={miniappModules.includes('gallery')}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-blue-600 border-white/20 bg-black/40 focus:ring-0"
                            />
                            <span className="text-sm font-bold">🖼 گالری</span>
                        </label>

                        <label 
                            onClick={() => toggleMiniAppModule('announcements')}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                miniappModules.includes('announcements') 
                                    ? 'bg-blue-600/15 border-blue-500/50 text-white' 
                                    : 'bg-black/20 border-white/10 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <input 
                                type="checkbox" 
                                checked={miniappModules.includes('announcements')}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-blue-600 border-white/20 bg-black/40 focus:ring-0"
                            />
                            <span className="text-sm font-bold">🔔 اعلانات</span>
                        </label>
                    </div>
                </GlassCard>

                {/* 7. GALLERY MANAGEMENT */}
                <GlassCard className="border-t-4 border-t-purple-500">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="text-purple-400"/>
                            <h3 className="font-bold text-lg dark:text-white text-slate-800">مدیریت گالری تصاویر (Mini App)</h3>
                        </div>
                        <label className={`cursor-pointer px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/20 active:scale-95 ${isUploadingGallery ? 'opacity-50 pointer-events-none' : ''}`}>
                            {isUploadingGallery ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                            <span>افزودن عکس جدید</span>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleAddGalleryImage} 
                                className="hidden" 
                                disabled={isUploadingGallery}
                            />
                        </label>
                    </div>

                    <p className="text-xs text-slate-400 mb-5 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                        تصاویری که اینجا اضافه می‌کنی در تب «گالری» Mini App به خریداران نمایش داده میشه.
                    </p>

                    {galleryImages.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-2xl bg-black/20 text-slate-400 text-xs">
                            هنوز تصویری به گالری اضافه نشده است. روی «افزودن عکس جدید» کلیک کنید.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {galleryImages.map((img) => (
                                <div key={img.id} className="bg-black/30 border border-white/10 rounded-xl p-3 flex flex-col gap-2.5">
                                    <div className="relative w-full h-36 rounded-lg bg-black/40 overflow-hidden border border-white/5 flex items-center justify-center">
                                        {getDisplayableImageUrl(img.imageUrl) ? (
                                            <img src={getDisplayableImageUrl(img.imageUrl)!} alt={img.caption || 'گالری'} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-500 gap-1">
                                                <ImageIcon size={24} />
                                                <span className="text-[10px] text-slate-400">تصویر غیرقابل نمایش</span>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => handleDeleteGalleryImage(img.id)}
                                            className="absolute top-2 left-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors shadow-md"
                                            title="حذف عکس"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={img.caption || ''} 
                                        onChange={(e) => handleUpdateGalleryCaption(img.id, e.target.value)}
                                        placeholder="توضیح اختیاری برای این عکس..."
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};
