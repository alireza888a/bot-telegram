import React from 'react';
import { GlassCard } from '../GlassCard';
import { Sparkles, Cloud, Image as ImageIcon, Video, Music, AlertTriangle, Trash2 } from 'lucide-react';
import { MenuPage } from '../../types';

interface MenuContentEditorCardProps {
  currentMenu: MenuPage;
  currentMenuId: string;
  updateMenu: (menuId: string, updates: Partial<MenuPage>) => void;
  insertVariable: (variable: string) => void;
  handleSuggest: () => void;
  loadingSuggestions: boolean;
  isUploading: boolean;
  handleMediaUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => void;
  removeMedia: (id: string) => void;
  DYNAMIC_VARS: Array<{ label: string; code: string }>;
}

export const MenuContentEditorCard: React.FC<MenuContentEditorCardProps> = ({
  currentMenu,
  currentMenuId,
  updateMenu,
  insertVariable,
  handleSuggest,
  loadingSuggestions,
  isUploading,
  handleMediaUpload,
  removeMedia,
  DYNAMIC_VARS,
}) => {
  return (
    <GlassCard title={`ویرایش محتوای: ${currentMenu.title}`}>
      <div className="space-y-4">
        <div>
          <label className="text-sm dark:text-white/60 text-slate-500 mb-2 block">عنوان داخلی (برای مدیریت)</label>
          <input
            type="text"
            value={currentMenu.title}
            onChange={(e) => updateMenu(currentMenuId, { title: e.target.value })}
            className="w-full dark:bg-black/20 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-lg p-2 text-sm outline-none dark:text-white text-slate-800"
          />
        </div>

        <div>
          <label className="text-sm dark:text-white/60 text-slate-500 mb-2 block">متن پیام (Caption)</label>
          <textarea
            id="message-content"
            value={currentMenu.content}
            onChange={(e) => updateMenu(currentMenuId, { content: e.target.value })}
            className="w-full dark:bg-black/20 bg-slate-50 border dark:border-white/10 border-slate-300 rounded-xl p-3 min-h-[100px] focus:outline-none dark:text-white text-slate-800 resize-none font-vazir mb-2"
            placeholder="متنی که ربات در این منو نمایش می‌دهد..."
          />
          <div className="flex flex-wrap gap-2 mb-3">
            {DYNAMIC_VARS.map(v => (
              <button
                key={v.code}
                onClick={() => insertVariable(v.code)}
                className="text-[10px] px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full hover:bg-blue-500/20 transition-colors"
                title={`درج ${v.label}`}
              >
                {v.label} <span className="opacity-50 ml-1">{v.code}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleSuggest}
            disabled={loadingSuggestions}
            className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Sparkles size={12} />
            {loadingSuggestions ? 'در حال فکر کردن...' : 'پیشنهاد دکمه با هوش مصنوعی'}
          </button>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm dark:text-white/60 text-slate-500 block">پیوست فایل</label>
            {isUploading && (
              <span className="text-xs text-blue-400 flex items-center gap-1 animate-pulse">
                <Cloud size={12} /> در حال آپلود به فضای ابری...
              </span>
            )}
          </div>

          <div className="flex gap-2 mb-3">
            <label className="flex-1 cursor-pointer flex flex-col items-center justify-center p-3 border border-dashed dark:border-white/20 border-slate-300 rounded-xl hover:bg-white/5 transition-colors text-slate-500 dark:text-white/50">
              <ImageIcon size={20} className="mb-1" />
              <span className="text-xs">عکس</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'image')} />
            </label>
            <label className="flex-1 cursor-pointer flex flex-col items-center justify-center p-3 border border-dashed dark:border-white/20 border-slate-300 rounded-xl hover:bg-white/5 transition-colors text-slate-500 dark:text-white/50">
              <Video size={20} className="mb-1" />
              <span className="text-xs">ویدیو</span>
              <input type="file" accept="video/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'video')} />
            </label>
            <label className="flex-1 cursor-pointer flex flex-col items-center justify-center p-3 border border-dashed dark:border-white/20 border-slate-300 rounded-xl hover:bg-white/5 transition-colors text-slate-500 dark:text-white/50">
              <Music size={20} className="mb-1" />
              <span className="text-xs">صدا</span>
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'audio')} />
            </label>
          </div>

          {currentMenu.media.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {currentMenu.media.map(media => (
                <div key={media.id} className={`relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border ${media.fileId ? 'border-green-500/50' : 'border-red-500/50 ring-2 ring-red-500/20'} group`}>
                  {media.type === 'image' && <img src={media.previewUrl || media.url} className="w-full h-full object-cover" alt="preview" />}
                  {media.type === 'video' && <video src={media.previewUrl || media.url} className="w-full h-full object-cover" />}
                  {media.type === 'audio' && <div className="w-full h-full bg-orange-500/20 flex items-center justify-center text-orange-400"><Music size={20} /></div>}

                  {/* Cloud Icon if uploaded to DB */}
                  {media.fileId ? (
                    <div className="absolute top-1 right-1 bg-green-500 text-white p-0.5 rounded-full z-10" title="ذخیره شده در کانال دیتابیس">
                      <Cloud size={10} />
                    </div>
                  ) : (
                    <div className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full z-10 animate-pulse" title="خطا: آپلود نشده! در تلگرام نمایش داده نمی‌شود.">
                      <AlertTriangle size={10} />
                    </div>
                  )}

                  {/* Fail Message Overlay */}
                  {!media.fileId && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[8px] bg-red-600 text-white px-1 rounded shadow">آپلود نشد</span>
                    </div>
                  )}

                  <button
                    onClick={() => removeMedia(media.id)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white z-20"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};
