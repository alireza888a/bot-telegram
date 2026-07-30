import React, { useState, useEffect } from 'react';
import { Server, CheckCircle, AlertTriangle } from 'lucide-react';
import { telegramService } from '../services/telegramService';
import { syncNow } from '../services/cloudSync';
import { MiniAppModule, GalleryImage } from '../types';

import { DatabaseChannelCard } from '../components/settings/DatabaseChannelCard';
import { BackupRestoreCard } from '../components/settings/BackupRestoreCard';
import { PaymentSettingsCard } from '../components/settings/PaymentSettingsCard';
import { AdminSupportCard } from '../components/settings/AdminSupportCard';
import { PostConfirmMenuCard } from '../components/settings/PostConfirmMenuCard';
import { MiniAppModulesCard } from '../components/settings/MiniAppModulesCard';
import { GalleryManagementCard } from '../components/settings/GalleryManagementCard';
import { FactoryResetModal } from '../components/settings/FactoryResetModal';
import { RestoreBackupModal } from '../components/settings/RestoreBackupModal';

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
            <FactoryResetModal
                showResetModal={showResetModal}
                confirmFactoryReset={confirmFactoryReset}
                setShowResetModal={setShowResetModal}
            />

            {/* Modal for Restore Backup */}
            <RestoreBackupModal
                showRestoreModal={showRestoreModal}
                confirmRestore={confirmRestore}
                cancelRestore={cancelRestore}
            />

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
                <DatabaseChannelCard
                    dbChannel={dbChannel}
                    setDbChannel={setDbChannel}
                    handleSaveDb={handleSaveDb}
                    isCheckingDb={isCheckingDb}
                    dbStatus={dbStatus}
                    statusMsg={statusMsg}
                />

                {/* 2. BACKUP & RESTORE */}
                <BackupRestoreCard
                    handleBackup={handleBackup}
                    handleFileSelect={handleFileSelect}
                    handleFactoryReset={handleFactoryReset}
                />

                {/* 3. CARD PAYMENT SETTINGS */}
                <PaymentSettingsCard
                    cardNumber={cardNumber}
                    setCardNumber={setCardNumber}
                    cardOwner={cardOwner}
                    setCardOwner={setCardOwner}
                />

                {/* 4. ADMIN & SUPPORT CHAT ID SETTINGS */}
                <AdminSupportCard
                    adminChatId={adminChatId}
                    setAdminChatId={setAdminChatId}
                    supportChatId={supportChatId}
                    setSupportChatId={setSupportChatId}
                    addSupportButtonToRootMenu={addSupportButtonToRootMenu}
                />

                {/* 5. POST CONFIRM MENU SETTINGS */}
                <PostConfirmMenuCard
                    postConfirmMenuId={postConfirmMenuId}
                    setPostConfirmMenuId={setPostConfirmMenuId}
                    getKbMenus={getKbMenus}
                />

                {/* 6. MINI APP MODULES SETTINGS */}
                <MiniAppModulesCard
                    miniappModules={miniappModules}
                    toggleMiniAppModule={toggleMiniAppModule}
                />

                {/* 7. GALLERY MANAGEMENT */}
                <GalleryManagementCard
                    galleryImages={galleryImages}
                    isUploadingGallery={isUploadingGallery}
                    handleAddGalleryImage={handleAddGalleryImage}
                    handleUpdateGalleryCaption={handleUpdateGalleryCaption}
                    handleDeleteGalleryImage={handleDeleteGalleryImage}
                />
            </div>
        </div>
    );
};
