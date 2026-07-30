import React from 'react';
import { GlassCard } from '../GlassCard';
import {
  Trash2, CornerUpRight, ListChecks, ShoppingBag, Plus, Check,
  Upload, Cloud, Zap, Globe, Terminal, Link as LinkIcon
} from 'lucide-react';
import { InlineButton, Product, InquiryConfig } from '../../types';
import { getDisplayableImageUrl } from '../../utils/image';

interface ButtonPropertiesCardProps {
  selectedButton: { rowId: string; btnId: string } | null;
  getSelectedBtnObj: () => InlineButton | null | undefined;
  removeButton: () => void;
  getButtonDisplayText: (btn: InlineButton) => string;
  updateCurrentButton: (updates: Partial<InlineButton>) => void;
  navigateTo: (menuId: string) => void;
  setEditingFormId: (id: string | null) => void;
  setIsNewProductModalOpen: (open: boolean) => void;
  getProducts: () => Product[];
  updateInquiryConfig: (updates: Partial<InquiryConfig>) => void;
  isUploading: boolean;
  handleCatalogUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ButtonPropertiesCard: React.FC<ButtonPropertiesCardProps> = ({
  selectedButton,
  getSelectedBtnObj,
  removeButton,
  getButtonDisplayText,
  updateCurrentButton,
  navigateTo,
  setEditingFormId,
  setIsNewProductModalOpen,
  getProducts,
  updateInquiryConfig,
  isUploading,
  handleCatalogUpload,
}) => {
  if (!selectedButton || !getSelectedBtnObj()) return null;

  return (
    <GlassCard
      title="ویژگی‌های دکمه"
      className="animate-slide-up border-blue-500/30"
      action={
        <button
          onClick={removeButton}
          className="flex items-center gap-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Trash2 size={14}/> حذف دکمه
        </button>
      }
    >
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2">
             <label className="text-xs dark:text-white/50 text-slate-500 mb-1 block">عنوان دکمه</label>
             {getSelectedBtnObj()!.type === 'product' ? (
                <div>
                   <input
                      type="text"
                      disabled
                      value={getButtonDisplayText(getSelectedBtnObj()!)}
                      className="w-full dark:bg-white/5 bg-slate-200 border dark:border-white/10 border-slate-300 px-3 py-2 rounded-lg text-sm dark:text-slate-300 text-slate-600 font-medium cursor-not-allowed"
                   />
                   <p className="text-[11px] text-blue-400/90 mt-1 flex items-center gap-1">
                      <span>💡</span>
                      <span>این متن خودکار و همیشه براساس قیمت واقعی محصول بهروزه — نیازی به ویرایش نداره.</span>
                   </p>
                </div>
             ) : (
                <input
                   type="text"
                   value={getSelectedBtnObj()!.text}
                   onChange={(e) => updateCurrentButton({ text: e.target.value })}
                   className="w-full bg-transparent border-b border-white/20 focus:border-blue-500 px-2 py-1 outline-none dark:text-white text-slate-800"
                />
             )}
          </div>

          <div>
             <label className="text-xs dark:text-white/50 text-slate-500 mb-1 block">نوع عملکرد</label>
             <select
                value={
                  getSelectedBtnObj()!.type === 'callback' && getSelectedBtnObj()!.value === 'support'
                    ? 'ticket'
                    : getSelectedBtnObj()!.type
                }
                onChange={(e) => {
                  const newType = e.target.value as any;
                  if (newType === 'ticket') {
                    updateCurrentButton({
                      type: 'callback',
                      value: 'support',
                      text: getSelectedBtnObj()!.text && getSelectedBtnObj()!.text !== 'دکمه جدید' ? getSelectedBtnObj()!.text : '🎫 تیکت پشتیبانی',
                      productId: undefined,
                      apiUrl: undefined,
                      webAppUrl: undefined
                    });
                  } else if (newType === 'webapp') {
                    const licenseCacheStr = localStorage.getItem('license_cache') || '{}';
                    let code = '';
                    try { code = JSON.parse(licenseCacheStr).code || ''; } catch {}
                    const webAppUrl = `${window.location.origin}/miniapp?code=${encodeURIComponent(code)}`;
                    updateCurrentButton({
                      type: 'webapp',
                      webAppUrl: webAppUrl,
                      value: webAppUrl,
                      text: getSelectedBtnObj()!.text && getSelectedBtnObj()!.text !== 'دکمه جدید' ? getSelectedBtnObj()!.text : '🛍 ورود به فروشگاه',
                      productId: undefined,
                      apiUrl: undefined
                    });
                  } else if (newType === 'api') {
                    updateCurrentButton({
                      type: 'api',
                      apiUrl: getSelectedBtnObj()!.apiUrl || '',
                      text: getSelectedBtnObj()!.text && getSelectedBtnObj()!.text !== 'دکمه جدید' ? getSelectedBtnObj()!.text : '🔗 فراخوانی API',
                      productId: undefined,
                      webAppUrl: undefined
                    });
                  } else if (newType === 'product') {
                    const products = getProducts();
                    const firstProd = products[0];
                    if (firstProd) {
                      updateCurrentButton({
                        type: 'product',
                        productId: firstProd.id,
                        text: `🛒 ${firstProd.name} — ${firstProd.price.toLocaleString('fa-IR')} تومان`,
                        apiUrl: undefined,
                        webAppUrl: undefined
                      });
                    } else {
                      updateCurrentButton({
                        type: 'product',
                        text: '🛒 انتخاب محصول...',
                        apiUrl: undefined,
                        webAppUrl: undefined
                      });
                    }
                  } else {
                    const curVal = getSelectedBtnObj()!.value === 'support' ? '' : getSelectedBtnObj()!.value;
                    updateCurrentButton({ type: newType, value: curVal, productId: undefined, apiUrl: undefined, webAppUrl: undefined });
                  }
                }}
                className="w-full dark:bg-black/20 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-lg p-2 text-sm outline-none dark:text-white text-slate-800"
             >
                <option value="callback">نمایش پیام ساده (Callback)</option>
                <option value="submenu">زیر منو (دکمه‌های تو در تو)</option>
                <option value="webapp">🛍 باز کردن فروشگاه (Mini App)</option>
                <option value="product">🛒 محصول فروشگاهی</option>
                <option value="ticket">🎫 تیکت پشتیبانی</option>
                <option value="api">🔗 فراخوانی API/Webhook</option>
                <option value="link">لینک وب‌سایت (Url)</option>
                <option value="form">فرم دریافت اطلاعات</option>
                <option value="inquiry">📞 استعلام و خرید (ارسال کاتالوگ)</option>
                <option value="command">اجرای دستور (Command)</option>
             </select>
          </div>

          <div>
             <label className="text-xs dark:text-white/50 text-slate-500 mb-1 block">رنگ دکمه (ویژه تلگرام جدید 🎨)</label>
             <select
                value={getSelectedBtnObj()!.color || 'default'}
                onChange={(e) => updateCurrentButton({ color: e.target.value as any })}
                className="w-full dark:bg-black/20 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-lg p-2 text-sm outline-none dark:text-white text-slate-800"
             >
                <option value="default">شیشه‌ای پیش‌فرض (تاریک/آبی)</option>
                <option value="blue">🔵 آبی اقیانوسی (روشن)</option>
                <option value="green">🟢 سبز زمردی (پذیرش/موفقیت)</option>
                <option value="red">🔴 قرمز یاقوتی (لغو/هشدار)</option>
                <option value="gold">🟡 طلایی ستاره‌ای (پرایم/ستاره تلگرام)</option>
                <option value="orange">🟠 نارنجی پرانرژی (خرید/لینک ویژه)</option>
             </select>
             <p className="text-[10px] text-amber-500/90 mt-1 leading-relaxed">
                ⚠️ رنگ‌های طلایی و نارنجی فقط در پیش‌نمایش پنل دیده می‌شوند؛ تلگرام به صورت واقعی فقط آبی، سبز و قرمز را پشتیبانی می‌کند.
             </p>
          </div>

          <div>
             {getSelectedBtnObj()!.type === 'submenu' ? (
                <div className="mt-5">
                   <button
                      onClick={() => {
                         if (getSelectedBtnObj()!.targetMenuId) {
                            navigateTo(getSelectedBtnObj()!.targetMenuId!);
                         }
                      }}
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white p-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                   >
                      <CornerUpRight size={16} />
                      ویرایش محتوای زیر منو
                   </button>
                </div>
             ) : getSelectedBtnObj()!.type === 'form' ? (
                 <div className="mt-5">
                     <button
                         onClick={() => setEditingFormId(getSelectedBtnObj()!.value || '')}
                         className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                     >
                         <ListChecks size={16} />
                         📝 طراحی سوالات فرم
                     </button>
                     <p className="text-[10px] text-slate-500 mt-2 text-center">شناسه فرم: {getSelectedBtnObj()!.value}</p>
                 </div>
             ) : getSelectedBtnObj()!.type === 'product' ? (
                 <div className="mt-2 space-y-3 col-span-1 md:col-span-2 bg-white/5 p-4 rounded-xl border border-white/10">
                     <div className="flex items-center justify-between">
                         <label className="text-xs font-bold text-white flex items-center gap-1.5">
                             <ShoppingBag size={15} className="text-blue-400" />
                             انتخاب محصول مرتبط با این دکمه
                         </label>
                         <button
                             type="button"
                             onClick={() => setIsNewProductModalOpen(true)}
                             className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all font-medium"
                         >
                             <Plus size={14} />
                             افزودن محصول جدید
                         </button>
                     </div>

                     <div className="max-h-56 overflow-y-auto space-y-2 custom-scrollbar pr-1 pt-1">
                         {getProducts().length === 0 ? (
                             <div className="bg-black/20 border border-dashed border-white/10 rounded-xl p-4 text-center space-y-2">
                                 <p className="text-xs text-slate-400">هیچ محصولی هنوز ثبت نشده است.</p>
                                 <button
                                     type="button"
                                     onClick={() => setIsNewProductModalOpen(true)}
                                     className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"
                                 >
                                     + ساخت اولین محصول
                                 </button>
                             </div>
                         ) : (
                             getProducts().map((prod) => {
                                 const isSelected = getSelectedBtnObj()!.productId === prod.id;
                                 return (
                                     <div
                                         key={prod.id}
                                         onClick={() => {
                                             updateCurrentButton({
                                                 productId: prod.id,
                                                 text: `🛒 ${prod.name} — ${prod.price.toLocaleString('fa-IR')} تومان`
                                             });
                                         }}
                                         className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                             isSelected
                                                 ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                                                 : 'bg-black/20 border-white/5 hover:bg-white/10 text-slate-300'
                                         }`}
                                     >
                                         <div className="flex items-center gap-3">
                                             <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                 {getDisplayableImageUrl(prod.imageUrl) ? (
                                                     <img src={getDisplayableImageUrl(prod.imageUrl)!} alt={prod.name} className="w-full h-full object-cover" />
                                                 ) : (
                                                     <ShoppingBag size={18} className="text-blue-400" />
                                                 )}
                                             </div>
                                             <div>
                                                 <h5 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h5>
                                                 <p className="text-[10px] text-blue-400 font-medium mt-0.5">
                                                     {prod.price.toLocaleString('fa-IR')} تومان
                                                     {prod.category && <span className="text-slate-400 mr-2">({prod.category})</span>}
                                                 </p>
                                             </div>
                                         </div>
                                         {isSelected && (
                                             <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                                                 <Check size={12} />
                                             </div>
                                         )}
                                     </div>
                                 );
                             })
                         )}
                     </div>
                 </div>
             ) : getSelectedBtnObj()!.type === 'inquiry' ? (
                 <div className="mt-2 space-y-3 bg-white/5 p-3 rounded-xl border border-white/5 col-span-2 md:col-span-2">
                     <div>
                         <label className="text-xs text-slate-400 mb-1 block">آیدی ادمین فروش (جهت دریافت لید)</label>
                         <input
                             value={getSelectedBtnObj()!.inquiryConfig?.adminId || ''}
                             onChange={e => updateInquiryConfig({ adminId: e.target.value })}
                             className="w-full bg-black/20 border border-white/10 rounded p-2 text-xs text-white dir-ltr"
                             placeholder="123456789"
                         />
                     </div>
                     <div>
                         <label className="text-xs text-slate-400 mb-1 block">فایل کاتالوگ (PDF یا عکس)</label>
                         <div className="flex gap-2 items-center">
                             <label className="flex-1 cursor-pointer bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded p-2 text-xs flex items-center justify-center gap-2 transition-colors">
                                 {isUploading ? <Cloud className="animate-bounce" size={14}/> : <Upload size={14}/>}
                                 {isUploading ? 'در حال آپلود...' : 'آپلود کاتالوگ در دیتابیس'}
                                 <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleCatalogUpload} disabled={isUploading} />
                             </label>
                             {getSelectedBtnObj()!.inquiryConfig?.catalogFileId && (
                                 <div className="text-xs text-green-400 flex items-center gap-1">
                                     <Check size={14}/> فایل ذخیره شد
                                 </div>
                             )}
                         </div>
                     </div>
                     <div>
                         <label className="text-xs text-slate-400 mb-1 block">متن پاسخ خودکار به مشتری</label>
                         <textarea
                             value={getSelectedBtnObj()!.inquiryConfig?.responseText || ''}
                             onChange={e => updateInquiryConfig({ responseText: e.target.value })}
                             className="w-full h-20 bg-black/20 border border-white/10 rounded p-2 text-xs text-white resize-none"
                         />
                     </div>
                 </div>
             ) : getSelectedBtnObj()!.type === 'webapp' ? (
                 <div className="mt-2 space-y-2 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl col-span-1 md:col-span-2">
                     <label className="text-xs text-emerald-300 font-bold block flex items-center gap-1.5">
                         <ShoppingBag size={15} />
                         آدرس فروشگاه تلگرام (Mini App)
                     </label>
                     <input
                         type="text"
                         readOnly
                         value={getSelectedBtnObj()!.webAppUrl || `${window.location.origin}/miniapp`}
                         className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-emerald-200 text-left dir-ltr outline-none cursor-text font-mono"
                         dir="ltr"
                     />
                     <p className="text-[11px] text-slate-300 leading-relaxed">
                         این دکمه فروشگاه رو مستقیم داخل تلگرام (نه مرورگر) باز میکنه.
                     </p>
                 </div>
             ) : getSelectedBtnObj()!.type === 'api' ? (
                 <div className="mt-2 space-y-2 bg-white/5 p-3 rounded-xl border border-white/10 col-span-1 md:col-span-2">
                     <label className="text-xs text-slate-300 font-medium block">آدرس API / Webhook (URL)</label>
                     <input
                         type="text"
                         value={getSelectedBtnObj()!.apiUrl || ''}
                         onChange={e => updateCurrentButton({ apiUrl: e.target.value })}
                         placeholder="https://api.example.com/webhook"
                         className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white text-left dir-ltr outline-none focus:border-blue-500"
                         dir="ltr"
                     />
                     <p className="text-[10px] text-slate-400 leading-relaxed">
                         با کلیک روی این دکمه توسط کاربر، یک درخواست POST به این آدرس ارسال می‌گردد.
                     </p>
                 </div>
             ) : (getSelectedBtnObj()!.type === 'ticket' || (getSelectedBtnObj()!.type === 'callback' && getSelectedBtnObj()!.value === 'support')) ? (
                 <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl col-span-1 md:col-span-2 text-xs text-blue-300 space-y-1">
                     <p className="font-bold flex items-center gap-1.5">
                         <span>🎫</span>
                         تیکت پشتیبانی ربات
                     </p>
                     <p className="text-slate-300 text-[11px] leading-relaxed">
                         با کلیک کاربر روی این دکمه، جریان ثبت تیکت پشتیبانی (/support) مستقیماً برای وی شروع می‌شود.
                     </p>
                 </div>
             ) : (
               <>
                  <label className="text-xs dark:text-white/50 text-slate-500 mb-1 block flex items-center gap-1">
                      {getSelectedBtnObj()!.type === 'link' && <><Globe size={12}/> آدرس اینترنتی (https)</>}
                      {getSelectedBtnObj()!.type === 'command' && <><Terminal size={12}/> نام دستور (بدون اسلش)</>}
                      {getSelectedBtnObj()!.type === 'callback' && 'مقدار دکمه (Callback Data)'}
                  </label>
                  <div className="relative">
                      <input
                          type="text"
                          value={getSelectedBtnObj()!.value || ''}
                          onChange={(e) => updateCurrentButton({ value: e.target.value })}
                          placeholder={
                              getSelectedBtnObj()!.type === 'link' ? 'https://google.com' :
                              getSelectedBtnObj()!.type === 'command' ? 'start' : 'data_123'
                          }
                          className="w-full dark:bg-black/20 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-lg p-2 pl-8 text-sm outline-none dark:text-white text-slate-800 text-left dir-ltr"
                          dir="ltr"
                      />
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50">
                          {getSelectedBtnObj()!.type === 'link' && <LinkIcon size={14}/>}
                          {getSelectedBtnObj()!.type === 'command' && <span className="text-xs font-mono">/</span>}
                      </div>
                  </div>
               </>
             )}
          </div>

          {/* Button Condition Section */}
          <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-white/10 space-y-3">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Zap size={14} />
                  شرط نمایش دکمه (اختیاری)
              </label>
              <select
                  value={getSelectedBtnObj()!.condition?.type || 'none'}
                  onChange={(e) => {
                      const condType = e.target.value as 'none' | 'order_status_confirmed' | 'product_category';
                      if (condType === 'product_category') {
                          updateCurrentButton({
                              condition: {
                                  type: 'product_category',
                                  value: getSelectedBtnObj()!.condition?.value || ''
                              }
                          });
                      } else {
                          updateCurrentButton({
                              condition: { type: condType }
                          });
                      }
                  }}
                  className="w-full dark:bg-black/20 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-lg p-2 text-sm outline-none dark:text-white text-slate-800"
              >
                  <option value="none">همیشه نمایش بده (پیش‌فرض)</option>
                  <option value="order_status_confirmed">فقط اگه سفارش تایید شده باشد</option>
                  <option value="product_category">فقط برای دسته‌بندی محصول خاص</option>
              </select>

              {getSelectedBtnObj()!.condition?.type === 'order_status_confirmed' && (
                  <p className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl leading-relaxed">
                      💡 این فقط توی پیام‌های بعد از تایید سفارش اثر داره؛ توی منوهای عادی نادیده گرفته می‌شود.
                  </p>
              )}

              {getSelectedBtnObj()!.condition?.type === 'product_category' && (
                  <div className="space-y-2 pt-1">
                      <input
                          type="text"
                          value={getSelectedBtnObj()!.condition?.value || ''}
                          onChange={(e) => {
                              updateCurrentButton({
                                  condition: {
                                      type: 'product_category',
                                      value: e.target.value
                                  }
                              });
                          }}
                          placeholder="نام دسته‌بندی محصول (مثلاً: دیجیتال)"
                          className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500"
                      />
                      <p className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl leading-relaxed">
                          💡 فقط وقتی این دکمه بخشی از پیام بعد از تایید یه محصول با همین دسته‌بندی باشه نمایش داده میشه.
                      </p>
                  </div>
              )}
          </div>
       </div>
    </GlassCard>
  );
};
