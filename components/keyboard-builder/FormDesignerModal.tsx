import React from 'react';
import { ListChecks, X, UserCog, Trash2, Plus, Check } from 'lucide-react';
import { FormConfig, FormQuestion } from '../../types';

interface FormDesignerModalProps {
  editingFormId: string | null;
  forms: Record<string, FormConfig>;
  setEditingFormId: (id: string | null) => void;
  updateForm: (formId: string, updates: Partial<FormConfig>) => void;
  updateQuestion: (formId: string, qId: string, updates: Partial<FormQuestion>) => void;
  addQuestion: (formId: string) => void;
  removeQuestion: (formId: string, qId: string) => void;
}

export const FormDesignerModal: React.FC<FormDesignerModalProps> = ({
  editingFormId,
  forms,
  setEditingFormId,
  updateForm,
  updateQuestion,
  addQuestion,
  removeQuestion,
}) => {
  if (!editingFormId || !forms[editingFormId]) return null;

  const currentForm = forms[editingFormId];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ListChecks size={24} className="text-green-400" /> طراحی سوالات فرم
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              شناسه فرم: <span className="font-mono text-white/50">{editingFormId}</span>
            </p>
          </div>
          <button
            onClick={() => setEditingFormId(null)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          <div className="bg-slate-800/40 border border-white/10 rounded-xl p-4 space-y-4">
            <div>
              <label className="text-sm text-slate-300 font-bold mb-1.5 block">
                عنوان فرم
              </label>
              <input
                type="text"
                value={currentForm.title || ''}
                onChange={(e) => updateForm(editingFormId, { title: e.target.value })}
                placeholder="مثلاً: فرم ثبت نام / نظرسنجی"
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 border-t border-white/5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!currentForm.visibleInMiniApp}
                  onChange={(e) => updateForm(editingFormId, { visibleInMiniApp: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-white/20"
                />
                <span className="text-sm font-medium text-white">نمایش در Mini App</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed bg-white/5 p-2.5 rounded-lg border border-white/5">
                فقط فرمهایی که همهی سوالاتشون از نوع متن، عدد، تاریخ، انتخاب از لیست یا چکباکس باشه، داخل Mini App قابلنمایشن؛ فرمهایی که سوال عکس/ویدیو/فایل/موقعیت مکانی دارن، حتی با این سوییچ فعال، فقط داخل خود چت جواب داده میشن.
              </p>
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <label className="text-sm text-blue-300 font-bold mb-2 block flex items-center gap-2">
              <UserCog size={16} /> مقصد ارسال پاسخ‌ها (آیدی ادمین)
            </label>
            <input
              type="text"
              value={currentForm.adminId}
              onChange={(e) => updateForm(editingFormId, { adminId: e.target.value })}
              placeholder="مثلا: 123456789 یا @admin_username"
              className="w-full bg-black/20 border border-blue-500/30 rounded-lg p-3 text-white text-left dir-ltr placeholder-white/30 focus:outline-none focus:border-blue-400"
              dir="ltr"
            />
            <p className="text-[10px] text-blue-300/60 mt-2">* پاسخ‌های کاربران به صورت خودکار به این آیدی در تلگرام فوروارد می‌شود. (قابلیت پاسخگویی)</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-sm text-slate-400 font-bold">لیست سوالات</label>
              <span className="text-xs text-slate-500">{currentForm.questions.length} سوال</span>
            </div>

            {currentForm.questions.map((q, idx) => (
              <div key={q.id} className="group flex flex-col md:flex-row items-start gap-3 bg-white/5 border border-white/5 rounded-xl p-3 hover:border-white/20 transition-all">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-slate-400 mt-2 shrink-0">
                  {idx + 1}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <textarea
                    value={q.text}
                    onChange={(e) => updateQuestion(editingFormId, q.id, { text: e.target.value })}
                    className="w-full bg-transparent border-b border-white/10 outline-none text-white text-sm resize-none h-10 py-1"
                    placeholder="متن سوال را اینجا بنویسید..."
                  />

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-500">نوع پاسخ:</span>
                    <select
                      value={q.type}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        updateQuestion(editingFormId, q.id, {
                          type: newType,
                          options: (newType === 'select' || newType === 'checkbox') ? (q.options || []) : undefined
                        });
                      }}
                      className="bg-black/20 text-xs text-white border border-white/10 rounded p-1 outline-none"
                    >
                      <option value="text">✏️ متن</option>
                      <option value="number">🔢 عدد</option>
                      <option value="photo">🖼 عکس</option>
                      <option value="document">📎 فایل</option>
                      <option value="video">📹 ویدیو</option>
                      <option value="audio">🎙️ صدا</option>
                      <option value="location">📍 موقعیت مکانی</option>
                      <option value="date">📅 تاریخ</option>
                      <option value="select">☑️ انتخاب از لیست (تک‌گزینه‌ای)</option>
                      <option value="checkbox">✅ انتخاب چندگزینه‌ای (چک‌باکس)</option>
                    </select>
                  </div>

                  {(q.type === 'select' || q.type === 'checkbox') && (
                    <div className="mt-3 p-3 bg-black/20 border border-white/10 rounded-xl space-y-2">
                      <label className="text-xs text-slate-300 font-medium block">
                        گزینه‌های قابل انتخاب ({q.type === 'select' ? 'تک‌گزینه‌ای' : 'چندگزینه‌ای'}):
                      </label>
                      <div className="space-y-1.5">
                        {(q.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 text-xs text-white">
                            <span className="flex-1 text-right">{opt}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = (q.options || []).filter((_, i) => i !== optIdx);
                                updateQuestion(editingFormId, q.id, { options: newOpts });
                              }}
                              className="text-red-400 hover:text-red-300 p-0.5 rounded hover:bg-white/10 transition-colors"
                              title="حذف گزینه"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {(q.options || []).length === 0 && (
                          <p className="text-[11px] text-slate-500 italic">هنوز گزینه‌ای تعریف نشده است.</p>
                        )}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          id={`new-opt-${q.id}`}
                          placeholder="عنوان گزینه جدید..."
                          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const val = input.value.trim();
                              if (val) {
                                const cur = q.options || [];
                                updateQuestion(editingFormId, q.id, { options: [...cur, val] });
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById(`new-opt-${q.id}`) as HTMLInputElement;
                            if (input && input.value.trim()) {
                              const cur = q.options || [];
                              updateQuestion(editingFormId, q.id, { options: [...cur, input.value.trim()] });
                              input.value = '';
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0"
                        >
                          افزودن
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeQuestion(editingFormId, q.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all self-start md:self-center"
                  title="حذف سوال"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button
              onClick={() => addQuestion(editingFormId)}
              className="w-full py-3 border-2 border-dashed border-white/10 hover:border-white/30 rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2 text-sm font-bold"
            >
              <Plus size={16} />
              افزودن سوال جدید
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-white/5 rounded-b-2xl flex justify-end">
          <button
            onClick={() => setEditingFormId(null)}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl shadow-lg shadow-green-600/20 transition-all font-bold flex items-center gap-2"
          >
            <Check size={18} />
            ذخیره و بستن
          </button>
        </div>
      </div>
    </div>
  );
};
