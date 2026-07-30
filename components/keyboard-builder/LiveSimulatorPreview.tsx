import React from 'react';
import { Eye, Music } from 'lucide-react';
import { MenuPage, InlineButton } from '../../types';

interface LiveSimulatorPreviewProps {
  currentMenu: MenuPage;
  handlePreviewAction: (btn: InlineButton) => void;
  getButtonDisplayText: (btn: InlineButton) => string;
  navigateTo: (menuId: string) => void;
  navigateBack: () => void;
}

export const LiveSimulatorPreview: React.FC<LiveSimulatorPreviewProps> = ({
  currentMenu,
  handlePreviewAction,
  getButtonDisplayText,
  navigateTo,
  navigateBack,
}) => {
  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col h-full shadow-inner">
      <div className="flex justify-between items-center mb-4 text-xs dark:text-white/40 text-slate-500 border-b border-white/5 pb-2">
        <span className="flex items-center gap-1 font-bold text-slate-300">
          <Eye size={14} className="text-blue-400" /> پیش‌نمایش زنده ربات (تلگرام)
        </span>
        <span>منوی فعال: {currentMenu.id}</span>
      </div>

      <div className="flex-1 bg-[#0f172a] rounded-xl p-4 overflow-y-auto space-y-4 border border-white/5 flex flex-col justify-end min-h-[400px]">
        {/* Telegram Message Mock */}
        <div className="bg-[#1e293b] rounded-2xl p-4 max-w-[90%] self-start border border-white/5 shadow-md space-y-3 animate-fade-in">
          {/* Media Attachments Preview */}
          {currentMenu.media.length > 0 && (
            <div className="grid gap-2 grid-cols-1">
              {currentMenu.media.map(media => (
                <div key={media.id} className="rounded-lg overflow-hidden border border-white/10 bg-black/40">
                  {media.type === 'image' && <img src={media.previewUrl || media.url} alt="Telegram Attachment" className="w-full h-auto max-h-48 object-cover" />}
                  {media.type === 'video' && <video src={media.previewUrl || media.url} controls className="w-full h-auto max-h-48 object-cover" />}
                  {media.type === 'audio' && (
                    <div className="p-3 flex items-center gap-2 text-xs text-orange-300">
                      <Music size={16} />
                      <audio src={media.previewUrl || media.url} controls className="w-full h-8" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Text Content */}
          <p className="text-sm text-white whitespace-pre-wrap leading-relaxed font-vazir">
            {currentMenu.content || 'متنی برای این منو تنظیم نشده است.'}
          </p>

          <div className="text-[10px] text-white/30 text-left dir-ltr">12:34 PM</div>
        </div>

        {/* Telegram Keyboard Mock */}
        {currentMenu.rows.length > 0 && (
          <div className="space-y-1.5 pt-2">
            {currentMenu.rows.map(row => (
              <div key={row.id} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${row.buttons.length}, minmax(0, 1fr))` }}>
                {row.buttons.map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => handlePreviewAction(btn)}
                    className="bg-[#28364e] hover:bg-[#324463] active:scale-95 text-blue-200 py-2.5 px-2 rounded-xl text-xs font-medium text-center truncate border border-white/5 transition-all shadow"
                  >
                    {getButtonDisplayText(btn)}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Helper Bar */}
      <div className="mt-3 flex justify-between items-center text-[11px] text-slate-400 px-1">
        <span>کلیک روی دکمه‌ها در حالت پیش‌نمایش عمل می‌کند</span>
        {currentMenu.id !== 'root' && (
          <button onClick={navigateBack} className="text-blue-400 hover:underline">
            بازگشت به منوی قبل
          </button>
        )}
      </div>
    </div>
  );
};
