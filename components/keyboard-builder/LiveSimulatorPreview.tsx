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
    <div className="relative flex flex-col items-center pt-8">
        <div className="absolute top-0 flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-1.5 rounded-full text-sm font-medium border border-green-500/20 shadow-sm animate-pulse cursor-pointer hover:bg-green-500/20 transition-colors">
          <Eye size={16} />
          پیش‌نمایش تعاملی (کلیک کنید)
       </div>

      <div className="telegram-simulator mt-8 w-[300px] bg-[#1c2431] rounded-[30px] border-[6px] border-[#252f3f] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden relative h-[600px] flex flex-col shrink-0">
             {/* MESSAGE BUBBLE */}
             <div className="flex-1 bg-[#0e1621] p-2 overflow-y-auto space-y-2 bg-[url('https://web.telegram.org/img/bg_0.png')] bg-repeat custom-scrollbar mt-12">
             <div className="bg-[#182533] rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none max-w-[95%] shadow-sm overflow-hidden animate-slide-up">
                {/* Media */}
                {currentMenu.media.length > 0 && (
                  <div className={`grid gap-0.5 ${currentMenu.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {currentMenu.media.map((media, i) => (
                      <div key={i} className={`relative bg-black/50 ${currentMenu.media.length === 1 ? 'aspect-video' : 'aspect-square'} overflow-hidden`}>
                          {media.type === 'image' && <img src={media.previewUrl || media.url} className="w-full h-full object-cover" />}
                          {media.type === 'video' && <video src={media.previewUrl || media.url} className="w-full h-full object-cover" />}
                          {media.type === 'audio' && <div className="w-full h-full flex flex-col items-center justify-center text-white/70"><Music size={24}/><span className="text-[10px] mt-1">Audio</span></div>}
                      </div>
                    ))}
                  </div>
                )}
                {/* Text */}
                <div className="p-3 text-white text-sm whitespace-pre-wrap dir-rtl text-right leading-relaxed">
                   {currentMenu.content || '...'}
                </div>
                <div className="px-3 pb-1 text-right"><span className="text-[10px] text-white/40">14:05</span></div>
             </div>

             {/* Buttons */}
              <div className="max-w-[95%] space-y-[2px] animate-slide-up">
                {currentMenu.rows.map((row) => (
                  <div key={row.id} className="flex gap-[2px] w-full">
                    {row.buttons.map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => handlePreviewAction(btn)}
                        className={`
                          flex-1 text-xs py-2.5 px-1 rounded-[4px] text-center cursor-pointer transition-all duration-200 truncate font-medium relative select-none border border-transparent
                          ${btn.color === 'blue'
                            ? 'bg-blue-600/30 hover:bg-blue-600/50 active:bg-blue-600/70 text-blue-100 border-blue-500/20'
                            : btn.color === 'green'
                            ? 'bg-emerald-600/30 hover:bg-emerald-600/50 active:bg-emerald-600/70 text-emerald-100 border-emerald-500/20'
                            : btn.color === 'red'
                            ? 'bg-red-600/30 hover:bg-red-600/50 active:bg-red-600/70 text-red-100 border-red-500/20'
                            : btn.color === 'gold'
                            ? 'bg-amber-500/35 hover:bg-amber-500/55 active:bg-amber-500/75 text-amber-200 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                            : btn.color === 'orange'
                            ? 'bg-orange-600/30 hover:bg-orange-600/50 active:bg-orange-600/70 text-orange-100 border-orange-500/20'
                            : 'bg-[#2b5278]/20 hover:bg-[#2b5278]/40 active:bg-[#2b5278]/60 text-white'
                          }
                        `}
                      >
                        {btn.condition?.type && btn.condition.type !== 'none' && (
                          <span className="text-amber-400 font-bold ml-1 inline-block" title="دکمه شرطی">⚡</span>
                        )}
                        {getButtonDisplayText(btn)}
                      </button>
                    ))}
                  </div>
                ))}

                {/* Auto Nav Injection in Preview */}
                {currentMenu.id !== 'root' && (
                    <div className="flex gap-[2px] w-full">
                        <button onClick={() => navigateTo('root')} className="flex-1 bg-[#2b5278]/20 hover:bg-[#2b5278]/40 text-white text-xs py-2.5 px-1 rounded-[4px] text-center">🏠 منوی اصلی</button>
                        <button onClick={navigateBack} className="flex-1 bg-[#2b5278]/20 hover:bg-[#2b5278]/40 text-white text-xs py-2.5 px-1 rounded-[4px] text-center">🔙 بازگشت</button>
                    </div>
                )}
                </div>
             </div>
       </div>
    </div>
  );
};
