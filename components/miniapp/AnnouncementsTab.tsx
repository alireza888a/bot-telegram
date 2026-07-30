import React from 'react';
import { Bell, RefreshCw, Loader2, AlertTriangle, Clock } from 'lucide-react';

export interface AnnouncementMedia {
  type: 'image' | 'video' | 'audio';
  url: string;
}

export interface Announcement {
  id: string;
  content: string;
  mediaFiles?: AnnouncementMedia[];
  createdAt: number | string;
}

export interface AnnouncementsTabProps {
  announcements: Announcement[];
  announcementsLoading: boolean;
  announcementsError: string | null;
  fetchAnnouncements: () => void;
  formatRelativeTime: (timestamp: number | string) => string;
}

export const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({
  announcements,
  announcementsLoading,
  announcementsError,
  fetchAnnouncements,
  formatRelativeTime
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell size={18} className="text-amber-400" />
          <span>اعلانات و اخبار</span>
        </h2>
        <button 
          onClick={fetchAnnouncements} 
          disabled={announcementsLoading}
          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
        >
          <RefreshCw size={13} className={announcementsLoading ? 'animate-spin' : ''} />
          <span>بروزرسانی</span>
        </button>
      </div>

      {announcementsLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-3">
          <Loader2 size={32} className="text-amber-500 animate-spin" />
          <p className="text-xs text-slate-400">در حال دریافت اعلانات...</p>
        </div>
      ) : announcementsError ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-2">
          <AlertTriangle size={32} className="text-red-400 mx-auto" />
          <p className="text-xs text-red-300">{announcementsError}</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-3 my-8">
          <Bell size={44} className="text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">اطلاعیه‌ای وجود ندارد</h3>
          <p className="text-xs text-slate-400">هنوز هیچ اطلاعیه‌ای منتشر نشده است.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div key={item.id} className="bg-[#151c2c]/80 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-sm shadow-md">
              {/* Media attachments */}
              {item.mediaFiles && item.mediaFiles.length > 0 && (
                <div className="space-y-2">
                  {item.mediaFiles.map((media, mIdx) => (
                    <div key={mIdx} className="rounded-xl overflow-hidden bg-black/40 border border-white/5 max-h-72 flex items-center justify-center">
                      {media.type === 'video' ? (
                        <video src={media.url} controls className="w-full max-h-72 object-contain" />
                      ) : media.type === 'audio' ? (
                        <audio src={media.url} controls className="w-full p-2" />
                      ) : (
                        <img src={media.url} alt="اطلاعیه" className="w-full max-h-72 object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Announcement text content */}
              {item.content && (
                <div 
                  className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              )}

              {/* Footer Date */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-amber-400" />
                  <span>{formatRelativeTime(item.createdAt)}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
