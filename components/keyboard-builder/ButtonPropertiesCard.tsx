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
  if (!selectedButton) return null;
  const currentBtn = getSelectedBtnObj();
  if (!currentBtn) return null;

  return (
    <GlassCard
      title={`تنظیمات دکمه: ${getButtonDisplayText(currentBtn)}`}
      action={
        <button onClick={removeButton} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
          <Trash2 size={12} /> حذف این دکمه
        </button>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm dark:text-white/60 text-slate-500 mb-2 block">متن دکمه</label>
          <input
            type="text"
            value={currentBtn.text}
            onChange={(e) => updateCurrentButton({ text: e.target.value })}
            className="w-full dark:bg-black/20 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-lg p-2 text-sm outline-none dark:text-white text-slate-800"
          />
        </div>

        <div>
          <label className="text-sm dark:text-white/60 text-slate-500 mb-2 block">نوع عملکرد</label>
          <select
            value={currentBtn.type}
            onChange={(e) => updateCurrentButton({ type: e.target.value as any })}
            className="w-full dark:bg-black/20 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-lg p-2 text-sm outline-none dark:text-white text-slate-800"
          >
            <option value="submenu">باز کردن زیرمنو (صفحه جدید)</option>
            <option value="url">لینک خارجی (وب‌سایت / کانال)</option>
            <option value="web_app">باز کردن وب‌اپ (Mini App)</option>
            <option value="product">خرید محصول مشخص (اتصال به فروشگاه)</option>
            <option value="form">تکمیل فرم / استعلام (ارسال به ادمین)</option>
            <option value="inquiry">درخواست کاتالوگ / استعلام قیمت (با فایل پیوست)</option>
            <option value="command">اجرای دستور آماده (تک‌کلیکی)</option>
            <option value="admin_chat">اتصال مستقیم به پشتیبان (چت)</option>
          </select>
        </div>

        {/* Submenu Config */}
        {currentBtn.type === 'submenu' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 space-y-2">
            <label className="text-xs text-blue-300 block font-medium">هدایت به منوی:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentBtn.targetMenuId || ''}
                onChange={(e) => updateCurrentButton({ targetMenuId: e.target.value })}
                placeholder="شناسه منو (مثلا: menu_123)"
                className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
              />
              <button
                onClick={() => navigateTo(currentBtn.targetMenuId || '')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                رفتن <CornerUpRight size={12} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400">اگر شناسه وجود نداشته باشد، صفحه جدیدی با این شناسه ساخته می‌شود.</p>
          </div>
        )}

        {/* URL Config */}
        {currentBtn.type === 'url' && (
          <div className="space-y-2">
            <label className="text-sm dark:text-white/60 text-slate-500 block">آدرس اینترنتی (URL)</label>
            <input
              type="text"
              value={currentBtn.url || ''}
              onChange={(e) => updateCurrentButton({ url: e.target.value })}
              placeholder="https://t.me/your_channel"
              className="w-full dark:bg-black/20 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-lg p-2 text-sm outline-none dark:text-white text-slate-800 text-left dir-ltr"
            />
          </div>
        )}

        {/* MiniApp Config */}
        {currentBtn.type === 'web_app' && (
          <div className="space-y-2">
            <label className="text-sm dark:text-white/60 text-slate-500 block">آدرس Mini App (تراست‌شده)</label>
            <input
              type="text"
              value={currentBtn.webAppUrl || ''}
              onChange={(e) => updateCurrentButton({ webAppUrl: e.target.value })}
              placeholder="https://your-domain.com/miniapp"
              className="w-full dark:bg-black/20 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-lg p-2 text-sm outline-none dark:text-white text-slate-800 text-left dir-ltr"
            />
          </div>
        )}

        {/* Form Config */}
        {currentBtn.type === 'form' && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 space-y-3">
            <div>
              <label className="text-xs text-purple-300 block font-medium mb-1">شناسه فرم مربوطه:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentBtn.formId || ''}
                  onChange={(e) => updateCurrentButton({ formId: e.target.value })}
                  placeholder="مثلا: form_contact"
                  className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                />
                <button
                  onClick={() => setEditingFormId(currentBtn.formId || 'form_' + Date.now())}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-3 text-xs rounded-lg transition-colors flex items-center gap-1 font-bold shrink-0"
                >
                  <ListChecks size={14} />
                  طراحی سوالات فرم
                </button>
              </div>
            </div>
            <p className="text-[10px] text-purple-200/60 leading-relaxed">
              * وقتی کاربر این دکمه را بزند، سوالات فرم به ترتیب از او پرسیده شده و پاسخ نهایی برای ادمین ارسال می‌شود.
            </p>
          </div>
        )}

        {/* Product Selection */}
        {currentBtn.type === 'product' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-emerald-300 font-medium flex items-center gap-1">
                  <ShoppingBag size={14} /> انتخاب محصول از فروشگاه:
                </label>
                <button
                  onClick={() => setIsNewProductModalOpen(true)}
                  className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                >
                  <Plus size={10} /> محصول جدید
                </button>
              </div>

              <select
                value={currentBtn.productId || ''}
                onChange={(e) => updateCurrentButton({ productId: e.target.value })}
                className="w-full bg-slate-900 border border-emerald-500/30 text-white rounded-lg p-2 text-xs outline-none focus:border-emerald-400"
              >
                <option value="">-- انتخاب کنید --</option>
                {getProducts().map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.price.toLocaleString('fa-IR')} تومان)
                  </option>
                ))}
              </select>
            </div>

            {currentBtn.productId && (() => {
              const selectedProd = getProducts().find(p => p.id === currentBtn.productId);
              if (!selectedProd) return null;
              return (
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between font-bold text-white">
                    <span>{selectedProd.name}</span>
                    <span className="text-emerald-400">{selectedProd.price.toLocaleString('fa-IR')} تومان</span>
                  </div>
                  {selectedProd.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2">{selectedProd.description}</p>
                  )}
                  {selectedProd.images && selectedProd.images.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                      {selectedProd.images.map((imgUrl, i) => (
                        <img
                          key={i}
                          src={getDisplayableImageUrl(imgUrl) || imgUrl}
                          alt="product thumbnail"
                          className="w-8 h-8 rounded border border-white/10 object-cover shrink-0"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <p className="text-[10px] text-emerald-300/60 leading-relaxed">
              * کلیک روی این دکمه، فرآیند خرید این محصول (شامل نمایش تصاویر، توضیحات، دکمه پرداخت و...) را در تلگرام شروع می‌کند.
            </p>
          </div>
        )}

        {/* Inquiry / Catalog Config */}
        {currentBtn.type === 'inquiry' && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-3">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>📄</span> تنظیمات استعلام قیمت و کاتالوگ
            </h4>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1">متن توضیحات / پیام استعلام:</label>
              <textarea
                value={currentBtn.inquiryConfig?.caption || ''}
                onChange={(e) => updateInquiryConfig({ caption: e.target.value })}
                placeholder="مثلاً: برای دریافت کاتالوگ محصولات فوق، دکمه زیر را فشار دهید یا درخواست خود را ارسال کنید."
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white outline-none resize-none h-16"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1">فایل پیوست کاتالوگ (PDF / عکس):</label>
              {currentBtn.inquiryConfig?.fileUrl ? (
                <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg border border-white/10 text-xs">
                  <span className="text-emerald-400 truncate dir-ltr max-w-[200px]">{currentBtn.inquiryConfig.fileUrl}</span>
                  <button
                    onClick={() => updateInquiryConfig({ fileUrl: undefined })}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-2 bg-black/20 border border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5 transition-colors text-xs text-slate-400">
                  <Upload size={14} />
                  <span>{isUploading ? 'در حال آپلود...' : 'انتخاب فایل کاتالوگ (PDF / عکس)'}</span>
                  <input type="file" onChange={handleCatalogUpload} className="hidden" />
                </label>
              )}
            </div>

            <div className="pt-2 border-t border-white/5 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!currentBtn.inquiryConfig?.requirePhone}
                  onChange={(e) => updateInquiryConfig({ requirePhone: e.target.checked })}
                  className="rounded bg-slate-800 border-white/20 text-amber-500"
                />
                <span>دریافت خودکار شماره تماس کاربر قبل از ارسال کاتالوگ</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!currentBtn.inquiryConfig?.notifyAdmin}
                  onChange={(e) => updateInquiryConfig({ notifyAdmin: e.target.checked })}
                  className="rounded bg-slate-800 border-white/20 text-amber-500"
                />
                <span>اطلاع‌رسانی سریع به ادمین (ارسال هشدار استعلام)</span>
              </label>
            </div>
          </div>
        )}

        {/* Command Exec Config */}
        {currentBtn.type === 'command' && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 space-y-2">
            <label className="text-xs text-purple-300 block font-medium">دستور تلگرامی (با / شروع شود):</label>
            <input
              type="text"
              value={currentBtn.commandText || ''}
              onChange={(e) => updateCurrentButton({ commandText: e.target.value })}
              placeholder="مثلا: /start یا /help یا /my_orders"
              className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white outline-none dir-ltr text-left font-mono"
            />
            <p className="text-[10px] text-slate-400">با کلیک روی دکمه، این دستور به عنوان پیام از طرف کاربر به ربات ارسال می‌شود.</p>
          </div>
        )}

        {/* Admin Chat Config */}
        {currentBtn.type === 'admin_chat' && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-2">
            <label className="text-xs text-amber-300 block font-medium">پیام راهنما قبل از شروع چت:</label>
            <textarea
              value={currentBtn.adminChatIntro || ''}
              onChange={(e) => updateCurrentButton({ adminChatIntro: e.target.value })}
              placeholder="مثلاً: پیام خود را بنویسید، کارشناسان ما به زودی پاسخ خواهند داد..."
              className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white outline-none resize-none h-16"
            />
            <p className="text-[10px] text-slate-400">پس از کلیک، حالت گفتگوی دوطرفه کاربر با ادمین ربات فعال می‌شود.</p>
          </div>
        )}

        {/* VIP Lock Checkbox */}
        <div className="pt-3 border-t border-white/10">
          <label className="flex items-center gap-2 text-xs text-amber-400 cursor-pointer bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/20">
            <input
              type="checkbox"
              checked={!!currentBtn.isVipOnly}
              onChange={(e) => updateCurrentButton({ isVipOnly: e.target.checked })}
              className="rounded bg-slate-800 border-amber-500/30 text-amber-500 focus:ring-amber-500"
            />
            <span className="font-bold">قفل اختصاصی: فقط اعضای VIP (اشتراک ویژه) کلیک کنند</span>
          </label>
        </div>
      </div>
    </GlassCard>
  );
};
