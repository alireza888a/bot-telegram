import React from 'react';
import { Eye, X, Image as ImageIcon, FileText, Video, Music, Globe, PhoneCall } from 'lucide-react';
import { FormConfig } from '../../types';
import { FormCheckboxSimulator } from './FormCheckboxSimulator';

interface ButtonPreviewModalProps {
  previewModal: { type: 'link' | 'form' | 'inquiry'; value: string } | null;
  onClose: () => void;
  forms: Record<string, FormConfig>;
  simFormStep: number;
  simFormAnswers: string[];
  handleSimFormSubmit: (answer: string) => void;
}

export const ButtonPreviewModal: React.FC<ButtonPreviewModalProps> = ({
  previewModal,
  onClose,
  forms,
  simFormStep,
  simFormAnswers,
  handleSimFormSubmit,
}) => {
  if (!previewModal) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-white/5 bg-[#0f172a]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Eye size={16} className="text-green-400" />
            {previewModal.type === 'form' ? 'پیش‌نمایش تعاملی فرم' : previewModal.type === 'link' ? 'پیش‌نمایش لینک' : 'پیش‌نمایش درخواست'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {previewModal.type === 'form' && (() => {
            const form = forms[previewModal.value];
            if (!form) {
              return <p className="text-xs text-red-400">فرمی با این شناسه یافت نشد ({previewModal.value}).</p>;
            }
            const qCount = form.questions.length;
            if (qCount === 0) {
              return <p className="text-xs text-slate-400">این فرم هیچ سوالی ندارد.</p>;
            }

            if (simFormStep >= qCount) {
              return (
                <div className="space-y-4 text-center py-2">
                  <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">تکمیل فرم با موفقیت!</h4>
                    <p className="text-xs text-slate-400">پاسخ‌ها برای ادمین ({form.adminId || 'تعریف نشده'}) فوروارد می‌شوند.</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/10 text-right space-y-2 text-xs">
                    <p className="font-bold text-slate-300 border-b border-white/10 pb-1">خلاصه پاسخ‌های شما:</p>
                    {form.questions.map((q, idx) => (
                      <div key={q.id} className="text-slate-400">
                        <span className="text-slate-300 font-medium">{q.text}: </span>
                        <span className="text-blue-300">{simFormAnswers[idx] || 'پاسخ داده نشده'}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
                  >
                    بستن پیش‌نمایش
                  </button>
                </div>
              );
            }

            const currentQ = form.questions[simFormStep];

            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-slate-400 border-b border-white/5 pb-2">
                  <span>سوال {simFormStep + 1} از {qCount}</span>
                  <span className="text-blue-400 font-bold">{form.title}</span>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                  <p className="text-sm text-white font-medium">{currentQ.text}</p>

                  {currentQ.type === 'text' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        id="sim-input-text"
                        placeholder="پاسخ خود را بنویسید..."
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            handleSimFormSubmit(e.currentTarget.value.trim());
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const el = document.getElementById('sim-input-text') as HTMLInputElement;
                          const val = el?.value.trim() || 'متن نمونه پاسخ';
                          handleSimFormSubmit(val);
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        ارسال پاسخ متنی (شبیه‌سازی)
                      </button>
                    </div>
                  )}

                  {currentQ.type === 'number' && (
                    <div className="space-y-2">
                      <input
                        type="number"
                        id="sim-input-num"
                        placeholder="یک عدد وارد کنید..."
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500 text-left dir-ltr"
                        dir="ltr"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            handleSimFormSubmit(e.currentTarget.value.trim());
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const el = document.getElementById('sim-input-num') as HTMLInputElement;
                          const val = el?.value.trim() || '12345';
                          handleSimFormSubmit(val);
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        ارسال عدد (شبیه‌سازی)
                      </button>
                    </div>
                  )}

                  {currentQ.type === 'photo' && (
                    <button
                      onClick={() => handleSimFormSubmit('🖼 [عکس ارسال شد]')}
                      className="w-full py-3 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <ImageIcon size={16} />
                      ارسال عکس (شبیه‌سازی)
                    </button>
                  )}

                  {currentQ.type === 'document' && (
                    <button
                      onClick={() => handleSimFormSubmit('📎 [فایل ارسال شد]')}
                      className="w-full py-3 bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <FileText size={16} />
                      ارسال فایل سند (شبیه‌سازی)
                    </button>
                  )}

                  {currentQ.type === 'video' && (
                    <button
                      onClick={() => handleSimFormSubmit('📹 [ویدیو ارسال شد]')}
                      className="w-full py-3 bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Video size={16} />
                      ارسال ویدیو (شبیه‌سازی)
                    </button>
                  )}

                  {currentQ.type === 'audio' && (
                    <button
                      onClick={() => handleSimFormSubmit('🎙️ [صدا ارسال شد]')}
                      className="w-full py-3 bg-amber-600/20 border border-amber-500/30 text-amber-300 hover:bg-amber-600/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Music size={16} />
                      ارسال پیام صوتی (شبیه‌سازی)
                    </button>
                  )}

                  {currentQ.type === 'location' && (
                    <div className="space-y-3 text-center p-2">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center gap-2 text-xs text-amber-300">
                        <span>📍</span>
                        <span>کاربر موقعیت خودش رو می‌فرسته</span>
                      </div>
                      <button
                        onClick={() => handleSimFormSubmit('📍 موقعیت: Lat: 35.6892, Lng: 51.3890')}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
                      >
                        <span>📍</span>
                        ارسال موقعیت مکانی من (شبیه‌سازی)
                      </button>
                    </div>
                  )}

                  {currentQ.type === 'date' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2 text-xs text-blue-300">
                        <span>📅</span>
                        <span>انتخاب تاریخ توسط کاربر</span>
                      </div>
                      <input
                        type="date"
                        id="sim-input-date"
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => {
                          const el = document.getElementById('sim-input-date') as HTMLInputElement;
                          const val = el?.value || new Date().toISOString().split('T')[0];
                          handleSimFormSubmit(`📅 تاریخ: ${val}`);
                        }}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
                      >
                        تایید و ارسال تاریخ
                      </button>
                    </div>
                  )}

                  {currentQ.type === 'select' && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-400 mb-2">لطفاً یکی از گزینه‌های زیر را انتخاب کنید:</p>
                      {(currentQ.options && currentQ.options.length > 0) ? (
                        <div className="grid grid-cols-1 gap-2">
                          {currentQ.options.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => handleSimFormSubmit(`☑️ ${opt}`)}
                              className="w-full py-2.5 px-3 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-200 rounded-xl text-xs font-medium text-right transition-all flex items-center justify-between"
                            >
                              <span>{opt}</span>
                              <span className="text-[10px] opacity-60">انتخاب ➔</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-3 border border-dashed border-white/10 rounded-xl text-slate-400 text-xs">
                          هیچ گزینه‌ای برای این سوال ثبت نشده است.
                          <button
                            onClick={() => handleSimFormSubmit('☑️ گزینه بدون عنوان')}
                            className="block mx-auto mt-2 text-[11px] text-blue-400 hover:underline"
                          >
                            رد شدن از این سوال
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {currentQ.type === 'checkbox' && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-slate-400 mb-1">یک یا چند گزینه را علامت بزنید و تایید کنید:</p>
                      {(currentQ.options && currentQ.options.length > 0) ? (
                        <FormCheckboxSimulator
                          options={currentQ.options}
                          onSubmit={(selected) => {
                            handleSimFormSubmit(`✅ گزینه‌ها: ${selected.join(', ')}`);
                          }}
                        />
                      ) : (
                        <div className="text-center p-3 border border-dashed border-white/10 rounded-xl text-slate-400 text-xs">
                          هیچ گزینه‌ای برای این سوال ثبت نشده است.
                          <button
                            onClick={() => handleSimFormSubmit('✅ هیچ گزینه‌ای انتخاب نشد')}
                            className="block mx-auto mt-2 text-[11px] text-blue-400 hover:underline"
                          >
                            رد شدن از این سوال
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {previewModal.type === 'link' && (
            <div className="text-center space-y-3 py-4">
              <Globe size={32} className="mx-auto text-blue-400 animate-bounce" />
              <p className="text-xs text-slate-300">انتقال به آدرس اینترنتی:</p>
              <p className="text-xs font-mono bg-black/40 p-2 rounded-lg text-blue-300 dir-ltr truncate">{previewModal.value}</p>
              <button
                onClick={onClose}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                بستن
              </button>
            </div>
          )}

          {previewModal.type === 'inquiry' && (
            <div className="text-center space-y-3 py-4">
              <PhoneCall size={32} className="mx-auto text-emerald-400" />
              <p className="text-xs text-slate-300">درخواست کاتالوگ و استعلام برای کاربر ارسال شد (شبیه‌سازی).</p>
              <button
                onClick={onClose}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                بستن
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
