import React from 'react';
import { ShoppingBag, Plus, Minus, AlertTriangle, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { ProductImageSlider } from './ProductImageSlider';

export interface ShopTabProps {
  loading: boolean;
  error: string | null;
  shopEnabled: boolean;
  products: Product[];
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  cartState: Record<string, number>;
  updateQty: (productId: string, delta: number) => void;
}

export const ShopTab: React.FC<ShopTabProps> = ({
  loading,
  error,
  shopEnabled,
  products,
  categories,
  selectedCategory,
  setSelectedCategory,
  cartState,
  updateQty
}) => {
  const filteredProducts = selectedCategory === 'همه'
    ? products
    : products.filter(p => ((p.category || '').trim() || 'عمومی') === selectedCategory);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-3">
        <Loader2 size={36} className="text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400">در حال دریافت کاتالوگ محصولات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-10 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
        <AlertTriangle size={36} className="text-red-400 mx-auto" />
        <h3 className="text-base font-bold text-red-300">خطا در بارگیری</h3>
        <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
      </div>
    );
  }

  if (!shopEnabled) {
    return (
      <div className="my-12 p-8 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl">
          🛑
        </div>
        <h2 className="text-lg font-bold text-amber-300">فروشگاه غیرفعال است</h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
          فروشگاه در حال حاضر غیرفعال است. جهت اطلاع از وضعیت با مدیریت ربات تماس بگیرید.
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="my-12 p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-3">
        <ShoppingBag size={40} className="text-slate-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-300">محصولی یافت نشد</h3>
        <p className="text-xs text-slate-400">هیچ محصولی در کاتالوگ فروشگاه قرار ندارد.</p>
      </div>
    );
  }

  return (
    <>
      {/* Categories filter tabs */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 custom-scrollbar no-scrollbar mb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border shrink-0 ${
                selectedCategory === cat
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filteredProducts.map((p) => {
          const qty = cartState[p.id] || 0;
          return (
            <div
              key={p.id}
              className={`bg-[#151c2c]/80 border rounded-2xl p-3.5 flex flex-col justify-between transition-all backdrop-blur-sm ${
                qty > 0
                  ? 'border-blue-500/50 ring-1 ring-blue-500/30 shadow-lg shadow-blue-600/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                {/* Product Image Slider */}
                <ProductImageSlider product={p} />

                {/* Title & Price */}
                <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{p.name}</h3>
                {p.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                    {p.description}
                  </p>
                )}
                <div className="text-xs font-black text-emerald-400 mb-3 dir-rtl">
                  {p.price.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-slate-400">تومان</span>
                </div>
              </div>

              {/* Quantity Control Buttons */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                {qty === 0 ? (
                  <button
                    onClick={() => updateQty(p.id, 1)}
                    className="w-full py-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 text-blue-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <Plus size={14} />
                    <span>افزودن به سبد</span>
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-between bg-blue-600/10 border border-blue-500/30 rounded-xl p-1">
                    <button
                      onClick={() => updateQty(p.id, -1)}
                      className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-black text-white px-2 font-mono">{qty}</span>
                    <button
                      onClick={() => updateQty(p.id, 1)}
                      className="w-8 h-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
