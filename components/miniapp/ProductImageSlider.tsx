import React, { useState } from 'react';
import { ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { Product } from '../../types';
import { getDisplayableImageUrl } from '../../utils/image';

export const ProductImageSlider: React.FC<{ product: Product }> = ({ product }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  const images = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls.filter(u => u && u.trim() !== '')
    : (product.imageUrl && product.imageUrl.trim() !== '' ? [product.imageUrl] : []);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] rounded-xl bg-black/40 border border-white/5 overflow-hidden flex flex-col items-center justify-center text-slate-500 gap-1.5 relative mb-3">
        <ShoppingBag size={28} className="text-blue-400/60" />
        <span className="text-[10px] text-slate-500">بدون تصویر</span>
        {product.category && (
          <span className="absolute top-2 right-2 bg-black/60 border border-white/10 px-2 py-0.5 rounded-md text-[10px] text-slate-300 backdrop-blur-md">
            {product.category}
          </span>
        )}
      </div>
    );
  }

  if (images.length === 1) {
    const img = images[0];
    const displayUrl = getDisplayableImageUrl(img);
    return (
      <div className="w-full aspect-[4/3] rounded-xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center relative mb-3">
        {displayUrl ? (
          <img src={displayUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center p-2 text-center text-blue-400 gap-1">
            <ImageIcon size={22} />
            <span className="text-[9px] line-clamp-1">{img}</span>
          </div>
        )}
        {product.category && (
          <span className="absolute top-2 right-2 bg-black/60 border border-white/10 px-2 py-0.5 rounded-md text-[10px] text-slate-300 backdrop-blur-md">
            {product.category}
          </span>
        )}
      </div>
    );
  }

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % images.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const currentImg = images[activeIdx] || images[0];
  const displayUrl = getDisplayableImageUrl(currentImg);

  return (
    <div className="w-full aspect-[4/3] rounded-xl bg-black/40 border border-white/5 overflow-hidden relative mb-3 group">
      {displayUrl ? (
        <img src={displayUrl} alt={`${product.name} - ${activeIdx + 1}`} className="w-full h-full object-cover transition-all duration-300" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-blue-400 gap-1">
          <ImageIcon size={22} />
          <span className="text-[9px] line-clamp-1">{currentImg}</span>
        </div>
      )}

      {product.category && (
        <span className="absolute top-2 right-2 bg-black/60 border border-white/10 px-2 py-0.5 rounded-md text-[10px] text-slate-300 backdrop-blur-md z-10">
          {product.category}
        </span>
      )}

      <button
        type="button"
        onClick={prevSlide}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-80 hover:opacity-100 transition-all z-10"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={nextSlide}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-80 hover:opacity-100 transition-all z-10"
      >
        ›
      </button>

      <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1 z-10 pointer-events-none">
        {images.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIdx(idx);
            }}
            className={`h-1.5 rounded-full transition-all pointer-events-auto ${
              idx === activeIdx ? 'bg-blue-400 w-3.5' : 'bg-white/40 w-1.5'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
