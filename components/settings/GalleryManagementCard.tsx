import React from 'react';
import { GlassCard } from '../GlassCard';
import { Image as ImageIcon, Plus, Trash2, Loader2 } from 'lucide-react';
import { GalleryImage } from '../../types';
import { getDisplayableImageUrl } from '../../utils/image';

interface GalleryManagementCardProps {
  galleryImages: GalleryImage[];
  isUploadingGallery: boolean;
  handleAddGalleryImage: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleUpdateGalleryCaption: (id: string, caption: string) => void;
  handleDeleteGalleryImage: (id: string) => void;
}

export const GalleryManagementCard: React.FC<GalleryManagementCardProps> = ({
  galleryImages,
  isUploadingGallery,
  handleAddGalleryImage,
  handleUpdateGalleryCaption,
  handleDeleteGalleryImage,
}) => {
  return (
    <GlassCard className="border-t-4 border-t-purple-500">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="text-purple-400" />
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
  );
};
