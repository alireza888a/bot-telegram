import React from 'react';
import { FileText, RefreshCw, Loader2, AlertTriangle, ArrowRight, CheckCircle2, Send } from 'lucide-react';

export interface MiniAppFormQuestion {
  id?: string;
  text: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | string;
  options?: string[];
}

export interface MiniAppForm {
  id: string;
  title?: string;
  questions: MiniAppFormQuestion[];
  visibleInMiniApp?: boolean;
}

export interface FormsTabProps {
  selectedForm: MiniAppForm | null;
  setSelectedForm: (form: MiniAppForm | null) => void;
  formValues: Record<number, any>;
  setFormValues: (values: Record<number, any>) => void;
  formSubmitting: boolean;
  formSuccessMessage: string | null;
  setFormSuccessMessage: (msg: string | null) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  formsList: MiniAppForm[];
  formsLoading: boolean;
  formsError: string | null;
  fetchForms: () => void;
}

export const FormsTab: React.FC<FormsTabProps> = ({
  selectedForm,
  setSelectedForm,
  formValues,
  setFormValues,
  formSubmitting,
  formSuccessMessage,
  setFormSuccessMessage,
  handleFormSubmit,
  formsList,
  formsLoading,
  formsError,
  fetchForms
}) => {
  return (
    <div className="space-y-4 animate-fade-in max-w-lg mx-auto">
      {selectedForm ? (
        <div className="bg-[#151c2c]/80 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedForm(null);
                  setFormSuccessMessage(null);
                  setFormValues({});
                }}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
                title="بازگشت به لیست فرم‌ها"
              >
                <ArrowRight size={18} />
              </button>
              <h2 className="text-sm font-bold text-white line-clamp-1">
                {selectedForm.title || 'فرم آنلاین'}
              </h2>
            </div>
            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
              {selectedForm.questions ? selectedForm.questions.length : 0} سوال
            </span>
          </div>

          {formSuccessMessage ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-fade-in">
              <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-emerald-300">{formSuccessMessage}</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedForm(null);
                  setFormSuccessMessage(null);
                  setFormValues({});
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
              >
                بازگشت به لیست فرم‌ها
              </button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {selectedForm.questions.map((q, i) => (
                <div key={i} className="space-y-2 bg-black/20 border border-white/5 p-3.5 rounded-xl">
                  <label className="block text-xs font-medium text-slate-200">
                    {i + 1}. {q.text}
                  </label>

                  {q.type === 'number' ? (
                    <input
                      type="number"
                      value={formValues[i] || ''}
                      onChange={(e) => setFormValues({ ...formValues, [i]: e.target.value })}
                      placeholder="پاسخ عددی..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  ) : q.type === 'date' ? (
                    <input
                      type="date"
                      value={formValues[i] || ''}
                      onChange={(e) => setFormValues({ ...formValues, [i]: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  ) : q.type === 'select' ? (
                    <select
                      value={formValues[i] || ''}
                      onChange={(e) => setFormValues({ ...formValues, [i]: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                      required
                    >
                      <option value="">لطفاً یک گزینه انتخاب کنید...</option>
                      {(q.options || []).map((opt, oIdx) => (
                        <option key={oIdx} value={opt} className="bg-slate-900 text-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : q.type === 'checkbox' ? (
                    <div className="space-y-2 pt-1">
                      {(q.options || []).map((opt, oIdx) => {
                        const currentArr: string[] = Array.isArray(formValues[i]) ? formValues[i] : [];
                        const isChecked = currentArr.includes(opt);
                        return (
                          <label
                            key={oIdx}
                            className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer bg-black/30 p-2.5 rounded-xl border border-white/5 hover:border-white/20 transition-all"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...currentArr, opt]
                                  : currentArr.filter((item) => item !== opt);
                                setFormValues({ ...formValues, [i]: next });
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-white/20"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formValues[i] || ''}
                      onChange={(e) => setFormValues({ ...formValues, [i]: e.target.value })}
                      placeholder="پاسخ خود را بنویسید..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-3 bg-gradient-to-l from-blue-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 mt-4"
              >
                {formSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>در حال ارسال...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>ارسال فرم</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText size={18} className="text-emerald-400" />
              <span>فرم‌های آنلاین</span>
            </h2>
            <button
              onClick={fetchForms}
              disabled={formsLoading}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={13} className={formsLoading ? 'animate-spin' : ''} />
              <span>بروزرسانی</span>
            </button>
          </div>

          {formsLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-6 space-y-3">
              <Loader2 size={32} className="text-emerald-500 animate-spin" />
              <p className="text-xs text-slate-400">در حال دریافت فرم‌ها...</p>
            </div>
          ) : formsError ? (
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-2">
              <AlertTriangle size={32} className="text-red-400 mx-auto" />
              <p className="text-xs text-red-300">{formsError}</p>
            </div>
          ) : formsList.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-3 my-8">
              <FileText size={44} className="text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">فعلاً فرمی برای پر کردن نیست.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formsList.map((form) => (
                <div
                  key={form.id}
                  onClick={() => {
                    setSelectedForm(form);
                    setFormValues({});
                    setFormSuccessMessage(null);
                  }}
                  className="bg-[#151c2c]/80 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] backdrop-blur-sm flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {form.title || 'فرم بدون عنوان'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {form.questions ? `${form.questions.length} سوال` : 'بدون سوال'}
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <span>پر کردن فرم</span>
                    <span>➔</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
