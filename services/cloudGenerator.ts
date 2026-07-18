/**
 * 🤖 Cloud Worker Code Generator Service
 * Generates an independent, fully dynamic Cloudflare Worker that integrates with Telegram
 * and synchronizes live state with the central database server.
 */

export const generateWorkerCode = (token: string, licenseCode: string): string => {
    return `/**
 * 🤖 این کد توسط پنل مدیریت شما تولید شده است.
 * راهنمای نصب:
 * ۱. این کد را کامل کپی کنید.
 * ۲. وارد Cloudflare Dashboard شوید → Workers & Pages → Create Worker.
 * ۳. روی Edit code بزنید، کد فعلی را پاک کنید، این کد را پیست کنید، Deploy بزنید.
 * ۴. اگر پیام زمانبندیشده استفاده میکنید: در تب Settings → Trigger Events → Add → Cron Trigger، زمان‌بندی کرون هر ۵ دقیقه (مثلاً با الگوی * / 5 * * * * بدون فاصله‌ها) را اضافه کنید.
 * ۵. آدرس Worker (چیزی شبیه https://xxx.workers.dev) را کپی کنید.
 * ۶. در سایت تلگرام یا با ارسال این آدرس به @BotFather webhook خود را تنظیم کنید — یا اگر پنل این کار را برایتان انجام میدهد، نیازی به این مرحله نیست.
 * بعد از این مراحل، ربات شما ۲۴ ساعته و مستقل از این پنل کار خواهد کرد.
 */

const TOKEN = "${token}";
const LICENSE_CODE = "${licenseCode}";
const CENTRAL_API_LOAD = "https://corepanel-api.tajikr450.workers.dev/api/data/load";
const CENTRAL_API_SAVE = "https://corepanel-api.tajikr450.workers.dev/api/data/save";

// In-memory user sessions for active form progress and photo receipt awaiting states
const userSessions = {};

// --- MAIN WORKER ENTRY POINT ---
export default {
  async fetch(request, env, ctx) {
    if (request.method === "POST") {
      try {
        const update = await request.json();
        
        // Load the live full state from the central database
        const state = await loadFromCentral();
        
        // Handle Telegram update and track modifications to the state
        const hasChanged = await handleUpdate(update, state);
        
        // Save the updated state back to the central database if any modifications occurred
        if (hasChanged) {
          await saveToCentral(state);
        }
      } catch (e) {
        console.error("Update error:", e);
      }
      return new Response("OK");
    }
    return new Response("Bot is running in dynamic Cloud Mode ☁️");
  },

  // --- CRON EVENT TRIGGER FOR SCHEDULED MESSAGES ---
  async scheduled(event, env, ctx) {
    try {
      const state = await loadFromCentral();
      const hasChanged = await processQueue(state);
      if (hasChanged) {
        await saveToCentral(state);
      }
    } catch (e) {
      console.error("Scheduled cron error:", e);
    }
  }
};

// --- CENTRAL DATABASE SYNCHRONIZATION ---

async function loadFromCentral() {
  const res = await fetch(CENTRAL_API_LOAD, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: LICENSE_CODE })
  });
  const json = await res.json();
  if (json.ok && json.data) {
    return json.data;
  }
  throw new Error("Could not load data from the central server.");
}

async function saveToCentral(state) {
  await fetch(CENTRAL_API_SAVE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: LICENSE_CODE, data: state })
  });
}

// --- TELEGRAM UPDATE DISPATCHER ---

async function handleUpdate(update, state) {
  const user = update.message?.from || update.callback_query?.from;
  const chatId = update.message?.chat.id || update.callback_query?.message?.chat.id;
  
  if (!user || !chatId) return false;

  let hasChanged = false;

  // Track and update audience user profile
  saveUserToAudience(user, state);
  hasChanged = true;

  const menus = state.data?.menus || {};
  const forms = state.data?.forms || {};
  const commands = state.data?.commands || [];
  const channels = state.data?.channels || [];
  const forceJoinEnabled = state.config?.force_join === 'true';

  // Ticket/Admin Response Handler
  if (update.message?.reply_to_message) {
      const reply = update.message.reply_to_message;
      const content = reply.text || reply.caption || '';
      const match = content.match(/#id_(\\d+)/);
      
      if (match) {
          const targetUserId = match[1];
          const replyText = update.message.text;
          
          if (replyText) {
              await sendMessage(targetUserId, "📬 <b>پاسخ ادمین:</b>\\n\\n" + replyText);
              await sendMessage(chatId, "✅ پاسخ شما برای کاربر " + targetUserId + " ارسال شد.");
              broadcastLog('Admin', "Replied to " + targetUserId, 'system', state);
              hasChanged = true;
          } else {
              await copyMessage(targetUserId, chatId, update.message.message_id, "📬 <b>پاسخ ادمین:</b>");
              await sendMessage(chatId, "✅ پیام شما برای کاربر " + targetUserId + " ارسال شد.");
          }
          return hasChanged;
      }
  }

  // Force Channel Membership Join Protection
  const isCheckJoinAction = update.callback_query?.data === 'check_join';
  if (forceJoinEnabled && !isCheckJoinAction) {
      const lockedChannels = channels.filter(c => c.isLocked);
      if (lockedChannels.length > 0) {
          let notJoined = [];
          for (const ch of lockedChannels) {
              try {
                  const res = await getChatMember(ch.id, user.id);
                  if (res.ok && res.result) {
                      const s = res.result.status;
                      if (s === 'left' || s === 'kicked' || s === 'restricted') notJoined.push(ch);
                  }
              } catch (e) {}
          }

          if (notJoined.length > 0) {
              const buttons = notJoined.map(ch => ([{ 
                  text: "عضویت در " + (ch.title || 'کانال'), 
                  url: "https://t.me/" + ch.username 
              }]));
              buttons.push([{ text: '✅ عضو شدم', callback_data: 'check_join' }]);
              const warningText = "⛔️ کاربر گرامی " + user.first_name + "،\\n\\nبرای استفاده از ربات لطفا ابتدا در کانال‌های زیر عضو شوید:";
              
              if (update.callback_query) {
                   await answerCallbackQuery(update.callback_query.id, 'لطفا ابتدا عضو شوید!');
                   await sendMessage(chatId, warningText, { inline_keyboard: buttons });
              } else {
                   await sendMessage(chatId, warningText, { inline_keyboard: buttons });
              }
              return hasChanged;
          }
      }
  }

  // Handle Button Callback Queries (Inline buttons click events)
  if (update.callback_query?.data) {
      const data = update.callback_query.data;
      const messageId = update.callback_query.message.message_id;
      const callbackId = update.callback_query.id;
      
      broadcastLog(user.first_name, "Button: " + data, 'incoming', state);
      hasChanged = true;

      // Reaction Likes/Dislikes Engine
      if (data === 'reaction_like' || data === 'reaction_dislike') {
          if (!state.data.votes) state.data.votes = {};
          const uniqueKey = chatId + "_" + messageId;
          let votes = state.data.votes[uniqueKey] || { likes: [], dislikes: [] };
          const userId = user.id;
          const isLike = data === 'reaction_like';

          if (isLike) {
              if (votes.likes.includes(userId)) {
                  votes.likes = votes.likes.filter(id => id !== userId);
              } else {
                  votes.likes.push(userId);
                  votes.dislikes = votes.dislikes.filter(id => id !== userId);
              }
          } else {
              if (votes.dislikes.includes(userId)) {
                  votes.dislikes = votes.dislikes.filter(id => id !== userId);
              } else {
                  votes.dislikes.push(userId);
                  votes.likes = votes.likes.filter(id => id !== userId);
              }
          }

          state.data.votes[uniqueKey] = votes;
          
          const currentKeyboard = update.callback_query.message.reply_markup;
          const newKeyboard = {
              inline_keyboard: currentKeyboard.inline_keyboard.map((row) => {
                  if (row.some(btn => btn.callback_data === 'reaction_like')) {
                      return [
                          { text: "👍 " + votes.likes.length, callback_data: 'reaction_like' },
                          { text: "👎 " + votes.dislikes.length, callback_data: 'reaction_dislike' }
                      ];
                  }
                  return row;
              })
          };

          await editMessageReplyMarkup(chatId, messageId, newKeyboard);
          await answerCallbackQuery(callbackId, 'رأی شما ثبت شد ✅');
          return true;
      }

      if (data === 'check_join') {
          const lockedChannels = channels.filter(c => c.isLocked);
          let stillNotJoined = false;
          for (const ch of lockedChannels) {
              const res = await getChatMember(ch.id, user.id);
              if (res.ok && res.result) {
                  const s = res.result.status;
                  if (s === 'left' || s === 'kicked' || s === 'restricted') stillNotJoined = true; 
              }
          }

          if (stillNotJoined) {
               await answerCallbackQuery(callbackId, 'هنوز عضو نشده‌اید! ❌');
          } else {
               await answerCallbackQuery(callbackId, 'عضویت تایید شد ✅');
               if (menus['root']) await sendMenu(chatId, menus['root'], user, state);
          }
          return hasChanged;
      }

      // Catalog Cart Add
      if (data.startsWith('cart_add_')) {
          const productId = data.replace('cart_add_', '');
          const changed = await handleCartAdd(chatId, user, productId, callbackId, state);
          if (changed) hasChanged = true;
          return hasChanged;
      }

      // Catalog View Cart
      if (data === 'cart_view') {
          await handleCartView(chatId, user, callbackId, state);
          return hasChanged;
      }

      // Catalog Clear Cart
      if (data === 'cart_clear') {
          const changed = await handleCartClear(chatId, user, callbackId, state);
          if (changed) hasChanged = true;
          return hasChanged;
      }

      // Catalog Checkout Initiation
      if (data === 'cart_checkout') {
          await handleCartCheckout(chatId, user, callbackId);
          return hasChanged;
      }

      // Show Shop Catalog Index
      if (data === 'cart_shop' || data === 'shop_categories') {
          await answerCallbackQuery(callbackId);
          await sendShopCatalog(chatId, user, state);
          return hasChanged;
      }

      // Show Specific Shop Category with Pagination
      if (data.startsWith('shop_cat_')) {
          const parts = data.split('_');
          const catIndex = parseInt(parts[2], 10);
          const page = parseInt(parts[3], 10);
          await answerCallbackQuery(callbackId);
          await sendCategoryProducts(chatId, user, catIndex, page, state);
          return hasChanged;
      }

      // Custom Menu Navigation
      if (menus[data]) {
          await sendMenu(chatId, menus[data], user, state);
          await answerCallbackQuery(callbackId);
          return hasChanged;
      }

      // Form Question Launching
      if (data.startsWith('form_') && forms[data]) {
          userSessions[user.id] = { formId: data, step: 0, answers: [] };
          await sendMessage(chatId, forms[data].questions[0].text);
          await answerCallbackQuery(callbackId);
          return hasChanged;
      }
      
      await answerCallbackQuery(callbackId);
      return hasChanged;
  }

  // Handle Text Commands and Text Input
  if (update.message) {
      const text = update.message.text;
      broadcastLog(user.first_name, text || '[رسانه/فایل]', 'incoming', state);
      hasChanged = true;

      // Cancel Active Wizard State
      if (text === '/cancel') {
          delete userSessions[user.id];
          await sendMessage(chatId, '🚫 عملیات لغو شد.');
          return hasChanged;
      }

      // Command Execution
      if (text && text.startsWith('/')) {
          const cmdName = text.substring(1).split(' ')[0].toLowerCase();
          
          if (cmdName === 'shop') {
              await sendShopCatalog(chatId, user, state);
              return hasChanged;
          }
          
          const matched = commands.find(c => c.command === cmdName);
          if (matched) {
              if (matched.actionType === 'text') {
                  await sendMessage(chatId, processMessageContent(matched.actionValue, user));
              } else if (matched.actionType === 'menu' && menus[matched.actionValue]) {
                  await sendMenu(chatId, menus[matched.actionValue], user, state);
              }
              return hasChanged;
          }
          
          if (cmdName === 'start' && menus['root']) {
              await sendMenu(chatId, menus['root'], user, state);
              return hasChanged;
          }
      }

      // Wizard Input Processors (Forms or Awaiting Payment Receipt photo upload)
      if (userSessions[user.id]) {
          const session = userSessions[user.id];
          
          if (session.type === 'awaiting_receipt') {
              if (update.message.photo) {
                  const changed = await handleReceiptPhoto(chatId, user, update.message.photo, state);
                  if (changed) hasChanged = true;
              } else {
                  await sendMessage(chatId, '⚠️ لطفا تصویر فیش پرداخت خود را به صورت عکس (Photo) ارسال کنید. در صورتی که تمایل به لغو سفارش دارید دستور /cancel را ارسال کنید.');
              }
              return hasChanged;
          }

          const form = forms[session.formId];
          if (form) {
              const question = form.questions[session.step];
              let answerValue = null;
              let fileId = null;

              if (question.type === 'text') {
                  if (update.message.text) answerValue = update.message.text;
                  else await sendMessage(chatId, 'لطفا متن ارسال کنید.');
              } else if (question.type === 'number') {
                  if (update.message.text && !isNaN(Number(update.message.text))) answerValue = update.message.text;
                  else await sendMessage(chatId, 'لطفا فقط عدد وارد کنید.');
              } else if (question.type === 'photo') {
                  if (update.message.photo) {
                      answerValue = '[تصویر]';
                      fileId = update.message.photo[update.message.photo.length - 1].file_id;
                  } else {
                      await sendMessage(chatId, 'لطفا یک عکس ارسال کنید.');
                  }
              } else if (question.type === 'document') {
                  if (update.message.document || update.message.video || update.message.audio) {
                      answerValue = '[فایل]';
                      fileId = update.message.document?.file_id || update.message.video?.file_id || update.message.audio?.file_id;
                  } else {
                      await sendMessage(chatId, 'لطفا فایل معتبر ارسال کنید.');
                  }
              }

              if (answerValue) {
                  session.answers.push({ q: question.text, a: answerValue, type: question.type, fileId, msgId: update.message.message_id });
                  session.step++;
                  
                  if (session.step < form.questions.length) {
                      await sendMessage(chatId, form.questions[session.step].text);
                  } else {
                      await sendMessage(chatId, '✅ اطلاعات ثبت شد. منتظر پاسخ ادمین باشید.');
                      if (form.adminId) {
                          const report = session.answers.map((x,i) => (i+1) + ". " + x.q + "\\n   " + x.a).join('\\n');
                          await sendMessage(form.adminId, "📝 <b>فرم جدید:</b>\\n👤 " + user.first_name + " (#id_" + user.id + ")\\n\\n" + report);
                          for (const ans of session.answers) {
                              if ((ans.type === 'photo' || ans.type === 'document') && ans.msgId) {
                                  await copyMessage(form.adminId, chatId, ans.msgId, "📎 فایل پیوست از: #id_" + user.id);
                              }
                          }
                      }
                      delete userSessions[user.id];
                  }
              }
          }
      }
  }

  return hasChanged;
}

// --- TELEGRAM RENDERERS & LAYOUT BUILDERS ---

async function sendMenu(chatId, menu, user, state) {
  const kb = {
    inline_keyboard: [
        ...(menu.rows || []).map(r => r.buttons.map(b => ({
            text: b.text,
            callback_data: b.type === 'link' ? undefined : (b.type==='submenu' ? (b.targetMenuId || 'root') : (b.type==='form' ? b.targetFormId : 'noop')),
            url: b.type === 'link' ? b.value : undefined
        }))),
        ...(menu.id !== 'root' ? [[{text: '🏠 منوی اصلی', callback_data: 'root'}, {text: '🔙 بازگشت', callback_data: menu.parentId || 'root'}]] : [])
    ]
  };
  
  let content = processMessageContent(menu.content, user);

  if (menu.media && menu.media.length > 0) {
       const m = menu.media[0];
       const file = m.fileId || m.url;
       if (m.type === 'image') await sendPhoto(chatId, file, content, kb);
       else if (m.type === 'video') await sendVideo(chatId, file, content, kb);
       else await sendMessage(chatId, content, kb);
  } else {
       await sendMessage(chatId, content, kb);
  }
}

async function sendShopCatalog(chatId, user, state) {
  const products = state.data?.products || [];
  const activeProducts = products.filter(p => p.active);
  const categories = Array.from(new Set(activeProducts.map(p => (p.category || '').trim() || 'عمومی'))).sort((a, b) => a.localeCompare(b, 'fa'));

  if (categories.length <= 1 && activeProducts.length <= 5) {
      let text = "🛍️ <b>محصولات فروشگاه:</b>\\n\\n";
      const buttons = [];
      for (const p of activeProducts) {
          text += "▫️ <b>" + p.name + "</b>\\n   قیمت: " + p.price.toLocaleString('fa-IR') + " تومان\\n   توضیحات: " + (p.description || 'ندارد') + "\\n\\n";
          buttons.push([{ text: "🛒 افزودن " + p.name + " به سبد", callback_data: "cart_add_" + p.id }]);
      }
      buttons.push([
          { text: "🧺 مشاهده سبد خرید", callback_data: "cart_view" },
          { text: "🗑️ خالی کردن سبد", callback_data: "cart_clear" }
      ]);
      await sendMessage(chatId, text, { inline_keyboard: buttons });
  } else {
      const text = "🛍️ <b>دسته‌بندی‌های فروشگاه:</b>\\n\\nلطفاً یک دسته انتخاب کنید:";
      const buttons = categories.map((cat, idx) => ([{
          text: cat,
          callback_data: "shop_cat_" + idx + "_0"
      }]));
      buttons.push([
          { text: "🧺 مشاهده سبد خرید", callback_data: "cart_view" },
          { text: "🗑️ خالی کردن سبد", callback_data: "cart_clear" }
      ]);
      await sendMessage(chatId, text, { inline_keyboard: buttons });
  }
}

async function sendCategoryProducts(chatId, user, catIndex, page, state) {
  const products = state.data?.products || [];
  const activeProducts = products.filter(p => p.active);
  const categories = Array.from(new Set(activeProducts.map(p => (p.category || '').trim() || 'عمومی'))).sort((a, b) => a.localeCompare(b, 'fa'));
  const targetCategory = categories[catIndex] || 'عمومی';

  const catProducts = activeProducts.filter(p => ((p.category || '').trim() || 'عمومی') === targetCategory);
  const offset = page * 5;
  const pageProducts = catProducts.slice(offset, offset + 5);

  let text = "📂 <b>دسته: " + targetCategory + "</b> (صفحه " + (page + 1) + ")\\n\\n";
  const buttons = [];

  for (const p of pageProducts) {
      text += "▫️ <b>" + p.name + "</b>\\n   قیمت: " + p.price.toLocaleString('fa-IR') + " تومان\\n   توضیحات: " + (p.description || 'ندارد') + "\\n\\n";
      buttons.push([{ text: "🛒 افزودن " + p.name + " به سبد", callback_data: "cart_add_" + p.id }]);
  }

  const paginationRow = [];
  if (page > 0) {
      paginationRow.push({ text: "◀️ صفحه قبل", callback_data: "shop_cat_" + catIndex + "_" + (page - 1) });
  }
  if (offset + 5 < catProducts.length) {
      paginationRow.push({ text: "▶️ صفحه بعد", callback_data: "shop_cat_" + catIndex + "_" + (page + 1) });
  }
  if (paginationRow.length > 0) {
      buttons.push(paginationRow);
  }

  buttons.push([{ text: "🔙 بازگشت به دسته‌ها", callback_data: "shop_categories" }]);
  buttons.push([
      { text: "🧺 مشاهده سبد خرید", callback_data: "cart_view" },
      { text: "🗑️ خالی کردن سبد", callback_data: "cart_clear" }
  ]);

  await sendMessage(chatId, text, { inline_keyboard: buttons });
}

// --- CATALOG SHOPPING ENGINE LOGIC ---

async function handleCartAdd(chatId, user, productId, callbackId, state) {
  const products = state.data?.products || [];
  const product = products.find(p => p.id === productId);
  if (!product) {
      await answerCallbackQuery(callbackId, "❌ محصول یافت نشد.");
      return false;
  }

  if (!state.data.carts) state.data.carts = {};
  const userIdStr = String(user.id);
  const userCart = state.data.carts[userIdStr] || [];
  const existingIndex = userCart.findIndex(item => item.productId === productId);

  if (existingIndex > -1) {
      userCart[existingIndex].qty += 1;
  } else {
      userCart.push({ productId, qty: 1 });
  }

  state.data.carts[userIdStr] = userCart;
  await answerCallbackQuery(callbackId, "🛒 " + product.name + " به سبد خرید اضافه شد!");
  return true;
}

async function handleCartView(chatId, user, callbackId, state) {
  const carts = state.data?.carts || {};
  const products = state.data?.products || [];
  const userIdStr = String(user.id);
  const userCart = carts[userIdStr] || [];

  if (callbackId) {
      await answerCallbackQuery(callbackId);
  }

  if (userCart.length === 0) {
      const msg = "🧺 <b>سبد خرید شما خالی است.</b>";
      const buttons = [[{ text: "🛍️ مشاهده محصولات فروشگاه", callback_data: "cart_shop" }]];
      await sendMessage(chatId, msg, { inline_keyboard: buttons });
      return;
  }

  let total = 0;
  let text = "🧺 <b>سبد خرید شما:</b>\\n\\n";

  for (const item of userCart) {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
          const subtotal = prod.price * item.qty;
          total += subtotal;
          text += "▪️ <b>" + prod.name + "</b>\\n   تعداد: " + item.qty + " × قیمت: " + prod.price.toLocaleString('fa-IR') + " = <code>" + subtotal.toLocaleString('fa-IR') + "</code> تومان\\n\\n";
      }
  }

  text += "🏁 <b>مبلغ کل قابل پرداخت:</b> <code>" + total.toLocaleString('fa-IR') + "</code> تومان\\n\\n";

  const cardNumber = state.config?.payment_card_number || 'تنظیم نشده';
  const cardOwner = state.config?.payment_card_owner || 'تنظیم نشده';

  text += "💳 <b>اطلاعات پرداخت کارت‌به‌کارت:</b>\\n";
  text += "شماره کارت: <code>" + cardNumber + "</code>\\n";
  text += "بنام صاحب حساب: <b>" + cardOwner + "</b>\\n\\n";
  text += "⚠️ لطفاً مبلغ فوق را به شماره کارت بالا واریز نموده، سپس دکمه <b>\"ثبت سفارش و ارسال فیش\"</b> را بزنید و عکس فیش واریزی خود را ارسال کنید.";

  const buttons = [
      [{ text: "🧾 ثبت سفارش و ارسال فیش پرداخت", callback_data: "cart_checkout" }],
      [
          { text: "🗑️ خالی کردن سبد", callback_data: "cart_clear" },
          { text: "🛍️ بازگشت به فروشگاه", callback_data: "cart_shop" }
      ]
  ];

  await sendMessage(chatId, text, { inline_keyboard: buttons });
}

async function handleCartClear(chatId, user, callbackId, state) {
  if (!state.data?.carts) state.data.carts = {};
  const userIdStr = String(user.id);
  delete state.data.carts[userIdStr];
  
  await answerCallbackQuery(callbackId, "🧹 سبد خرید شما خالی شد.");
  await sendMessage(chatId, "🧹 سبد خرید شما با موفقیت خالی شد.", {
      inline_keyboard: [[{ text: "🛍️ مشاهده محصولات فروشگاه", callback_data: "cart_shop" }]]
  });
  return true;
}

async function handleCartCheckout(chatId, user, callbackId) {
  userSessions[user.id] = { type: 'awaiting_receipt' };
  await answerCallbackQuery(callbackId);
  await sendMessage(chatId, "لطفاً تصویر (فوتو) فیش واریزی خود را ارسال کنید تا سفارش شما ثبت و توسط ادمین بررسی شود. 📸\\n\\nبرای لغو این عملیات دستور /cancel را بفرستید.");
}

async function handleReceiptPhoto(chatId, user, photoUpdate, state) {
  const carts = state.data?.carts || {};
  const products = state.data?.products || [];
  const userIdStr = String(user.id);
  const userCart = carts[userIdStr] || [];

  if (userCart.length === 0) {
      await sendMessage(chatId, "❌ سبد خرید شما خالی است. ابتدا محصولی به سبد خرید اضافه کنید.");
      delete userSessions[user.id];
      return false;
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
      await sendMessage(chatId, "❌ خطایی در ثبت سفارش رخ داد. محصولات سبد معتبر نیستند.");
      delete userSessions[user.id];
      return false;
  }

  const newOrder = {
      id: "order_" + Date.now() + "_" + user.id,
      userId: userIdStr,
      userFirstName: user.first_name || 'کاربر',
      items: orderItems,
      total: total,
      status: 'pending',
      createdAt: Date.now()
  };

  if (!state.data.orders) state.data.orders = [];
  state.data.orders.push(newOrder);

  // Clear cart
  delete state.data.carts[userIdStr];
  delete userSessions[user.id];

  await sendMessage(chatId, "رسید شما دریافت شد و سفارش ثبت گردید ⏳ پس از تایید توسط ادمین به شما اطلاع‌رسانی می‌شود.");

  const dbChannelId = state.config?.db_channel;
  if (dbChannelId) {
      try {
          const fileId = photoUpdate[photoUpdate.length - 1].file_id;
          const adminMsg = "🧾 <b>فیش سفارش جدید ثبت شد!</b>\\n" +
                           "👤 خریدار: " + user.first_name + " (#id_" + user.id + ")\\n" +
                           "🆔 شناسه سفارش: <code>" + newOrder.id + "</code>\\n" +
                           "💰 مبلغ کل: <b>" + total.toLocaleString('fa-IR') + "</b> تومان\\n\\n" +
                           "اقلام سفارش:\\n" +
                           orderItems.map((item, idx) => "▫️ " + (idx+1) + ". " + item.name + " (تعداد: " + item.qty + ")").join('\\n') +
                           "\\n\\nفیش پرداخت پیوست شده است. لطفاً از پنل مدیریت سفارش را تایید یا رد کنید.";
          
          await sendPhoto(dbChannelId, fileId, adminMsg);
      } catch (e) {
          console.error("Error forwarding receipt to DB channel:", e);
      }
  }

  broadcastLog(user.first_name, "Order placed: " + total + " Toman", 'system', state);
  return true;
}

// --- SCHEDULER & BROADCAST CRON TASK ENGINE ---

async function processQueue(state) {
  const now = Date.now();
  const queue = state.data?.queue || [];
  const pendingItems = queue.filter(q => q.status === 'pending' && q.createdAt <= now);

  if (pendingItems.length === 0) return false;

  let hasChanged = false;

  for (const item of pendingItems) {
      try {
          let targets = [];
          
          if (item.targetChannelId === 'all' || item.targetChannelId === 'BROADCAST_ALL') {
              const users = state.data?.users || [];
              targets = users.map(u => u.id);
          } else {
              targets = [item.targetChannelId];
          }

          if (targets.length === 0) {
              item.status = 'failed';
              hasChanged = true;
              continue;
          }

          let successCount = 0;
          
          let replyMarkup = undefined;
          let finalRows = [...(item.rows || [])];
          
          if (item.settings && item.settings.addReactions) {
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

          for (const targetId of targets) {
              await new Promise(r => setTimeout(r, 50)); 
              let ok = false;
              if (item.mediaFiles && item.mediaFiles.length > 0) {
                  if (item.mediaFiles.length > 1) {
                      const media = item.mediaFiles.map((m, i) => ({
                          type: m.type,
                          media: m.fileId || m.url,
                          caption: i === 0 ? item.content : '',
                          parse_mode: 'HTML'
                      }));
                      const res = await api('sendMediaGroup', { chat_id: targetId, media: media });
                      ok = !!res.ok;
                  } else {
                      const m = item.mediaFiles[0];
                      const file = m.fileId || m.url;
                      let res;
                      if (m.type === 'image') res = await sendPhoto(targetId, file, item.content, replyMarkup);
                      else if (m.type === 'video') res = await sendVideo(targetId, file, item.content, replyMarkup);
                      else res = await sendDocument(targetId, file, item.content, replyMarkup);
                      ok = !!res.ok;
                  }
              } else {
                  const res = await sendMessage(targetId, item.content, replyMarkup);
                  ok = !!res.ok;
                  if (ok && item.settings && item.settings.pin && item.targetChannelId !== 'all' && item.targetChannelId !== 'BROADCAST_ALL') {
                      await api('pinChatMessage', { chat_id: targetId, message_id: res.result.message_id, disable_notification: item.settings.silent });
                  }
              }
              if (ok) successCount++;
          }

          item.status = 'sent';
          broadcastLog('System', "Scheduled Task Executed: " + item.content.substring(0, 20) + "... to " + successCount + " targets.", 'system', state);
          hasChanged = true;

      } catch (e) {
          console.error("Queue item error:", e);
          item.status = 'failed';
          broadcastLog('System', "Scheduled Task Failed: " + item.id, 'system', state);
          hasChanged = true;
      }
  }

  return hasChanged;
}

// --- TELEGRAM BOT WEB API IMPLEMENTATION ---

async function api(method, body) {
  const url = "https://api.telegram.org/bot" + TOKEN + "/" + method;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return await res.json();
}

async function sendMessage(chatId, text, replyMarkup) {
  return await api('sendMessage', {
    chat_id: chatId,
    text: text,
    reply_markup: replyMarkup,
    parse_mode: 'HTML'
  });
}

async function sendPhoto(chatId, photo, caption, replyMarkup) {
  return await api('sendPhoto', {
    chat_id: chatId,
    photo: photo,
    caption: caption,
    reply_markup: replyMarkup,
    parse_mode: 'HTML'
  });
}

async function sendVideo(chatId, video, caption, replyMarkup) {
  return await api('sendVideo', {
    chat_id: chatId,
    video: video,
    caption: caption,
    reply_markup: replyMarkup,
    parse_mode: 'HTML'
  });
}

async function sendDocument(chatId, document, caption, replyMarkup) {
  return await api('sendDocument', {
    chat_id: chatId,
    document: document,
    caption: caption,
    reply_markup: replyMarkup,
    parse_mode: 'HTML'
  });
}

async function copyMessage(chatId, fromChatId, messageId, caption) {
  return await api('copyMessage', {
    chat_id: chatId,
    from_chat_id: fromChatId,
    message_id: messageId,
    caption: caption,
    parse_mode: 'HTML'
  });
}

async function editMessageReplyMarkup(chatId, messageId, replyMarkup) {
  return await api('editMessageReplyMarkup', {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: replyMarkup
  });
}

async function answerCallbackQuery(callbackQueryId, text) {
  return await api('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text: text
  });
}

async function getChatMember(chatId, userId) {
  return await api('getChatMember', {
    chat_id: chatId,
    user_id: userId
  });
}

// --- AUDIENCE & SYSTEM ACTIVITY LOGGERS ---

function saveUserToAudience(user, state) {
  if (!state.data) state.data = {};
  if (!state.data.users) state.data.users = [];
  const today = new Date().toISOString().split('T')[0];
  const userIdStr = String(user.id);
  const existing = state.data.users.find(u => String(u.id) === userIdStr);
  
  if (!existing) {
      state.data.users.push({ 
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
      existing.firstName = existing.firstName || existing.first_name || user.first_name || 'کاربر';
      existing.first_name = existing.firstName || existing.first_name || user.first_name || 'کاربر';
      existing.lastName = existing.lastName || existing.last_name || user.last_name || '';
      existing.last_name = existing.lastName || existing.last_name || user.last_name || '';
      existing.username = existing.username || user.username || '';
      existing.lastActive = today;
      existing.messagesCount = (existing.messagesCount || 0) + 1;
  }
}

function broadcastLog(user, text, type, state) {
  if (!state.data) state.data = {};
  if (!state.data.logs) state.data.logs = [];
  
  const formatter = new Intl.DateTimeFormat('fa-IR', {
      timeStyle: 'medium',
      timeZone: 'Asia/Tehran'
  });
  const timeStr = formatter.format(new Date());

  const newLog = { 
      id: Date.now(), 
      time: timeStr, 
      user: user, 
      text: text, 
      type: type 
  };
  state.data.logs = [...state.data.logs, newLog].slice(-50);
}

function processMessageContent(content, user) {
  if (!content) return '';
  const now = new Date();
  
  const formatterDate = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeZone: 'Asia/Tehran' });
  const formatterTime = new Intl.DateTimeFormat('fa-IR', { timeStyle: 'short', timeZone: 'Asia/Tehran' });
  const dateStr = formatterDate.format(now);
  const timeStr = formatterTime.format(now);

  return content
    .replace(/{first_name}|{نام}/g, user.first_name || 'کاربر')
    .replace(/{last_name}|{نام_خانوادگی}/g, user.last_name || '')
    .replace(/{username}|{یوزرنیم}/g, user.username ? '@' + user.username : 'ندارد')
    .replace(/{id}|{آیدی}/g, String(user.id))
    .replace(/{date}|{تاریخ}/g, dateStr)
    .replace(/{time}|{ساعت}/g, timeStr);
}
`;
};
