import React from 'react';
import { BarChart3, CornerUpRight, Music, Link as LinkIcon } from 'lucide-react';
import { InlineRow, MediaAttachment } from '../../types';

interface LiveMonitorPreviewProps {
  broadcastMode: 'compose' | 'forward' | 'poll';
  pollType: 'regular' | 'quiz';
  pollQuestion: string;
  pollOptions: string[];
  previewVotes: number[];
  setPreviewVotes: React.Dispatch<React.SetStateAction<number[]>>;
  previewVotedOption: number | null;
  setPreviewVotedOption: React.Dispatch<React.SetStateAction<number | null>>;
  quizCorrectOptionIndex: number;
  quizExplanation: string;
  forwardLink: string;
  activeVariant: 'A' | 'B';
  messageA: string;
  messageB: string;
  mediaGroup: MediaAttachment[];
  inlineRows: InlineRow[];
}

export const LiveMonitorPreview: React.FC<LiveMonitorPreviewProps> = ({
  broadcastMode,
  pollType,
  pollQuestion,
  pollOptions,
  previewVotes,
  setPreviewVotes,
  previewVotedOption,
  setPreviewVotedOption,
  quizCorrectOptionIndex,
  quizExplanation,
  forwardLink,
  activeVariant,
  messageA,
  messageB,
  mediaGroup,
  inlineRows,
}) => {
  return (
    <div className="telegram-simulator bg-[#0f172a] border border-white/10 rounded-3xl p-4 relative shadow-2xl mx-auto w-full max-w-[320px] overflow-hidden">
      <div className="flex justify-center mb-2"><div className="w-16 h-4 bg-black/50 rounded-b-xl"></div></div>
      <div className="bg-[#0e1621] h-[400px] rounded-xl overflow-y-auto custom-scrollbar bg-[url('https://web.telegram.org/img/bg_0.png')] relative flex flex-col">
        <div className="p-2 space-y-2 pt-10">
          {broadcastMode === 'poll' ? (
            <div className="bg-[#182533] rounded-tr-xl rounded-tl-xl rounded-bl-xl rounded-br-none shadow-md overflow-hidden ml-auto max-w-[90%] border border-black/10 p-3.5 dir-rtl text-right">
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold mb-2">
                <BarChart3 size={12}/>
                <span>{pollType === 'quiz' ? 'آزمون تستی' : 'نظرسنجی ناشناس'}</span>
              </div>
              <div className="text-white text-xs font-bold font-vazir leading-relaxed mb-3">
                {pollQuestion || 'سوال خود را مطرح کنید...'}
              </div>

              <div className="space-y-2">
                {pollOptions.map((opt, idx) => {
                  const totalVotes = previewVotes.reduce((sum, v) => sum + v, 0) || 1;
                  const optVotes = previewVotes[idx] || 0;
                  const percentage = Math.round((optVotes / totalVotes) * 100);

                  const isVoted = previewVotedOption !== null;
                  const isCorrect = idx === quizCorrectOptionIndex;

                  const handleVoteClick = () => {
                    if (previewVotedOption !== null) {
                      setPreviewVotedOption(null);
                      const updated = [...previewVotes];
                      updated[idx] = Math.max(0, updated[idx] - 1);
                      setPreviewVotes(updated);
                    } else {
                      setPreviewVotedOption(idx);
                      const updated = [...previewVotes];
                      updated[idx] = updated[idx] + 1;
                      setPreviewVotes(updated);
                    }
                  };

                  return (
                    <button
                      key={idx}
                      onClick={handleVoteClick}
                      className="w-full text-right block relative overflow-hidden rounded-lg p-2.5 bg-white/5 border border-white/5 text-[11px] text-white transition-all hover:bg-white/10"
                    >
                      {isVoted && (
                        <div
                          className={`absolute inset-y-0 right-0 transition-all duration-500 ${
                            pollType === 'quiz'
                              ? (isCorrect ? 'bg-green-500/20' : (previewVotedOption === idx ? 'bg-red-500/20' : 'bg-white/5'))
                              : 'bg-emerald-500/20'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      )}

                      <div className="relative z-10 flex justify-between items-center w-full">
                        <span className="font-vazir">{opt || `گزینه ${idx + 1}`}</span>
                        {isVoted && (
                          <span className="font-mono text-[10px] text-slate-300">
                            {percentage}%
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {pollType === 'quiz' && previewVotedOption !== null && previewVotedOption !== quizCorrectOptionIndex && quizExplanation && (
                <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-300 leading-relaxed">
                  <strong>راهنمایی:</strong> {quizExplanation}
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center text-[9px] text-white/40">
                <span>{previewVotes.reduce((sum, v) => sum + v, 0)} رای</span>
                <span className="font-mono">14:05</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#182533] rounded-tr-xl rounded-tl-xl rounded-bl-xl rounded-br-none shadow-md overflow-hidden ml-auto max-w-[90%] border border-black/10">

              {/* Forward Header */}
              {broadcastMode === 'forward' && (
                <div className="px-3 pt-2 text-[10px] text-blue-400 font-bold flex items-center gap-1 border-b border-white/5 pb-1 mb-1">
                  <CornerUpRight size={10}/> Forwarded from Channel
                </div>
              )}

              {/* Media */}
              {broadcastMode === 'compose' && mediaGroup.length > 0 && (
                <div className="mb-1 relative">
                  {mediaGroup[0].type === 'image' && <img src={mediaGroup[0].previewUrl || mediaGroup[0].url} className="w-full h-32 object-cover" alt="Media" />}
                  {mediaGroup[0].type === 'video' && <video src={mediaGroup[0].previewUrl || mediaGroup[0].url} className="w-full h-32 object-cover" />}
                  {mediaGroup[0].type === 'audio' && <div className="w-full h-12 bg-[#2b5278] flex items-center justify-center text-white"><Music size={16}/> Audio</div>}
                  {mediaGroup.length > 1 && <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1.5 rounded-full">+{mediaGroup.length - 1}</div>}
                </div>
              )}

              {/* Text */}
              <div className="px-3 py-2 text-white text-xs whitespace-pre-wrap dir-rtl text-right font-vazir leading-relaxed">
                {broadcastMode === 'forward'
                  ? (forwardLink ? 'محتوای پست فوروارد شده...' : 'لینک پست را وارد کنید')
                  : ((activeVariant === 'A' ? messageA : messageB) || 'متن پیام...')}
              </div>
              <div className="px-2 pb-1 text-right text-[9px] text-white/40 font-mono">14:05</div>
            </div>
          )}

          {/* Inline Buttons */}
          {broadcastMode === 'compose' && inlineRows.length > 0 && (
            <div className="space-y-[2px] ml-auto max-w-[90%]">
              {inlineRows.map(row => (
                <div key={row.id} className="flex gap-[2px]">
                  {row.buttons.map(btn => (
                    <div key={btn.id} className={`flex-1 text-[10px] py-2 text-center rounded-[4px] truncate px-1 border border-transparent transition-all
                      ${btn.color === 'blue'
                        ? 'bg-blue-600/30 text-blue-100 border-blue-500/20'
                        : btn.color === 'green'
                        ? 'bg-emerald-600/30 text-emerald-100 border-emerald-500/20'
                        : btn.color === 'red'
                        ? 'bg-red-600/30 text-red-100 border-red-500/20'
                        : btn.color === 'gold'
                        ? 'bg-amber-500/35 text-amber-200 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                        : btn.color === 'orange'
                        ? 'bg-orange-600/30 text-orange-100 border-orange-500/20'
                        : 'bg-[#2b5278]/20 text-white backdrop-blur-sm'
                      }`}>
                      {btn.text}
                      {btn.type === 'link' && <LinkIcon size={8} className="inline ml-1 opacity-50"/>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
