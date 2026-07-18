
import React, { useEffect, useRef } from 'react';
import { telegramService, TelegramUpdate } from '../services/telegramService';
import { MenuPage, FormConfig, CommandConfig, QueueItem, Product, CartItem, Order } from '../types';

// --- LOGGING HELPER ---
const broadcastLog = (user: string, text: string, type: 'incoming' | 'outgoing' | 'system') => {
    const event = new CustomEvent('bot-log', { 
        detail: { 
            id: Date.now() + Math.random(),
            time: new Date().toLocaleTimeString('fa-IR'),
            user, 
            text, 
            type 
        } 
    });
    window.dispatchEvent(event);
    
    try {
        const existing = JSON.parse(localStorage.getItem('bot_logs') || '[]');
        const newLog = { id: Date.now(), time: new Date().toLocaleTimeString('fa-IR'), user, text, type };
        localStorage.setItem('bot_logs', JSON.stringify([...existing, newLog].slice(-50)));
    } catch(e) {}
};

// --- USER MANAGEMENT HELPER ---
const saveUserToAudience = (user: any) => {
    try {
        const users = JSON.parse(localStorage.getItem('bot_users') || '[]');
        const today = new Date().toISOString().split('T')[0];
        const userIdStr = String(user.id);
        const existingIndex = users.findIndex((u: any) => String(u.id) === userIdStr);
        
        if (existingIndex === -1) {
            users.push({ 
                id: userIdStr, 
                firstName: user.first_name || 'کاربر', 
                first_name: user.first_name || 'کاربر', 
                lastName: user.last_name || '',
                last_name: user.last_name || '',
                username: user.username || '',
                joinedAt: today,
                joined_at: Date.now(),
                lastActive: today,
                messagesCount: 1,
                status: 'active',
                tags: []
            });
        } else {
            const existing = users[existingIndex];
            users[existingIndex] = {
                ...existing,
                firstName: existing.firstName || existing.first_name || user.first_name || 'کاربر',
                first_name: existing.firstName || existing.first_name || user.first_name || 'کاربر',
                lastName: existing.lastName || existing.last_name || user.last_name || '',
                last_name: existing.lastName || existing.last_name || user.last_name || '',
                username: existing.username || user.username || '',
                lastActive: today,
                messagesCount: (existing.messagesCount || 0) + 1
            };
        }
        localStorage.setItem('bot_users', JSON.stringify(users));
    } catch (e) { console.error('Error saving user', e); }
};

