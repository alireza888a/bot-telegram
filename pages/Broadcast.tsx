import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Send, CornerUpRight, BarChart3, Users } from 'lucide-react';
import { InlineRow, MediaAttachment, InlineButton, QueueItem } from '../types';
import { telegramService } from '../services/telegramService';
import { generateBroadcastMessage } from '../services/geminiService';

import { PersianDatePicker } from '../components/broadcast/PersianDatePicker';
import { BroadcastToast } from '../components/broadcast/BroadcastToast';
import { MessageContentCard } from '../components/broadcast/MessageContentCard';
import { InlineButtonsCard } from '../components/broadcast/InlineButtonsCard';
import { ForwardSettingsCard } from '../components/broadcast/ForwardSettingsCard';
import { PollQuizSettingsCard } from '../components/broadcast/PollQuizSettingsCard';
import { LiveMonitorPreview } from '../components/broadcast/LiveMonitorPreview';
import { AdvancedSendSettingsCard } from '../components/broadcast/AdvancedSendSettingsCard';
import { ProgressReportCard } from '../components/broadcast/ProgressReportCard';

interface Template {
    id: string;
    title: string;
    content: string;
    rows: InlineRow[];
}

export const Broadcast: React.FC = () => {
  const token = localStorage.getItem('bot_token') || '';
  const dbChannel = localStorage.getItem('bot_db_channel') || '';
  
  // --- CORE STATE ---
  const [broadcastMode, setBroadcastMode] = useState<'compose' | 'forward' | 'poll'>('compose');
  const [messageA, setMessageA] = useState('');
  const [messageB, setMessageB] = useState(''); 
  const [forwardLink, setForwardLink] = useState('');

  // --- POLL / QUIZ STATE ---
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['گزینه ۱', 'گزینه ۲']);
  const [pollType, setPollType] = useState<'regular' | 'quiz'>('regular');
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [quizCorrectOptionIndex, setQuizCorrectOptionIndex] = useState<number>(0);
  const [quizExplanation, setQuizExplanation] = useState('');
  const [previewVotedOption, setPreviewVotedOption] = useState<number | null>(null);
  const [previewVotes, setPreviewVotes] = useState<number[]>([12, 18]);

  const handleAddPollOption = () => {
    if (pollOptions.length >= 10) return;
    setPollOptions([...pollOptions, '']);
    setPreviewVotes([...previewVotes, 0]);
  };

  const handleUpdatePollOption = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length <= 2) return;
    const updatedOptions = pollOptions.filter((_, i) => i !== index);
    setPollOptions(updatedOptions);
    const updatedVotes = previewVotes.filter((_, i) => i !== index);
    setPreviewVotes(updatedVotes);
    if (quizCorrectOptionIndex >= updatedOptions.length) {
      setQuizCorrectOptionIndex(0);
    }
  };
  
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [activeVariant, setActiveVariant] = useState<'A' | 'B'>('A');

  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // --- STATS & REPORT ---
  const [realUsers, setRealUsers] = useState<any[]>(() => {
      try { return JSON.parse(localStorage.getItem('bot_users') || '[]'); } catch { return []; }
  });
  const [stats, setStats] = useState({ total: realUsers.length, sent: 0, blocked: 0, failed: 0 });
  const [showReport, setShowReport] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  // --- SETTINGS STATE ---
  const [sendSilent, setSendSilent] = useState(false);
  const [pinMessage, setPinMessage] = useState(false);
  const [contentProtect, setContentProtect] = useState(false);
  const [targetAudience, setTargetAudience] = useState<'all' | 'active' | 'vip' | 'new'>('all');
  const [sendSpeed, setSendSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  // --- SCHEDULING STATE ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduledDateObj, setScheduledDateObj] = useState<Date>(new Date());
  const [isScheduledEnabled, setIsScheduledEnabled] = useState(false);
  
  const [broadcastQueue, setBroadcastQueue] = useState<QueueItem[]>(() => {
      try { 
          const q = JSON.parse(localStorage.getItem('channel_queue') || '[]'); 
          return q.filter((item: QueueItem) => item.targetChannelId === 'all' || item.targetChannelId === 'BROADCAST_ALL');
      } catch { return []; }
  });

  // --- MEDIA ALBUM STATE ---
  const [mediaGroup, setMediaGroup] = useState<MediaAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // --- INLINE BUTTONS ---
  const [inlineRows, setInlineRows] = useState<InlineRow[]>([]);

  // --- TEMPLATES ---
  const [showTemplates, setShowTemplates] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<Template[]>(() => {
      try { return JSON.parse(localStorage.getItem('broadcast_templates') || '[]'); } catch { return []; }
  });

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // --- EFFECT: LOAD DRAFT ---
  useEffect(() => {
      const savedDraft = localStorage.getItem('broadcast_draft');
      if (savedDraft) {
          try {
              const draft = JSON.parse(savedDraft);
              if (draft.messageA) setMessageA(draft.messageA);
              if (draft.inlineRows) setInlineRows(draft.inlineRows);
              if (draft.settings) {
                  setSendSilent(draft.settings.sendSilent);
                  setPinMessage(draft.settings.pinMessage);
                  setSendSpeed(draft.settings.sendSpeed);
                  setContentProtect(draft.settings.contentProtect);
              }
          } catch(e) { console.error('Draft load error', e); }
      }
  }, []);

  // --- EFFECT: SAVE DRAFT ---
  useEffect(() => {
      const timeout = setTimeout(() => {
          setIsSavingDraft(true);
          const draft = {
              messageA,
              inlineRows,
              settings: { sendSilent, pinMessage, sendSpeed, contentProtect }
          };
          localStorage.setItem('broadcast_draft', JSON.stringify(draft));
          setTimeout(() => setIsSavingDraft(false), 500);
      }, 1000);
      return () => clearTimeout(timeout);
  }, [messageA, inlineRows, sendSilent, pinMessage, sendSpeed, contentProtect]);

  // Refresh Queue from LocalStorage
  const refreshQueue = () => {
      try { 
          const q = JSON.parse(localStorage.getItem('channel_queue') || '[]'); 
          setBroadcastQueue(q.filter((item: QueueItem) => item.targetChannelId === 'all' || item.targetChannelId === 'BROADCAST_ALL'));
      } catch { }
  };

  useEffect(() => {
      const interval = setInterval(refreshQueue, 2000);
      return () => clearInterval(interval);
  }, []);

  const stopSignal = useRef(false);

  // --- HANDLERS ---

  const handleMediaFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setIsUploading(true);
          const newFiles: MediaAttachment[] = [];

          for (const file of Array.from(e.target.files) as File[]) {
              const type = (file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image') as 'image' | 'video' | 'audio';
              const previewUrl = URL.createObjectURL(file);
              let finalUrl = previewUrl;
              let fileId = undefined;

              if (dbChannel && token) {
                  const uploadedId = await telegramService.uploadToDb(token, dbChannel, file, type);
                  if (uploadedId) {
                      finalUrl = uploadedId;
                      fileId = uploadedId;
                  }
              }

              newFiles.push({
                  id: Date.now() + Math.random().toString(),
                  type,
                  url: finalUrl,
                  previewUrl: previewUrl,
                  name: file.name,
                  fileId: fileId
              });
          }
          setMediaGroup(prev => [...prev, ...newFiles].slice(0, 10));
          setIsUploading(false);
      }
  };

  const removeMedia = (index: number) => {
      setMediaGroup(prev => prev.filter((_, i) => i !== index));
  };

  const addInlineRow = (count: number) => {
    const newButtons: InlineButton[] = Array.from({ length: count }).map((_, i) => ({
        id: `${Date.now()}_${i}`,
        text: count === 1 ? 'دکمه جدید' : `گزینه ${i + 1}`,
        type: 'link',
        value: ''
    }));
    setInlineRows([...inlineRows, { id: Date.now().toString(), buttons: newButtons }]);
  };

  const removeInlineRow = (rowId: string) => setInlineRows(inlineRows.filter(r => r.id !== rowId));
  
  const addButtonToRow = (rowId: string) => {
    const row = inlineRows.find(r => r.id === rowId);
    if (row && row.buttons.length >= 8) return;
    const newBtn: InlineButton = { id: Date.now().toString(), text: 'دکمه', type: 'link', value: '' };
    setInlineRows(inlineRows.map(r => r.id === rowId ? { ...r, buttons: [...r.buttons, newBtn] } : r));
  };

  const removeButton = (rowId: string, btnId: string) => {
    setInlineRows(inlineRows.map(r => r.id === rowId ? { ...r, buttons: r.buttons.filter(b => b.id !== btnId) } : r).filter(r => r.buttons.length > 0)); 
  };

  const updateButton = (rowId: string, btnId: string, field: 'text' | 'value', val: string) => {
    setInlineRows(inlineRows.map(r => r.id === rowId ? { ...r, buttons: r.buttons.map(b => b.id === btnId ? { ...b, [field]: val } : b) } : r));
  };

  const insertVariable = (variable: string) => {
      if (textAreaRef.current) {
          const start = textAreaRef.current.selectionStart;
          const end = textAreaRef.current.selectionEnd;
          const text = activeVariant === 'A' ? messageA : messageB;
          const newText = text.substring(0, start) + variable + text.substring(end);
          if (activeVariant === 'A') setMessageA(newText); else setMessageB(newText);
      }
  };

  // --- SENDING LOGIC ---
  const handleBroadcast = async () => {
    const content = activeVariant === 'A' ? messageA : messageB;
    
    // Check mode
    if (broadcastMode === 'compose') {
        if (!content && mediaGroup.length === 0) return setToast({message: 'لطفا متن پیام یا مدیا را وارد کنید', type: 'error'});
    } else if (broadcastMode === 'forward') {
        if (!forwardLink.includes('t.me/')) return setToast({message: 'لینک پست کانال معتبر نیست', type: 'error'});
    } else {
        if (!pollQuestion.trim()) return setToast({message: 'لطفا سوال نظرسنجی را وارد کنید', type: 'error'});
        if (pollOptions.some(opt => !opt.trim())) return setToast({message: 'لطفا تمامی گزینه‌های پاسخ را پر کنید', type: 'error'});
    }

    if (isScheduledEnabled) {
        setToast({ message: 'این ویژگی در نسخه دمو برای فوروارد فعال نیست', type: 'error' });
        return;
    }
    
    // Immediate Send (Manual Loop)
    executeRealBroadcast(content, inlineRows, mediaGroup, { 
        pin: pinMessage, 
        silent: sendSilent, 
        protect: contentProtect, 
        speed: sendSpeed 
    });
    localStorage.removeItem('broadcast_draft'); 
  };

  const executeRealBroadcast = async (content: string, rows: InlineRow[], media: MediaAttachment[], opts: any) => {
    const rawUsers = JSON.parse(localStorage.getItem('bot_users') || '[]');
    
    // EXCLUDE demo users from real API calls, only keep actual users
    const actualUsers = rawUsers.filter((u: any) => !u.isDemo);
    
    // Apply Target Audience filter
    let users = [...actualUsers];
    if (targetAudience === 'active') {
        users = actualUsers.filter((u: any) => u.status === 'active' || u.status === undefined);
    } else if (targetAudience === 'vip') {
        users = actualUsers.filter((u: any) => u.tags?.some((t: string) => t.toLowerCase().includes('vip') || t.includes('ویژه') || t.includes('VIP')));
    } else if (targetAudience === 'new') {
        const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
        users = actualUsers.filter((u: any) => {
            const joined = u.joinedAt || u.joined_at;
            if (!joined) return false;
            if (typeof joined === 'number') return joined >= threeDaysAgo;
            const d = new Date(joined).getTime();
            return d >= threeDaysAgo;
        });
    }

    if (users.length === 0) {
        if (actualUsers.length === 0) {
            return setToast({ message: 'هنوز هیچ کاربر واقعی در ربات ثبت نشده است (با /start در ربات خود تست کنید)', type: 'error' });
        } else {
            return setToast({ message: 'هیچ کاربر واقعی با شرایط فیلتر انتخاب شده یافت نشد.', type: 'error' });
        }
    }

    setIsSending(true);
    setShowReport(false);
    setIsPaused(false);
    stopSignal.current = false;
    setProgress(0);
    setStats({ total: users.length, sent: 0, blocked: 0, failed: 0 });

    // Speed Control
    let delay = 200; // Normal
    if (opts.speed === 'slow') delay = 1000;
    if (opts.speed === 'fast') delay = 50;

    const replyMarkup = { inline_keyboard: rows.map(r => r.buttons.map(b => ({
        text: b.text,
        url: b.type === 'link' ? b.value : undefined,
        callback_data: b.type === 'link' ? undefined : b.value
    }))) };

    const sendOpts = { disable_notification: opts.silent, protect_content: opts.protect };

    // Parse Forward Link if needed
    let forwardSource: { chatId: string, messageId: number } | null = null;
    if (broadcastMode === 'forward') {
        try {
            // Extracts channel ID and Msg ID from t.me/c/123123123/123 or t.me/username/123
            const parts = forwardLink.split('/');
            const msgId = parseInt(parts[parts.length - 1]);
            let chatRef = parts[parts.length - 2];
            
            // Handle private links (c/123456)
            if (parts.includes('c')) {
                chatRef = '-100' + parts[parts.indexOf('c') + 1];
            } else if (!chatRef.startsWith('@') && !chatRef.startsWith('-100')) {
                chatRef = '@' + chatRef;
            }
            
            forwardSource = { chatId: chatRef, messageId: msgId };
        } catch {
            setIsSending(false);
            return setToast({ message: 'فرمت لینک فوروارد اشتباه است', type: 'error' });
        }
    }

    for (let i = 0; i < users.length; i++) {
        if (stopSignal.current) break;
        while (isPaused) { await new Promise(r => setTimeout(r, 500)); if (stopSignal.current) break; }

        const user = users[i];
        let res;
        const finalContent = content.replace(/{first_name}|{نام}/g, user.firstName || user.first_name || 'کاربر')
                                    .replace(/{username}|{یوزرنیم}/g, user.username || 'ندارد')
                                    .replace(/{id}/g, user.id);

        try {
            if (broadcastMode === 'forward' && forwardSource) {
                res = await telegramService.forwardMessage(token, user.id, forwardSource.chatId, forwardSource.messageId, sendOpts);
            } else if (broadcastMode === 'poll') {
                res = await telegramService.sendPoll(
                    token,
                    user.id,
                    pollQuestion,
                    pollOptions,
                    isAnonymous,
                    allowMultipleAnswers,
                    pollType,
                    quizCorrectOptionIndex,
                    quizExplanation
                );
            } else {
                if (media.length > 0) {
                    if (media.length > 1) {
                        const albumFiles = media.map(m => ({ file: m.fileId || m.url, type: m.type }));
                        const albumRes = await telegramService.sendMediaGroup(token, user.id, albumFiles, finalContent, sendOpts);
                        res = { ok: albumRes.ok };
                    } else {
                        const m = media[0];
                        const fileRef = m.fileId || m.url;
                        if (m.type === 'image') res = await telegramService.sendPhoto(token, user.id, fileRef, finalContent, replyMarkup, sendOpts);
                        else if (m.type === 'video') res = await telegramService.sendVideo(token, user.id, fileRef, finalContent, replyMarkup, sendOpts);
                        else res = await telegramService.sendDocument(token, user.id, fileRef, finalContent, replyMarkup, sendOpts);
                    }
                } else {
                    res = await telegramService.sendMessage(token, user.id, finalContent, replyMarkup, sendOpts);
                }
            }

            if (res.ok) {
                setStats(prev => ({ ...prev, sent: prev.sent + 1 }));
                if (opts.pin && res.result) await telegramService.pinChatMessage(token, user.id, res.result.message_id, opts.silent);
            } else {
                // DEAD USER DETECTION
                const desc = res.description?.toLowerCase() || '';
                if (desc.includes('blocked') || desc.includes('user is deactivated') || desc.includes('initiate')) {
                    setStats(prev => ({ ...prev, blocked: prev.blocked + 1 }));
                    // Clean up DB
                    const currentUsers = JSON.parse(localStorage.getItem('bot_users') || '[]');
                    const newUsers = currentUsers.filter((u: any) => u.id !== user.id);
                    localStorage.setItem('bot_users', JSON.stringify(newUsers));
                } else {
                    setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
                }
            }
        } catch (e) {
            setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
        }

        setProgress(Math.round(((i + 1) / users.length) * 100));
        await new Promise(r => setTimeout(r, delay)); 
    }

    setIsSending(false);
    setShowReport(true);
    setToast({message: 'عملیات ارسال به پایان رسید', type: 'success'});
  };

  const handleStop = () => {
      if (window.confirm('آیا از توقف اضطراری ارسال اطمینان دارید؟')) {
          stopSignal.current = true;
          setIsPaused(false); 
      }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in pb-20">
      {toast && <BroadcastToast {...toast} onClose={() => setToast(null)} />}
      <PersianDatePicker isOpen={showDatePicker} onClose={() => setShowDatePicker(false)} initialDate={scheduledDateObj} onSelect={(d) => { setScheduledDateObj(d); setIsScheduledEnabled(true); }}/>

      {/* Header Stats */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
         <div>
            <h2 className="text-2xl font-bold dark:text-white text-slate-800 flex items-center gap-2">
                <Users className="text-purple-500"/> پیام همگانی پیشرفته
            </h2>
            <div className="flex items-center gap-3 mt-1">
                <p className="text-sm dark:text-white/50 text-slate-500">ارسال انبوه، زمان‌بندی هوشمند و گزارش‌گیری</p>
            </div>
         </div>
         <div className="flex gap-3">
             <div className="text-center px-4 border-r border-white/10 border-l">
                 <div className="text-xl font-bold text-white">{stats.total.toLocaleString()}</div>
                 <div className="text-[10px] text-slate-400">کل مخاطبین</div>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 items-start">
          
          {/* COLUMN 1: EDITOR */}
          <div className="space-y-6">
              
              {/* MODE SWITCHER */}
              <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 w-fit">
                  <button onClick={() => setBroadcastMode('compose')} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${broadcastMode === 'compose' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                      <Send size={16}/> نوشتن پیام
                  </button>
                  <button onClick={() => setBroadcastMode('forward')} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${broadcastMode === 'forward' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                      <CornerUpRight size={16}/> فوروارد پست
                  </button>
                  <button onClick={() => setBroadcastMode('poll')} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${broadcastMode === 'poll' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                      <BarChart3 size={16}/> نظرسنجی و آزمون‌ساز
                  </button>
              </div>

              {broadcastMode === 'compose' ? (
                  <>
                    <MessageContentCard
                      messageA={messageA}
                      setMessageA={setMessageA}
                      textAreaRef={textAreaRef}
                      insertVariable={insertVariable}
                      handleMediaFiles={handleMediaFiles}
                      isUploading={isUploading}
                      mediaGroup={mediaGroup}
                      removeMedia={removeMedia}
                    />
                    <InlineButtonsCard
                      inlineRows={inlineRows}
                      addInlineRow={addInlineRow}
                      removeInlineRow={removeInlineRow}
                      addButtonToRow={addButtonToRow}
                      removeButton={removeButton}
                      updateButton={updateButton}
                    />
                  </>
              ) : broadcastMode === 'forward' ? (
                  <ForwardSettingsCard
                    forwardLink={forwardLink}
                    setForwardLink={setForwardLink}
                  />
              ) : (
                  <PollQuizSettingsCard
                    pollQuestion={pollQuestion}
                    setPollQuestion={setPollQuestion}
                    pollType={pollType}
                    setPollType={setPollType}
                    isAnonymous={isAnonymous}
                    setIsAnonymous={setIsAnonymous}
                    allowMultipleAnswers={allowMultipleAnswers}
                    setAllowMultipleAnswers={setAllowMultipleAnswers}
                    pollOptions={pollOptions}
                    handleAddPollOption={handleAddPollOption}
                    handleUpdatePollOption={handleUpdatePollOption}
                    handleRemovePollOption={handleRemovePollOption}
                    quizCorrectOptionIndex={quizCorrectOptionIndex}
                    setQuizCorrectOptionIndex={setQuizCorrectOptionIndex}
                    quizExplanation={quizExplanation}
                    setQuizExplanation={setQuizExplanation}
                    setPreviewVotedOption={setPreviewVotedOption}
                  />
              )}
          </div>

          {/* COLUMN 2: MONITOR & SETTINGS & TARGETING */}
          <div className="space-y-6">
              
              <LiveMonitorPreview
                broadcastMode={broadcastMode}
                pollType={pollType}
                pollQuestion={pollQuestion}
                pollOptions={pollOptions}
                previewVotes={previewVotes}
                setPreviewVotes={setPreviewVotes}
                previewVotedOption={previewVotedOption}
                setPreviewVotedOption={setPreviewVotedOption}
                quizCorrectOptionIndex={quizCorrectOptionIndex}
                quizExplanation={quizExplanation}
                forwardLink={forwardLink}
                activeVariant={activeVariant}
                messageA={messageA}
                messageB={messageB}
                mediaGroup={mediaGroup}
                inlineRows={inlineRows}
              />

              <AdvancedSendSettingsCard
                targetAudience={targetAudience}
                setTargetAudience={setTargetAudience}
                realUsers={realUsers}
                sendSpeed={sendSpeed}
                setSendSpeed={setSendSpeed}
                sendSilent={sendSilent}
                setSendSilent={setSendSilent}
                contentProtect={contentProtect}
                setContentProtect={setContentProtect}
                isSending={isSending}
                handleBroadcast={handleBroadcast}
                isPaused={isPaused}
                setIsPaused={setIsPaused}
                handleStop={handleStop}
              />

              <ProgressReportCard
                progress={progress}
                showReport={showReport}
                isSending={isSending}
                isPaused={isPaused}
                stats={stats}
              />
          </div>
      </div>
    </div>
  );
};