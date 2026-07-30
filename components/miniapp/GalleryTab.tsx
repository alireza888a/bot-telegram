import React from 'react';
import { Image as ImageIcon, RefreshCw, Loader2, AlertTriangle, Maximize2, X } from 'lucide-react';
import { GalleryImage } from '../../types';
import { getDisplayableImageUrl } from '../../utils/image';

export interface GalleryTabProps {
  galleryList: GalleryImage[];
  galleryLoading: boolean;
  galleryError: string | null;
  fetchGallery: () => void;
  lightboxImage: GalleryImage | null;
  setLightboxImage: (img: GalleryImage | null) => void;
}

export const GalleryTab: React.FC<GalleryTabProps> = ({
  galleryList,
  galleryLoading,
  galleryError,
  fetchGallery,
  lightboxImage,
  setLightboxImage
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ImageIcon size={18} className="text-purple-400" />
          <span>گالری تصاویر</span>
        </h2>
        <button 
          onClick={fetchGallery} 
          disabled={galleryLoading}
          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
        >
          <RefreshCw size={13} className={galleryLoading ? 'animate-spin' : ''} />
          <span>بروزرسانی</span>
        </button>
      </div>

      {galleryLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-3">
          <Loader2 size={32} className="text-purple-500 animate-spin" />
          <p className="text-xs text-slate-400">در حال دریافت تصاویر گالری...</p>
        </div>
      ) : galleryError ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-2">
          <AlertTriangle size={32} className="text-red-400 mx-auto" />
          <p className="text-xs text-red-300">{galleryError}</p>
        </div>
      ) : galleryList.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-3 my-8">
          <ImageIcon size={44} className="text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">تصویری یافت نشد</h3>
          <p className="text-xs text-slate-400">هنوز تصویری در گالری ثبت نشده است.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {galleryList.map((img) => (
            <div
              key={img.id}
              onClick={() => setLightboxImage(img)}
              className="bg-[#151c2c]/80 border border-white/10 hover:border-purple-500/50 rounded-2xl p-2 cursor-pointer transition-all hover:scale-[1.02] backdrop-blur-sm group"
            >
              <div className="w-full h-36 rounded-xl bg-black/40 overflow-hidden relative flex items-center justify-center">
                <img src={getDisplayableImageUrl(img.imageUrl) || img.imageUrl} alt={img.caption || 'عکس گالری'} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                <div className="absolute top-2 left-2 p-1.5 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                  <Maximize2 size={12} />
                </div>
              </div>
              {img.caption && (
                <p className="text-[11px] text-slate-300 mt-2 px-1 line-clamp-2 leading-relaxed">
                  {img.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal for Gallery */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between p-4 animate-fade-in">
          <button
            onClick={() => setLightboxImage(null)}
            className="self-end p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex-1 flex items-center justify-center max-w-full max-h-[75vh] my-auto">
            <img
              src={getDisplayableImageUrl(lightboxImage.imageUrl) || lightboxImage.imageUrl}
              alt={lightboxImage.caption || 'نمای کامل عکس'}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {lightboxImage.caption && (
            <div className="bg-[#151c2c]/90 border border-white/10 rounded-2xl p-4 text-center max-w-lg w-full mb-4">
              <p className="text-xs text-slate-200 leading-relaxed">{lightboxImage.caption}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