// --- TEXT PROCESSOR ---
const processMessageContent = (content: string, user: any) => {
    if (!content) return '';
    const now = new Date();
    return content
        .replace(/{first_name}|{نام}/g, user.first_name || 'کاربر')
        .replace(/{last_name}|{نام_خانوادگی}/g, user.last_name || '')
        .replace(/{username}|{یوزرنیم}/g, user.username ? `@${user.username}` : 'ندارد')
        .replace(/{id}|{آیدی}/g, String(user.id))
        .replace(/{date}|{تاریخ}/g, now.toLocaleDateString('fa-IR'))
        .replace(/{time}|{ساعت}/g, now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
};

export const BotEngine: React.FC = () => {
    const offsetRef = useRef(0);
    const isProcessingRef = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const queueIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const userSessions = useRef<Record<number, { formId: string; step: number; answers: any[] }>>({});

    // ==========================================
    // 1. QUEUE WORKER (SCHEDULED MESSAGES)
    // ==========================================
    useEffect(() => {
        queueIntervalRef.current = setInterval(async () => {
            const token = localStorage.getItem('bot_token');
            if (!token) return;

            // Load Queue
            const rawQueue = localStorage.getItem('channel_queue');
            if (!rawQueue) return;
            
            let queue: QueueItem[] = [];
            try { queue = JSON.parse(rawQueue); } catch { return; }

            const now = Date.now();
            // Find items that are PENDING and their time has come (createdAt <= now)
            const pendingItems = queue.filter(q => q.status === 'pending' && q.createdAt <= now);

            if (pendingItems.length === 0) return;

            // Optimistically mark as processing to prevent double send in next tick
            const newQueueState = queue.map(q => pendingItems.find(p => p.id === q.id) ? { ...q, status: 'processing' } : q);
            localStorage.setItem('channel_queue', JSON.stringify(newQueueState));

            // Process each item
            for (const item of pendingItems) {
                try {
                    // Determine Targets
                    let targets: (string | number)[] = [];
                    
                    if (item.targetChannelId === 'all' || item.targetChannelId === 'BROADCAST_ALL') {
                        // Broadcast to Users
                        const users = JSON.parse(localStorage.getItem('bot_users') || '[]');
                        targets = users.map((u: any) => u.id);
                    } else {
                        // Channel Post
                        targets = [item.targetChannelId];
                    }

                    if (targets.length === 0) {
                        updateItemStatus(item.id, 'failed');
                        continue;
                    }

                    // Send Loop
                    let successCount = 0;
                    for (const targetId of targets) {
                         // Small delay to prevent flood limits
                         await new Promise(r => setTimeout(r, 50)); 
                         const res = await dispatchQueueItem(token, targetId, item);
                         if (res) successCount++;
                    }

                    // Finalize
                    updateItemStatus(item.id, 'sent');
                    broadcastLog('System', `Scheduled Task Executed: ${item.content.substring(0, 20)}... to ${successCount} targets.`, 'system');

                } catch (e) {
                    console.error('Queue Error', e);
                    updateItemStatus(item.id, 'failed');
                    broadcastLog('System', `Scheduled Task Failed: ${item.id}`, 'system');
                }
            }
        }, 30000); // Check every 30 seconds

        return () => {
            if (queueIntervalRef.current) clearInterval(queueIntervalRef.current);
        };
    }, []);

    const updateItemStatus = (id: string, status: 'sent' | 'failed') => {
        const q = JSON.parse(localStorage.getItem('channel_queue') || '[]');
        const newQ = q.map((x: any) => x.id === id ? { ...x, status } : x);
        localStorage.setItem('channel_queue', JSON.stringify(newQ));
    };

    const dispatchQueueItem = async (token: string, chatId: string | number, item: QueueItem) => {
        const opts = { disable_notification: item.settings.silent, protect_content: item.settings.protect };
        
        let replyMarkup = undefined;
        let finalRows = [...item.rows];
        
        // Append Reaction Buttons if enabled
        if (item.settings.addReactions) {
            finalRows.push({
                id: 'reaction_row',
                buttons: [
                    { id: 'like', text: '👍 0', type: 'callback', value: 'reaction_like' },
                    { id: 'dislike', text: '👎 0', type: 'callback', value: 'reaction_dislike' }
                ]
            });
        }

        if (finalRows.length > 0) {
            replyMarkup = {
                inline_keyboard: finalRows.map(r => r.buttons.map(b => ({
                    text: b.text,
                    url: b.type === 'link' ? b.value : undefined,
                    callback_data: b.type !== 'link' ? (b.value || 'noop') : undefined
                })))
            };
        }

        // Handle Media
        if (item.mediaFiles && item.mediaFiles.length > 0) {
            if (item.mediaFiles.length > 1) {
                // Album
                const media = item.mediaFiles.map((m, i) => ({
                    type: m.type as any,
                    media: m.fileId || m.url, // Prefer FileID
                    caption: i === 0 ? item.content : '',
                    parse_mode: 'HTML'
                }));
                const res = await telegramService.sendMediaGroup(token, chatId, media as any, undefined, opts);
                return res.ok;
            } else {
                // Single File
                const m = item.mediaFiles[0];
                const file = m.fileId || m.url;
                let res;
                if (m.type === 'image') res = await telegramService.sendPhoto(token, chatId, file, item.content, replyMarkup, opts);
                else if (m.type === 'video') res = await telegramService.sendVideo(token, chatId, file, item.content, replyMarkup, opts);
                else res = await telegramService.sendDocument(token, chatId, file, item.content, replyMarkup, opts);
                return res.ok;
            }
        } else {
            // Text Only
            const res = await telegramService.sendMessage(token, chatId, item.content, replyMarkup, opts);
            // Pin logic for channels
            if (res.ok && item.settings.pin && item.targetChannelId !== 'all' && item.targetChannelId !== 'BROADCAST_ALL') {
                await telegramService.pinChatMessage(token, chatId, res.result!.message_id, item.settings.silent);
            }
            return res.ok;
        }
    };

    // ==========================================
    // 2. MAIN BOT UPDATE LOOP (MESSAGES)
    // ==========================================
    const runBotCycle = async () => {
        if (isProcessingRef.current) return;
        
        const token = localStorage.getItem('bot_token');
        const autoReply = localStorage.getItem('bot_auto_reply') !== 'false';
        const webhookUrl = localStorage.getItem('bot_webhook_url');

        if (!token || webhookUrl) return; 

        isProcessingRef.current = true;
        try {
            const res = await telegramService.getUpdates(token, offsetRef.current + 1, 10);
            if (res.ok && res.result && res.result.length > 0) {
                let maxId = offsetRef.current;
                
                for (const update of res.result) {
                    if (update.update_id > maxId) maxId = update.update_id;
                    if (autoReply) {
                        await handleUpdate(token, update);
                    }
                }
                offsetRef.current = maxId;
            }
        } catch (e) {
            console.error('Polling Error', e);
        } finally {
            isProcessingRef.current = false;
        }
    };

    const handleUpdate = async (token: string, update: TelegramUpdate) => {
        const user = update.message?.from || update.callback_query?.from;
        const chatId = update.message?.chat.id || update.callback_query?.message?.chat.id;
        
        if (!user || !chatId) return;

        saveUserToAudience(user);

        // Load Data
        let menus: Record<string, MenuPage> = {};
        let forms: Record<string, FormConfig> = {};
        let commands: CommandConfig[] = [];
        let channels: any[] = [];
        let forceJoinEnabled = false;

        try {
            menus = JSON.parse(localStorage.getItem('kb_menus') || '{}');
            forms = JSON.parse(localStorage.getItem('kb_forms') || '{}');
            commands = JSON.parse(localStorage.getItem('bot_commands') || '[]');
            channels = JSON.parse(localStorage.getItem('saved_channels') || '[]');
            forceJoinEnabled = localStorage.getItem('force_join_enabled') === 'true';
        } catch {}

        // Admin Reply (Tickets)
        if (update.message?.reply_to_message) {
            const reply = update.message.reply_to_message;
            const content = reply.text || reply.caption || '';
            const match = content.match(/#id_(\d+)/);
            
            if (match) {
                const targetUserId = match[1];
                const replyText = update.message.text;
                
                if (replyText) {
                    await telegramService.sendMessage(token, targetUserId, `📬 <b>پاسخ ادمین:</b>\n\n${replyText}`);
                    await telegramService.sendMessage(token, chatId, `✅ پاسخ شما برای کاربر ${targetUserId} ارسال شد.`);
                    broadcastLog('Admin', `Replied to ${targetUserId}`, 'system');
                } else {
                    await telegramService.copyMessage(token, targetUserId, chatId, update.message.message_id, `📬 <b>پاسخ ادمین:</b>`);
                    await telegramService.sendMessage(token, chatId, `✅ پیام شما برای کاربر ${targetUserId} ارسال شد.`);
                }
                return;
            }
        }

        // Force Join Check
        const isCheckJoinAction = update.callback_query?.data === 'check_join';
        if (forceJoinEnabled && !isCheckJoinAction) {
            const lockedChannels = channels.filter(c => c.isLocked);
            if (lockedChannels.length > 0) {
                let notJoined = [];
                for (const ch of lockedChannels) {
                    try {
                        const res = await telegramService.getChatMember(token, ch.id, user.id);
                        if (res.ok && res.result) {
                            const s = res.result.status;
                            if (s === 'left' || s === 'kicked' || s === 'restricted') notJoined.push(ch);
                        }
                    } catch (e) {}
                }

                if (notJoined.length > 0) {
                    const buttons: {text: string, url?: string, callback_data?: string}[][] = notJoined.map(ch => ([{ 
                        text: `عضویت در ${ch.title || 'کانال'}`, 
                        url: `https://t.me/${ch.username}` 
                    }]));
                    buttons.push([{ text: '✅ عضو شدم', callback_data: 'check_join' }]);
                    const warningText = `⛔️ کاربر گرامی ${user.first_name}،\n\nبرای استفاده از ربات لطفا ابتدا در کانال‌های زیر عضو شوید:`;
                    
                    if (update.callback_query) {
                         await telegramService.answerCallbackQuery(token, update.callback_query.id, 'لطفا ابتدا عضو شوید!');
                         await telegramService.sendMessage(token, chatId, warningText, { inline_keyboard: buttons });
                    } else {
                        await telegramService.sendMessage(token, chatId, warningText, { inline_keyboard: buttons });
                    }
                    return;
                }
            }
        }

        // 1. Text Messages
        if (update.message) {
            const text = update.message.text;
            broadcastLog(user.first_name, text || '[Media]', 'incoming');

            if (text === '/cancel') {
                delete userSessions.current[user.id];
                await telegramService.sendMessage(token, chatId, '🚫 عملیات لغو شد.');
                return;
            }

            if (text && text.startsWith('/')) {
                const cmdName = text.substring(1).split(' ')[0].toLowerCase();
                if (cmdName === 'shop') {
                    await sendShopCatalog(token, chatId, user);
                    return;
                }
                const matched = commands.find(c => c.command === cmdName);
                if (matched) {
                    if (matched.actionType === 'text') {
                        await telegramService.sendMessage(token, chatId, processMessageContent(matched.actionValue, user));
                    } else if (matched.actionType === 'menu' && menus[matched.actionValue]) {
                        await sendMenu(token, chatId, menus[matched.actionValue], user);
                    }
                    return;
                }
                if (cmdName === 'start' && menus['root']) {
                    await sendMenu(token, chatId, menus['root'], user);
                    return;
                }
            }

            // Forms & Shop Awaiting Receipt
            if (userSessions.current[user.id]) {
                const session = userSessions.current[user.id] as any;
                if (session.type === 'awaiting_receipt') {
                    if (update.message.photo) {
                        await handleReceiptPhoto(token, chatId, user, update.message.photo);
                    } else {
                        await telegramService.sendMessage(token, chatId, '⚠️ لطفا تصویر فیش پرداخت خود را به صورت عکس (Photo) ارسال کنید. در صورتی که تمایل به لغو سفارش دارید دستور /cancel را ارسال کنید.');
                    }
                    return;
                }
                const form = forms[session.formId];
                if (form) {
                    const question = form.questions[session.step];
                    let answerValue: string | null = null;
                    let fileId: string | null = null;

                    if (question.type === 'text') {
                        if (update.message.text) answerValue = update.message.text;
                        else await telegramService.sendMessage(token, chatId, 'لطفا متن ارسال کنید.');
                    } else if (question.type === 'number') {
                        if (update.message.text && !isNaN(Number(update.message.text))) answerValue = update.message.text;
                        else await telegramService.sendMessage(token, chatId, 'لطفا فقط عدد وارد کنید.');
                    } else if (question.type === 'photo') {
                        if (update.message.photo) {
                            answerValue = '[تصویر]';
                            fileId = update.message.photo[update.message.photo.length - 1].file_id;
                        } else {
                            await telegramService.sendMessage(token, chatId, 'لطفا یک عکس ارسال کنید.');
                        }
                    } else if (question.type === 'document') {
                        if (update.message.document || update.message.video || update.message.audio) {
                            answerValue = '[فایل]';
                            fileId = update.message.document?.file_id || update.message.video?.file_id || update.message.audio?.file_id;
                        } else {
                            await telegramService.sendMessage(token, chatId, 'لطفا فایل معتبر ارسال کنید.');
                        }
                    }

                    if (answerValue) {
                        session.answers.push({ q: question.text, a: answerValue, type: question.type, fileId, msgId: update.message.message_id });
                        session.step++;
                        
                        if (session.step < form.questions.length) {
                            await telegramService.sendMessage(token, chatId, form.questions[session.step].text);
                        } else {
                            await telegramService.sendMessage(token, chatId, '✅ اطلاعات ثبت شد. منتظر پاسخ ادمین باشید.');
                            if(form.adminId) {
                                const report = session.answers.map((x,i) => `${i+1}. ${x.q}\n   ${x.a}`).join('\n');
                                await telegramService.sendMessage(token, form.adminId, `📝 <b>فرم جدید:</b>\n👤 ${user.first_name} (#id_${user.id})\n\n${report}`);
                                for (const ans of session.answers) {
                                    if ((ans.type === 'photo' || ans.type === 'document') && ans.msgId) {
                                        await telegramService.copyMessage(token, form.adminId, chatId, ans.msgId, `📎 فایل پیوست از: #id_${user.id}`);
                                    }
                                }
                            }
                            delete userSessions.current[user.id];
                        }
                    }
                }
            }
        }

        // 2. Callbacks
        if (update.callback_query?.data) {
            const data = update.callback_query.data;
            const messageId = update.callback_query.message.message_id;
            broadcastLog(user.first_name, `Button: ${data}`, 'incoming');

            // --- REACTION HANDLING (Like/Dislike) ---
            if (data === 'reaction_like' || data === 'reaction_dislike') {
                const uniqueKey = `${chatId}_${messageId}`;
                let votes = { likes: [] as number[], dislikes: [] as number[] };
                try {
                    const allVotes = JSON.parse(localStorage.getItem('kb_votes') || '{}');
                    if (allVotes[uniqueKey]) votes = allVotes[uniqueKey];
                    
                    const userId = user.id;
                    const isLike = data === 'reaction_like';

                    if (isLike) {
                        if (votes.likes.includes(userId)) {
                            // Already liked, remove it (toggle off)
                            votes.likes = votes.likes.filter(id => id !== userId);
                        } else {
                            // Not liked, add like and remove dislike if exists
                            votes.likes.push(userId);
                            votes.dislikes = votes.dislikes.filter(id => id !== userId);
                        }
                    } else {
                        // Dislike logic
                        if (votes.dislikes.includes(userId)) {
                            votes.dislikes = votes.dislikes.filter(id => id !== userId);
                        } else {
                            votes.dislikes.push(userId);
                            votes.likes = votes.likes.filter(id => id !== userId);
                        }
                    }

                    // Save Back
                    allVotes[uniqueKey] = votes;
                    localStorage.setItem('kb_votes', JSON.stringify(allVotes));

                    // Update UI (Edit Message Buttons)
                    const currentKeyboard = update.callback_query.message.reply_markup;
                    const newKeyboard = {
                        inline_keyboard: currentKeyboard.inline_keyboard.map((row: any[]) => {
                            // Find the reaction row (assume it's the one with reaction_like/dislike data)
                            if (row.some(btn => btn.callback_data === 'reaction_like')) {
                                return [
                                    { text: `👍 ${votes.likes.length}`, callback_data: 'reaction_like' },
                                    { text: `👎 ${votes.dislikes.length}`, callback_data: 'reaction_dislike' }
                                ];
                            }
                            return row;
                        })
                    };

                    await telegramService.editMessageReplyMarkup(token, chatId, messageId, newKeyboard);
                    await telegramService.answerCallbackQuery(token, update.callback_query.id, 'رأی شما ثبت شد ✅');

                } catch (e) {
                    console.error('Vote Error', e);
                }
                return;
            }

            if (data === 'check_join') {
                const lockedChannels = channels.filter(c => c.isLocked);
                let stillNotJoined = false;
                for (const ch of lockedChannels) {
                    const res = await telegramService.getChatMember(token, ch.id, user.id);
                    if (res.ok && res.result) {
                        const s = res.result.status;
                        if (s === 'left' || s === 'kicked' || s === 'restricted') stillNotJoined = true; 
                    }
                }

                if (stillNotJoined) {
                     await telegramService.answerCallbackQuery(token, update.callback_query.id, 'هنوز عضو نشده‌اید! ❌');
                } else {
                     await telegramService.answerCallbackQuery(token, update.callback_query.id, 'عضویت تایید شد ✅');
                     if (menus['root']) await sendMenu(token, chatId, menus['root'], user);
                }
                return;
            }

            if (data.startsWith('cart_add_')) {
                const productId = data.replace('cart_add_', '');
                await handleCartAdd(token, chatId, user, productId, update.callback_query.id);
                return;
            }

            if (data === 'cart_view') {
                await handleCartView(token, chatId, user, update.callback_query.id);
                return;
            }

            if (data === 'cart_clear') {
                await handleCartClear(token, chatId, user, update.callback_query.id);
                return;
            }

            if (data === 'cart_checkout') {
                await handleCartCheckout(token, chatId, user, update.callback_query.id);
                return;
            }

            if (data === 'cart_shop') {
                await telegramService.answerCallbackQuery(token, update.callback_query.id);
                await sendShopCatalog(token, chatId, user);
                return;
            }

            if (menus[data]) {
                await sendMenu(token, chatId, menus[data], user);
                await telegramService.answerCallbackQuery(token, update.callback_query.id);
                return;
            }

            if (data.startsWith('form_') && forms[data]) {
                userSessions.current[user.id] = { formId: data, step: 0, answers: [] };
                await telegramService.sendMessage(token, chatId, forms[data].questions[0].text);
                await telegramService.answerCallbackQuery(token, update.callback_query.id);
                return;
            }
            
            await telegramService.answerCallbackQuery(token, update.callback_query.id);
        }
    };

    const sendMenu = async (token: string, chatId: number | string, menu: MenuPage, user: any) => {
        const kb = {
            inline_keyboard: [
                ...menu.rows.map(r => r.buttons.map(b => ({
                    text: b.text,
                    callback_data: b.type === 'link' ? undefined : (b.type==='submenu' ? (b.targetMenuId||'root') : (b.type==='form'?b.value:'noop')),
                    url: b.type === 'link' ? b.value : undefined
                }))),
                ...(menu.id !== 'root' ? [[{text: '🏠 منوی اصلی', callback_data: 'root'}, {text: '🔙 بازگشت', callback_data: menu.parentId || 'root'}]] : [])
            ]
        };
        
        const content = processMessageContent(menu.content, user);
        
        if (menu.media && menu.media.length > 0) {
             const m = menu.media[0];
             const file = m.fileId || m.url; // Use fileId if available
             if (m.type === 'image') await telegramService.sendPhoto(token, chatId, file, content, kb);
             else if (m.type === 'video') await telegramService.sendVideo(token, chatId, file, content, kb);
             else await telegramService.sendMessage(token, chatId, content, kb);
        } else {
             await telegramService.sendMessage(token, chatId, content, kb);
        }
    };

    const sendShopCatalog = async (token: string, chatId: number | string, user: any) => {
        let products: Product[] = [];
        try {
            products = JSON.parse(localStorage.getItem('bot_products') || '[]');
        } catch {}

        const activeProducts = products.filter(p => p.active);

        if (activeProducts.length === 0) {
            await telegramService.sendMessage(token, chatId, "🛍️ <b>فروشگاه در حال حاضر غیرفعال است یا محصولی تعریف نشده است.</b>");
            return;
        }

        let messageText = "🛍️ <b>کاتالوگ محصولات فروشگاه</b>\n\nلطفاً برای خرید هر محصول روی دکمه افزودن به سبد خرید کلیک کنید:\n\n";
        const buttons = [];

        for (const p of activeProducts) {
            messageText += `🔹 <b>${p.name}</b>\n💰 قیمت: ${p.price.toLocaleString('fa-IR')} تومان\n📝 ${p.description}\n\n`;
            buttons.push([{
                text: `🛒 افزودن ${p.name} به سبد`,
                callback_data: `cart_add_${p.id}`
            }]);
        }

        buttons.push([
            { text: "🧺 مشاهده سبد خرید", callback_data: "cart_view" },
            { text: "🗑️ خالی کردن سبد", callback_data: "cart_clear" }
        ]);

        await telegramService.sendMessage(token, chatId, messageText, { inline_keyboard: buttons });
    };

    const handleCartAdd = async (token: string, chatId: number | string, user: any, productId: string, callbackQueryId: string) => {
        let products: Product[] = [];
        try {
            products = JSON.parse(localStorage.getItem('bot_products') || '[]');
        } catch {}

        const product = products.find(p => p.id === productId);
        if (!product) {
            await telegramService.answerCallbackQuery(token, callbackQueryId, "❌ محصول یافت نشد.");
            return;
        }

        let carts: Record<string, CartItem[]> = {};
        try {
            carts = JSON.parse(localStorage.getItem('bot_carts') || '{}');
        } catch {}

        const userIdStr = String(user.id);
        const userCart = carts[userIdStr] || [];
        const existingItemIdx = userCart.findIndex(item => item.productId === productId);

        if (existingItemIdx > -1) {
            userCart[existingItemIdx].qty += 1;
        } else {
            userCart.push({ productId, qty: 1 });
        }

        carts[userIdStr] = userCart;
        localStorage.setItem('bot_carts', JSON.stringify(carts));

        await telegramService.answerCallbackQuery(token, callbackQueryId, `🛒 ${product.name} به سبد خرید اضافه شد!`);
    };

    const handleCartView = async (token: string, chatId: number | string, user: any, callbackQueryId?: string) => {
        let carts: Record<string, CartItem[]> = {};
        let products: Product[] = [];
        try {
            carts = JSON.parse(localStorage.getItem('bot_carts') || '{}');
            products = JSON.parse(localStorage.getItem('bot_products') || '[]');
        } catch {}

        const userIdStr = String(user.id);
        const userCart = carts[userIdStr] || [];

        if (userCart.length === 0) {
            const msg = "🧺 <b>سبد خرید شما خالی است.</b>";
            const buttons = [[{ text: "🛍️ مشاهده محصولات فروشگاه", callback_data: "cart_shop" }]];
            if (callbackQueryId) {
                await telegramService.answerCallbackQuery(token, callbackQueryId);
                await telegramService.sendMessage(token, chatId, msg, { inline_keyboard: buttons });
            } else {
                await telegramService.sendMessage(token, chatId, msg, { inline_keyboard: buttons });
            }
            return;
        }

        let total = 0;
        let messageText = "🧺 <b>سبد خرید شما:</b>\n\n";

        for (const item of userCart) {
            const prod = products.find(p => p.id === item.productId);
            if (prod) {
                const subtotal = prod.price * item.qty;
                total += subtotal;
                messageText += `▪️ <b>${prod.name}</b>\n   تعداد: ${item.qty} × قیمت: ${prod.price.toLocaleString('fa-IR')} = <code>${subtotal.toLocaleString('fa-IR')}</code> تومان\n\n`;
            }
        }

        messageText += `🏁 <b>مبلغ کل قابل پرداخت:</b> <code>${total.toLocaleString('fa-IR')}</code> تومان\n\n`;

        const cardNumber = localStorage.getItem('payment_card_number') || 'تنظیم نشده';
        const cardOwner = localStorage.getItem('payment_card_owner') || 'تنظیم نشده';

        messageText += `💳 <b>اطلاعات پرداخت کارت‌به‌کارت:</b>\n`;
        messageText += `شماره کارت: <code>${cardNumber}</code>\n`;
        messageText += `بنام صاحب حساب: <b>${cardOwner}</b>\n\n`;
        messageText += `⚠️ لطفاً مبلغ فوق را به شماره کارت بالا واریز نموده، سپس دکمه <b>"ثبت سفارش و ارسال فیش"</b> را بزنید و عکس فیش واریزی خود را ارسال کنید.`;

        const buttons = [
            [{ text: "🧾 ثبت سفارش و ارسال فیش پرداخت", callback_data: "cart_checkout" }],
            [
                { text: "🗑️ خالی کردن سبد", callback_data: "cart_clear" },
                { text: "🛍️ بازگشت به فروشگاه", callback_data: "cart_shop" }
            ]
        ];

        if (callbackQueryId) {
            await telegramService.answerCallbackQuery(token, callbackQueryId);
        }
        await telegramService.sendMessage(token, chatId, messageText, { inline_keyboard: buttons });
    };

    const handleCartClear = async (token: string, chatId: number | string, user: any, callbackQueryId: string) => {
        let carts: Record<string, CartItem[]> = {};
        try {
            carts = JSON.parse(localStorage.getItem('bot_carts') || '{}');
        } catch {}

        const userIdStr = String(user.id);
        delete carts[userIdStr];
        localStorage.setItem('bot_carts', JSON.stringify(carts));

        await telegramService.answerCallbackQuery(token, callbackQueryId, "🧹 سبد خرید شما خالی شد.");
        await telegramService.sendMessage(token, chatId, "🧹 سبد خرید شما با موفقیت خالی شد.", {
            inline_keyboard: [[{ text: "🛍️ مشاهده محصولات فروشگاه", callback_data: "cart_shop" }]]
        });
    };

    const handleCartCheckout = async (token: string, chatId: number | string, user: any, callbackQueryId: string) => {
        userSessions.current[user.id] = { type: 'awaiting_receipt' };
        await telegramService.answerCallbackQuery(token, callbackQueryId);
        await telegramService.sendMessage(token, chatId, "لطفاً تصویر (فوتو) فیش واریزی خود را ارسال کنید تا سفارش شما ثبت و توسط ادمین بررسی شود. 📸\n\nبرای لغو این عملیات دستور /cancel را بفرستید.");
    };

    const handleReceiptPhoto = async (token: string, chatId: number | string, user: any, photoUpdate: any) => {
        let carts: Record<string, CartItem[]> = {};
        let products: Product[] = [];
        try {
            carts = JSON.parse(localStorage.getItem('bot_carts') || '{}');
            products = JSON.parse(localStorage.getItem('bot_products') || '[]');
        } catch {}

        const userIdStr = String(user.id);
        const userCart = carts[userIdStr] || [];

        if (userCart.length === 0) {
            await telegramService.sendMessage(token, chatId, "❌ سبد خرید شما خالی است. ابتدا محصولی به سبد خرید اضافه کنید.");
            delete userSessions.current[user.id];
            return;
        }

        const orderItems = [];
        let total = 0;

        for (const item of userCart) {
            const prod = products.find(p => p.id === item.productId);
            if (prod) {
                orderItems.push({
                    productId: item.productId,
                    name: prod.name,
                    price: prod.price,
                    qty: item.qty
                });
                total += prod.price * item.qty;
            }
        }

        if (orderItems.length === 0) {
            await telegramService.sendMessage(token, chatId, "❌ خطایی در ثبت سفارش رخ داد. محصولات سبد معتبر نیستند.");
            delete userSessions.current[user.id];
            return;
        }

        const newOrder: Order = {
            id: `order_${Date.now()}_${user.id}`,
            userId: userIdStr,
            userFirstName: user.first_name || 'کاربر',
            items: orderItems,
            total: total,
            status: 'pending',
            createdAt: Date.now()
        };

        let orders: Order[] = [];
        try {
            orders = JSON.parse(localStorage.getItem('bot_orders') || '[]');
        } catch {}

        orders.push(newOrder);
        localStorage.setItem('bot_orders', JSON.stringify(orders));

        delete carts[userIdStr];
        localStorage.setItem('bot_carts', JSON.stringify(carts));

        delete userSessions.current[user.id];

        await telegramService.sendMessage(token, chatId, "رسید شما دریافت شد و سفارش ثبت گردید ⏳ پس از تایید توسط ادمین به شما اطلاع‌رسانی می‌شود.");

        const dbChannelId = localStorage.getItem('bot_db_channel');
        if (dbChannelId) {
            try {
                const fileId = photoUpdate[photoUpdate.length - 1].file_id;
                const adminMsg = `🧾 <b>فیش سفارش جدید ثبت شد!</b>\n` +
                                 `👤 خریدار: ${user.first_name} (#id_${user.id})\n` +
                                 `🆔 شناسه سفارش: <code>${newOrder.id}</code>\n` +
                                 `💰 مبلغ کل: <b>${total.toLocaleString('fa-IR')}</b> تومان\n\n` +
                                 `اقلام سفارش:\n` +
                                 orderItems.map((item, idx) => `▫️ ${idx+1}. ${item.name} (تعداد: ${item.qty})`).join('\n') +
                                 `\n\nفیش پرداخت پیوست شده است. لطفاً از پنل مدیریت سفارش را تایید یا رد کنید.`;
                
                await telegramService.sendPhoto(token, dbChannelId, fileId, adminMsg);
            } catch (e) {
                console.error("Error forwarding receipt to DB channel:", e);
            }
        }

        broadcastLog(user.first_name, `Order placed: ${total} Toman`, 'system');
    };

    useEffect(() => {
        let active = true;
        
        const pollLoop = async () => {
            while (active) {
                await runBotCycle();
                await new Promise(r => setTimeout(r, 1000));
            }
        };
        
        pollLoop();
        
        return () => { 
            active = false;
        };
    }, []);

    return null;
};
