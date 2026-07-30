import React from 'react';
import { ShoppingBag, X, Image as ImageIcon, Check } from 'lucide-react';
import { MenuPage, FormConfig } from '../../types';
import { getDisplayableImageUrl } from '../../utils/image';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  prodName: string;
  setProdName: (val: string) => void;
  prodPrice: number | '';
  setProdPrice: (val: number | '') => void;
  prodDesc: string;
  setProdDesc: (val: string) => void;
  prodCategory: string;
  setProdCategory: (val: string) => void;
  prodPostConfirmMenuId: string;
  setProdPostConfirmMenuId: (val: string) => void;
  prodPostOrderFormId: string;
  setProdPostOrderFormId: (val: string) => void;
  prodImages: string[];
  handleRemoveProdImage: (index: number) => void;
  prodFileInputRef: React.RefObject<HTMLInputElement>;
  handleProdImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProdUploading: boolean;
  prodManualUrl: string;
  setProdManualUrl: (val: string) => void;
  handleAddProdManualUrl: () => void;
  menus: Record<string, MenuPage>;
  forms: Record<string, FormConfig>;
}

export const NewProductModal: React.FC<NewProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prodName,
  setProdName,
  prodPrice,
  setProdPrice,
  prodDesc,
  setProdDesc,
  prodCategory,
  setProdCategory,
  prodPostConfirmMenuId,
  setProdPostConfirmMenuId,
  prodPostOrderFormId,
  setProdPostOrderFormId,
  prodImages,
  handleRemoveProdImage,
  prodFileInputRef,
  handleProdImageUpload,
  isProdUploading,
  prodManualUrl,
  setProdManualUrl,
  handleAddProdManualUrl,
  menus,
  forms,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-white/5 bg-[#0f172a]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingBag className="text-blue-500" size={20} />
            افزودن محصول جدید به فروشگاه
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">نام محصول <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={prodName}
              onChange={e => setProdName(e.target.value)}
              placeholder="مثال: اشتراک یک‌ماهه طلایی"
              required
              className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">قیمت (به تومان) <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={prodPrice}
              onChange={e => setProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="مثال: ۵۰۰۰۰"
              required
              className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors text-right"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">توضیحات محصول</label>
            <textarea
              value={prodDesc}
              onChange={e => setProdDesc(e.target.value)}
              placeholder="توضیحات مربوط به محصول..."
              rows={3}
              className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl p-4 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">دسته‌بندی (اختیاری)</label>
            <input
              type="text"
              value={prodCategory}
              onChange={e => setProdCategory(e.target.value)}
              placeholder="مثال: دیجیتال، فیزیکی، سرویس"
              className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">منوی بعد از تایید (اختیاری)</label>
            <select
              value={prodPostConfirmMenuId}
              onChange={e => setProdPostConfirmMenuId(e.target.value)}
              className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">پیش‌فرض سراسری (تنظیمات)</option>
              {Object.entries(menus).map(([id, menu]) => (
                <option key={id} value={id}>
                  {menu.title || menu.content || id} ({id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">فرم بعد از تایید (اختیاری)</label>
            <select
              value={prodPostOrderFormId}
              onChange={e => setProdPostOrderFormId(e.target.value)}
              className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">پیش‌فرض سراسری (تنظیمات)</option>
              {Object.entries(forms).map(([id, form]) => (
                <option key={id} value={id}>
                  {form.title || id} ({id})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              اگر اینجا چیزی انتخاب نکنید، همان تنظیم پیش‌فرضی که در صفحه تنظیمات گذاشته‌اید استفاده می‌شود. برای هر محصول می‌توانید جدا مشخص کنید.
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs text-slate-400">تصاویر محصول (آپلود تا ۱۰ عکس)</label>
              <span className="text-[10px] text-blue-400 font-medium">{prodImages.length} / ۱۰ عکس</span>
            </div>

            <div className="space-y-2">
              {/* Thumbnails Row */}
              {prodImages.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  {prodImages.map((img, idx) => (
                    <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-900 border border-white/10 shrink-0 group">
                      {getDisplayableImageUrl(img) ? (
                        <img src={getDisplayableImageUrl(img) || img} alt={`عکس ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-0.5 text-center bg-blue-500/10 text-blue-400 text-[8px] font-mono">
                          <ImageIcon size={12} />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveProdImage(idx)}
                        className="absolute top-0.5 right-0.5 bg-red-600/80 hover:bg-red-600 text-white p-0.5 rounded-full transition-all"
                        title="حذف"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={prodFileInputRef}
                  onChange={handleProdImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => prodFileInputRef.current?.click()}
                  disabled={isProdUploading || prodImages.length >= 10}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/20 transition-all text-xs font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProdUploading ? <span>⏳ در حال آپلود...</span> : <span>📤 آپلود عکس از گالری (چندتایی)</span>}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prodManualUrl}
                  onChange={e => setProdManualUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddProdManualUrl(); } }}
                  placeholder="یا آدرس عکس: https://..."
                  className="flex-1 bg-[#0f172a] border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 transition-colors text-right"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handleAddProdManualUrl}
                  disabled={!prodManualUrl.trim() || prodImages.length >= 10}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                >
                  افزودن
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
            >
              <Check size={16} />
              ذخیره و انتخاب برای دکمه
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
