
import React, { useState, useRef, useEffect } from 'react';
import { List, Download, Upload, RefreshCcw, LayoutTemplate, Home, ArrowRight } from 'lucide-react';
import { InlineRow, InlineButton, MediaAttachment, MenuPage, FormConfig, FormQuestion, InquiryConfig, Product } from '../types';
import { suggestButtonLabels } from '../services/geminiService';
import { telegramService } from '../services/telegramService';
import { syncNow } from '../services/cloudSync';

import { FormDesignerModal } from '../components/keyboard-builder/FormDesignerModal';
import { NewProductModal } from '../components/keyboard-builder/NewProductModal';
import { ButtonPreviewModal } from '../components/keyboard-builder/ButtonPreviewModal';
import { MenuSidebar } from '../components/keyboard-builder/MenuSidebar';
import { MenuContentEditorCard } from '../components/keyboard-builder/MenuContentEditorCard';
import { MenuButtonsCard } from '../components/keyboard-builder/MenuButtonsCard';
import { ButtonPropertiesCard } from '../components/keyboard-builder/ButtonPropertiesCard';
import { LiveSimulatorPreview } from '../components/keyboard-builder/LiveSimulatorPreview';

export const KeyboardBuilder: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [token] = useState(localStorage.getItem('bot_token') || '');
  const [dbChannel] = useState(localStorage.getItem('bot_db_channel') || '');
  const [isUploading, setIsUploading] = useState(false);
  
  // 1. Initialize State from LocalStorage (Persistence)
  const [menus, setMenus] = useState<Record<string, MenuPage>>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('kb_menus');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error('Error parsing menus:', e); }
        }
    }
    return {
      'root': {
        id: 'root',
        title: 'منوی اصلی (شروع)',
        content: 'سلام {نام}! به ربات ما خوش آمدید. لطفا یک گزینه را انتخاب کنید 👇',
        media: [],
        rows: []
      }
    };
  });

  const [forms, setForms] = useState<Record<string, FormConfig>>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('kb_forms');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error('Error parsing forms:', e); }
        }
    }
    return {};
  });
  
  // Form Builder Modal State
  const [editingFormId, setEditingFormId] = useState<string | null>(null);

  const [currentMenuId, setCurrentMenuId] = useState<string>('root');
  const [history, setHistory] = useState<string[]>([]);
  const [selectedButton, setSelectedButton] = useState<{rowId: string, btnId: string} | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showMenuSidebar, setShowMenuSidebar] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Preview States
  const [previewInput, setPreviewInput] = useState('');
  const [previewModal, setPreviewModal] = useState<{type: 'link' | 'form' | 'inquiry', value: string} | null>(null);
  // Simulation State for Forms in Preview
  const [simFormStep, setSimFormStep] = useState(0);
  const [simFormAnswers, setSimFormAnswers] = useState<string[]>([]);

  // Quick Product Modal States
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodManualUrl, setProdManualUrl] = useState('');
  const [prodPostConfirmMenuId, setProdPostConfirmMenuId] = useState('');
  const [prodPostOrderFormId, setProdPostOrderFormId] = useState('');
  const [isProdUploading, setIsProdUploading] = useState(false);
  const prodFileInputRef = useRef<HTMLInputElement>(null);

  const getProducts = (): Product[] => {
    try {
      return JSON.parse(localStorage.getItem('bot_products') || '[]');
    } catch {
      return [];
    }
  };

  const getButtonDisplayText = (btn: InlineButton): string => {
    if (btn.type === 'product') {
      if (btn.productId) {
        const products = getProducts();
        const prod = products.find(p => p.id === btn.productId);
        if (prod) {
          return `🛒 ${prod.name} — ${prod.price.toLocaleString('fa-IR')} تومان`;
        }
      }
      return btn.text || '🛒 محصول فروشگاهی';
    }
    if (btn.type === 'ticket' || (btn.type === 'callback' && btn.value === 'support')) {
      return btn.text || '🎫 تیکت پشتیبانی';
    }
    if (btn.type === 'webapp') {
      return btn.text || '🛍 ورود به فروشگاه';
    }
    if (btn.type === 'api') {
      return btn.text || '🔗 فراخوانی API';
    }
    return btn.text;
  };

  const handleProdImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      if (!token || !dbChannel) {
        alert('هشدار: کانال دیتابیس یا توکن ربات تنظیم نشده است.');
        return;
      }
      if (prodImages.length >= 10) {
        alert('حداکثر ۱۰ عکس برای هر محصول می‌توانید آپلود کنید.');
        return;
      }
      setIsProdUploading(true);
      const uploadedList: string[] = [];
      try {
        for (const file of files) {
          if (prodImages.length + uploadedList.length >= 10) break;
          const uploadedId = await telegramService.uploadToDb(token, dbChannel, file, 'image');
          if (uploadedId) {
            uploadedList.push(uploadedId);
          }
        }
        if (uploadedList.length > 0) {
          setProdImages(prev => {
            const next = [...prev, ...uploadedList].slice(0, 10);
            setProdImage(next[0] || '');
            return next;
          });
        } else {
          alert('هشدار: آپلود در کانال دیتابیس ناموفق بود.');
        }
      } catch (err) {
        alert('خطا در ارتباط با تلگرام.');
      } finally {
        setIsProdUploading(false);
        e.target.value = '';
      }
    }
  };

  const handleAddProdManualUrl = () => {
    const trimmed = prodManualUrl.trim();
    if (!trimmed) return;
    if (prodImages.length >= 10) {
      alert('حداکثر ۱۰ عکس برای هر محصول می‌توانید آپلود کنید.');
      return;
    }
    const next = [...prodImages, trimmed].slice(0, 10);
    setProdImages(next);
    setProdImage(next[0] || '');
    setProdManualUrl('');
  };

  const handleRemoveProdImage = (index: number) => {
    const next = prodImages.filter((_, i) => i !== index);
    setProdImages(next);
    setProdImage(next[0] || '');
  };

  const handleQuickProductSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || prodPrice === '') {
      alert('لطفاً نام و قیمت محصول را وارد کنید.');
      return;
    }
    const finalImgs = prodImages.length > 0 ? prodImages : (prodImage ? [prodImage] : []);
    const primaryImg = finalImgs[0] || undefined;

    const newProd: Product = {
      id: 'prod_' + Math.random().toString(36).substr(2, 9),
      name: prodName,
      price: Number(prodPrice),
      description: prodDesc,
      category: prodCategory.trim() || 'عمومی',
      imageUrl: primaryImg,
      imageUrls: finalImgs.length > 0 ? finalImgs : undefined,
      active: true,
      post_confirm_menu_id: prodPostConfirmMenuId || undefined,
      post_order_form_id: prodPostOrderFormId || undefined
    };

    let existing: Product[] = [];
    try {
      existing = JSON.parse(localStorage.getItem('bot_products') || '[]');
    } catch {}

    const updated = [...existing, newProd];
    localStorage.setItem('bot_products', JSON.stringify(updated));
    syncNow();

    if (selectedButton) {
      const formattedText = `🛒 ${newProd.name} — ${newProd.price.toLocaleString('fa-IR')} تومان`;
      updateCurrentButton({
        type: 'product',
        productId: newProd.id,
        text: formattedText
      });
    }

    setProdName('');
    setProdPrice('');
    setProdDesc('');
    setProdCategory('');
    setProdImage('');
    setProdImages([]);
    setProdManualUrl('');
    setProdPostConfirmMenuId('');
    setProdPostOrderFormId('');
    setIsNewProductModalOpen(false);
  };

  // 2. Auto-Save Effects
  useEffect(() => {
    localStorage.setItem('kb_menus', JSON.stringify(menus));
    syncNow();
  }, [menus]);

  useEffect(() => {
    localStorage.setItem('kb_forms', JSON.stringify(forms));
    syncNow();
  }, [forms]);

  const currentMenu = menus[currentMenuId] || menus['root']; // Fallback safety

  // --- VARIABLES ---
  const DYNAMIC_VARS = [
     { label: 'نام کاربر', code: '{first_name}' },
     { label: 'نام خانوادگی', code: '{last_name}' },
     { label: 'یوزرنیم', code: '{username}' },
     { label: 'آیدی عددی', code: '{id}' },
     { label: 'تاریخ', code: '{date}' },
     { label: 'ساعت', code: '{time}' },
  ];

  // --- TEMPLATES ---
  const TEMPLATES: Record<string, { title: string, icon: any, data: { menus: Record<string, MenuPage>, forms: Record<string, FormConfig> } }> = {
     'simple_store': {
        title: 'فروشگاه ساده',
        icon: <LayoutGrid size={18}/>,
        data: {
           menus: {
               'root': {
                  id: 'root',
                  title: 'منوی اصلی فروشگاه',
                  content: 'به فروشگاه ما خوش آمدید! 🛍\nچه کمکی از دست من برمی‌آید؟',
                  media: [],
                  rows: [
                     { id: 'r1', buttons: [{ id: 'b1', text: '🛍 محصولات', type: 'submenu', targetMenuId: 'products' }, { id: 'b2', text: '🛒 سبد خرید', type: 'callback', value: 'cart' }] },
                     { id: 'r2', buttons: [{ id: 'b3', text: '📞 پشتیبانی', type: 'submenu', targetMenuId: 'support' }] }
                  ]
               },
               'products': {
                  id: 'products', parentId: 'root', title: 'لیست محصولات',
                  content: 'دسته بندی مورد نظر را انتخاب کنید:',
                  media: [],
                  rows: [
                     { id: 'pr1', buttons: [{ id: 'pb1', text: '📱 موبایل', type: 'callback', value: 'cat_mobile' }, { id: 'pb2', text: '💻 لپتاپ', type: 'callback', value: 'cat_laptop' }] }
                  ]
               },
               'support': {
                  id: 'support', parentId: 'root', title: 'پشتیبانی',
                  content: 'برای تماس با ما از راه‌های زیر اقدام کنید:',
                  media: [],
                  rows: [
                     { id: 'sr1', buttons: [{ id: 'sb1', text: 'ارسال پیام به ادمین', type: 'link', value: 'https://t.me/admin' }] }
                  ]
               }
           },
           forms: {}
        }
     },
     'support_bot': {
        title: 'ربات پشتیبانی',
        icon: <MessageSquare size={18}/>,
        data: {
           menus: {
               'root': {
                  id: 'root', title: 'منوی اصلی', content: 'سلام {first_name} 👋\nبه مرکز پشتیبانی خوش آمدید.', media: [],
                  rows: [
                     { id: 'r1', buttons: [{ id: 'b1', text: '🎫 ثبت تیکت جدید', type: 'form', value: 'form_ticket' }] },
                     { id: 'r2', buttons: [{ id: 'b2', text: '❓ سوالات متداول', type: 'submenu', targetMenuId: 'faq' }] }
                  ]
               },
               'faq': {
                  id: 'faq', parentId: 'root', title: 'سوالات متداول', content: 'لیست سوالات پرتکرار:', media: [],
                  rows: [
                     { id: 'fr1', buttons: [{ id: 'fb1', text: 'ساعات کاری؟', type: 'callback', value: 'faq_time' }] }
                  ]
               }
           },
           forms: {
               'form_ticket': {
                   id: 'form_ticket',
                   title: 'فرم تماس',
                   adminId: '12345678',
                   questions: [
                       { id: 'q1', text: 'لطفا نام خود را وارد کنید:', type: 'text' },
                       { id: 'q2', text: 'پیام خود را بنویسید:', type: 'text' }
                   ]
               }
           }
        }
     }
  };

  // --- HELPERS ---

  const updateMenu = (menuId: string, updates: Partial<MenuPage>) => {
    setMenus(prev => ({
      ...prev,
      [menuId]: { ...prev[menuId], ...updates }
    }));
  };

  const updateCurrentButton = (updates: Partial<InlineButton>) => {
    if (!selectedButton) return;
    
    const newRows = currentMenu.rows.map(row => {
      if (row.id === selectedButton.rowId) {
        return {
          ...row,
          buttons: row.buttons.map(btn => {
            if (btn.id === selectedButton.btnId) {
              const updatedBtn = { ...btn, ...updates };
              
              if (updates.type === 'submenu' && !btn.targetMenuId) {
                const newMenuId = `menu_${Date.now()}`;
                setMenus(prev => ({
                  ...prev,
                  [newMenuId]: {
                    id: newMenuId,
                    title: `زیر منوی: ${btn.text}`,
                    content: `این محتوای زیر منوی "${btn.text}" است.`,
                    media: [],
                    rows: [],
                    parentId: currentMenuId
                  }
                }));
                updatedBtn.targetMenuId = newMenuId;
              }

              // Initialize form if type changes to form and no value exists
              if (updates.type === 'form') {
                  const formId = btn.value && btn.value.startsWith('form_') ? btn.value : `form_${Date.now()}`;
                  updatedBtn.value = formId;
                  
                  if (!forms[formId]) {
                      setForms(prev => ({
                          ...prev,
                          [formId]: {
                              id: formId,
                              title: `فرم ${btn.text}`,
                              adminId: '',
                              questions: [
                                  { id: 'q1', text: 'سوال اول خود را بنویسید:', type: 'text' }
                              ]
                          }
                      }));
                  }
              }

              // Initialize Inquiry Config
              if (updates.type === 'inquiry' && !btn.inquiryConfig) {
                  updatedBtn.inquiryConfig = {
                      adminId: '',
                      responseText: 'سلام {first_name} عزیز، فایل کاتالوگ پارچه‌ها برای شما ارسال شد. برای نهایی کردن سفارش، لطفا روی دکمه زیر کلیک کرده و با کارشناس ما صحبت کنید.',
                      catalogType: 'document'
                  };
              }

              return updatedBtn;
            }
            return btn;
          })
        };
      }
      return row;
    });

    updateMenu(currentMenuId, { rows: newRows });
  };
  
  const updateInquiryConfig = (updates: Partial<InquiryConfig>) => {
      if (!selectedButton) return;
      const btn = getSelectedBtnObj();
      if (!btn || !btn.inquiryConfig) return;
      
      const newConfig = { ...btn.inquiryConfig, ...updates };
      updateCurrentButton({ inquiryConfig: newConfig });
  };

  const getSelectedBtnObj = () => {
    if (!selectedButton) return null;
    const row = currentMenu.rows.find(r => r.id === selectedButton.rowId);
    return row?.buttons.find(b => b.id === selectedButton.btnId);
  };

  const navigateTo = (menuId: string) => {
    if (menus[menuId]) {
      setHistory(prev => [...prev, currentMenuId]);
      setCurrentMenuId(menuId);
      setSelectedButton(null);
      setPreviewModal(null);
    }
  };

  const navigateBack = () => {
    if (history.length > 0) {
      const prevId = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setCurrentMenuId(prevId);
      setSelectedButton(null);
      setPreviewModal(null);
    } else if (currentMenu.parentId) {
      setCurrentMenuId(currentMenu.parentId);
      setSelectedButton(null);
      setPreviewModal(null);
    }
  };

  // --- PREVIEW LOGIC ---

  const handlePreviewAction = (btn: InlineButton) => {
      switch(btn.type) {
          case 'submenu':
              if (btn.targetMenuId) navigateTo(btn.targetMenuId);
              break;
          case 'link':
              setPreviewModal({ type: 'link', value: btn.value || 'https://google.com' });
              break;
          case 'form':
              setSimFormStep(0);
              setSimFormAnswers([]);
              setPreviewModal({ type: 'form', value: btn.value || '' });
              break;
          case 'inquiry':
              setPreviewModal({ type: 'inquiry', value: 'catalog' });
              break;
          case 'product':
              if (btn.productId) {
                  const prod = getProducts().find(p => p.id === btn.productId);
                  alert(`🛒 محصول "${prod?.name || 'انتخابی'}" به سبد خرید اضافه شد (شبیه‌سازی).`);
              } else {
                  alert('محصولی برای این دکمه انتخاب نشده است.');
              }
              break;
          case 'command':
              setPreviewInput(`/${btn.value || 'start'}`);
              setTimeout(() => {
                  setPreviewInput('');
                  // Simulate sent
              }, 800);
              break;
          case 'api':
              alert(`🔗 فراخوانی API به آدرس:\n${btn.apiUrl || 'آدرسی تنظیم نشده است'}\n(شبیه‌سازی ارسال درخواست POST)`);
              break;
          case 'ticket':
              alert('🎫 جریان ثبت تیکت پشتیبانی (/support) شروع شد (شبیه‌سازی).');
              break;
          default:
              if (btn.value === 'support') {
                  alert('🎫 جریان ثبت تیکت پشتیبانی (/support) شروع شد (شبیه‌سازی).');
              }
              break;
      }
  };

  const handleSimFormSubmit = (answer: string) => {
      if (!previewModal || !previewModal.value) return;
      const form = forms[previewModal.value];
      if (!form) return;

      const newAnswers = [...simFormAnswers, answer];
      setSimFormAnswers(newAnswers);
      setSimFormStep(prev => prev + 1);
  };

  // --- FORM BUILDER LOGIC ---
  const updateForm = (formId: string, updates: Partial<FormConfig>) => {
      setForms(prev => ({
          ...prev,
          [formId]: { ...prev[formId], ...updates }
      }));
  };

  const addQuestion = (formId: string) => {
      const form = forms[formId];
      const newQuestion: FormQuestion = {
          id: `q${Date.now()}`,
          text: 'سوال جدید...',
          type: 'text'
      };
      updateForm(formId, { questions: [...form.questions, newQuestion] });
  };

  const removeQuestion = (formId: string, qId: string) => {
      const form = forms[formId];
      updateForm(formId, { questions: form.questions.filter(q => q.id !== qId) });
  };

  const updateQuestion = (formId: string, qId: string, updates: Partial<FormQuestion>) => {
      const form = forms[formId];
      const newQuestions = form.questions.map(q => q.id === qId ? { ...q, ...updates } : q);
      updateForm(formId, { questions: newQuestions });
  };

  // --- FEATURE ACTIONS ---

  const handleExport = () => {
    const exportData = {
        version: "1.0",
        menus: JSON.parse(JSON.stringify(menus)),
        forms: JSON.parse(JSON.stringify(forms))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "bot_full_structure.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        
        let loadedMenus = {};
        let loadedForms = {};

        // Support both old format (root object) and new format (versioned object)
        if (importedData.menus) {
            loadedMenus = importedData.menus;
            loadedForms = importedData.forms || {};
        } else if (importedData.root) {
            loadedMenus = importedData;
            loadedForms = {};
        }

        if (loadedMenus && Object.keys(loadedMenus).length > 0) {
           // Cleanup auto-nav from older exports if present
           Object.keys(loadedMenus).forEach(key => {
               // @ts-ignore
               loadedMenus[key].rows = loadedMenus[key].rows.filter((r: InlineRow) => !r.id.startsWith('auto_nav_'));
           });

           setMenus(loadedMenus);
           setForms(loadedForms);
           setCurrentMenuId('root');
           setHistory([]);
           alert('ساختار منو و فرم‌ها با موفقیت بارگذاری شد.');
        } else {
           alert('فرمت فایل نامعتبر است.');
        }
      } catch (err) {
        alert('خطا در خواندن فایل JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyTemplate = (templateKey: string) => {
     if (window.confirm('آیا مطمئن هستید؟ تمام منوهای فعلی حذف و قالب جدید جایگزین می‌شود.')) {
        setMenus(TEMPLATES[templateKey].data.menus);
        setForms(TEMPLATES[templateKey].data.forms);
        setCurrentMenuId('root');
        setHistory([]);
        setShowTemplates(false);
     }
  };

  const handleReset = () => {
    if(window.confirm('آیا مطمئن هستید؟ تمام تغییرات ذخیره شده حذف شده و به حالت اولیه برمی‌گردد.')) {
        localStorage.removeItem('kb_menus');
        localStorage.removeItem('kb_forms');
        window.location.reload(); 
    }
  };

  const insertVariable = (variable: string) => {
    const textArea = document.getElementById('message-content') as HTMLTextAreaElement;
    if (textArea) {
        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        const text = currentMenu.content;
        const newText = text.substring(0, start) + variable + text.substring(end);
        updateMenu(currentMenuId, { content: newText });
        setTimeout(() => {
           textArea.focus();
           textArea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    } else {
        updateMenu(currentMenuId, { content: currentMenu.content + ' ' + variable });
    }
  };

  // ... (Row & Button Operations - Add, Remove, Move, Duplicate) ...
  const addRow = (count: number) => {
    const newButtons: InlineButton[] = Array(count).fill(null).map((_, i) => ({
      id: Date.now().toString() + i,
      text: count === 1 ? 'دکمه جدید' : `گزینه ${i + 1}`,
      type: 'callback',
      value: ''
    }));
    updateMenu(currentMenuId, { 
      rows: [...currentMenu.rows, { id: Date.now().toString(), buttons: newButtons }] 
    });
  };

  const addSupportButton = () => {
    const supportBtn: InlineButton = {
      id: Date.now().toString(),
      text: '💬 پشتیبانی',
      type: 'callback',
      value: 'support'
    };
    updateMenu(currentMenuId, {
      rows: [...currentMenu.rows, { id: Date.now().toString(), buttons: [supportBtn] }]
    });
  };

  const removeRow = (rowId: string) => {
    updateMenu(currentMenuId, { 
      rows: currentMenu.rows.filter(r => r.id !== rowId) 
    });
    if (selectedButton?.rowId === rowId) setSelectedButton(null);
  };

  const removeButton = () => {
    if (!selectedButton) return;
    const newRows = currentMenu.rows.map(row => {
      if (row.id === selectedButton.rowId) {
        return {
          ...row,
          buttons: row.buttons.filter(b => b.id !== selectedButton.btnId)
        };
      }
      return row;
    }).filter(row => row.buttons.length > 0);
    updateMenu(currentMenuId, { rows: newRows });
    setSelectedButton(null);
  };

  const moveRowUp = (index: number) => {
    if (index === 0) return;
    const newRows = [...currentMenu.rows];
    const temp = newRows[index];
    newRows[index] = newRows[index - 1];
    newRows[index - 1] = temp;
    updateMenu(currentMenuId, { rows: newRows });
  };

  const moveRowDown = (index: number) => {
    if (index === currentMenu.rows.length - 1) return;
    const newRows = [...currentMenu.rows];
    const temp = newRows[index];
    newRows[index] = newRows[index + 1];
    newRows[index + 1] = temp;
    updateMenu(currentMenuId, { rows: newRows });
  };

  const duplicateRow = (row: InlineRow) => {
    const newButtons = row.buttons.map(b => ({ ...b, id: Date.now() + Math.random().toString() }));
    const newRow = { id: Date.now().toString(), buttons: newButtons };
    updateMenu(currentMenuId, { rows: [...currentMenu.rows, newRow] });
  };

  // --- UPDATED MEDIA UPLOAD (DB CHANNEL) ---
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      
      setIsUploading(true);
      let finalUrl = previewUrl;
      let fileId = undefined;

      if (dbChannel && token) {
          try {
              const uploadedId = await telegramService.uploadToDb(token, dbChannel, file, type);
              if (uploadedId) {
                  finalUrl = uploadedId;
                  fileId = uploadedId;
                  console.log(`File uploaded to DB. ID: ${uploadedId}`);
              } else {
                  alert('هشدار: آپلود در کانال دیتابیس ناموفق بود. لطفا بررسی کنید که ربات در کانال دیتابیس "ادمین" باشد و آیدی کانال صحیح وارد شده باشد (شروع با -100).');
              }
          } catch (err) {
              console.error('Failed to upload to DB channel, falling back to local blob', err);
              alert('خطا در ارتباط با تلگرام برای آپلود فایل. لطفا اتصال اینترنت و VPN را بررسی کنید.');
          }
      } else {
          alert('هشدار: کانال دیتابیس تنظیم نشده است. فایل فقط به صورت موقت در مرورگر نمایش داده می‌شود و در تلگرام ارسال نخواهد شد.');
      }

      const newMedia: MediaAttachment = {
        id: Date.now().toString(),
        type,
        name: file.name,
        url: finalUrl,
        previewUrl: previewUrl,
        fileId: fileId
      };
      
      updateMenu(currentMenuId, { media: [...currentMenu.media, newMedia] });
      setIsUploading(false);
      e.target.value = '';
    }
  };

    const handleCatalogUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setIsUploading(true);
          
          if (!dbChannel || !token) {
              alert("برای استفاده از این قابلیت، ابتدا باید کانال دیتابیس را در تنظیمات وصل کنید.");
              setIsUploading(false);
              return;
          }

          const res = await telegramService.uploadMediaToChannel(token, dbChannel, file);
          setIsUploading(false);

          if (res.success && res.fileId) {
              updateInquiryConfig({ catalogFileId: res.fileId });
              alert("کاتالوگ با موفقیت در دیتابیس آپلود و ذخیره شد.");
          } else {
              alert("خطا در آپلود کاتالوگ: " + (res.error || "ناشناخته"));
          }
          e.target.value = "";
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative pb-12">
      <input type="file" ref={fileInputRef} onChange={handleMediaUpload} className="hidden" accept="image/*,video/*,audio/*" />

<FormDesignerModal
        editingFormId={editingFormId}
        forms={forms}
        setEditingFormId={setEditingFormId}
        updateForm={updateForm}
        updateQuestion={updateQuestion}
        addQuestion={addQuestion}
        removeQuestion={removeQuestion}
      />

      <NewProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onSubmit={handleQuickProductSave}
        prodName={prodName}
        setProdName={setProdName}
        prodPrice={prodPrice}
        setProdPrice={setProdPrice}
        prodDesc={prodDesc}
        setProdDesc={setProdDesc}
        prodCategory={prodCategory}
        setProdCategory={setProdCategory}
        prodPostConfirmMenuId={prodPostConfirmMenuId}
        setProdPostConfirmMenuId={setProdPostConfirmMenuId}
        prodPostOrderFormId={prodPostOrderFormId}
        setProdPostOrderFormId={setProdPostOrderFormId}
        prodImages={prodImages}
        handleRemoveProdImage={handleRemoveProdImage}
        prodFileInputRef={prodFileInputRef}
        handleProdImageUpload={handleProdImageUpload}
        isProdUploading={isProdUploading}
        prodManualUrl={prodManualUrl}
        setProdManualUrl={setProdManualUrl}
        handleAddProdManualUrl={handleAddProdManualUrl}
        menus={menus}
        forms={forms}
      />

      <ButtonPreviewModal
        previewModal={previewModal}
        onClose={() => { setPreviewModal(null); setSimFormStep(0); setSimFormAnswers([]); }}
        forms={forms}
        simFormStep={simFormStep}
        simFormAnswers={simFormAnswers}
        handleSimFormSubmit={handleSimFormSubmit}
      />

      <MenuSidebar
        show={showMenuSidebar}
        onClose={() => setShowMenuSidebar(false)}
        menus={menus}
        currentMenuId={currentMenuId}
        onSelectMenu={(id) => {
          setCurrentMenuId(id);
          setShowMenuSidebar(false);
          setHistory([]);
        }}
      />
      
      {/* --- EDITOR COLUMN --- */}
      <div className="space-y-6 overflow-y-auto pl-2 pr-1 pb-20 custom-scrollbar">
         {/* Top Actions Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button 
              onClick={() => setShowMenuSidebar(!showMenuSidebar)}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
            >
              <List size={16} />
              منوها
            </button>
            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
            <button 
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 rounded-lg text-sm text-purple-400 transition-colors whitespace-nowrap"
            >
              <LayoutTemplate size={16} />
              قالب‌ها
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors whitespace-nowrap"
              title="ذخیره فایل JSON با ناوبری خودکار"
            >
              <Download size={16} />
              خروجی
            </button>
            <label className="flex items-center gap-2 px-3 py-2 bg-green-600/10 hover:bg-green-600/20 border border-green-500/30 rounded-lg text-sm text-green-400 transition-colors whitespace-nowrap cursor-pointer">
              <Upload size={16} />
              بازیابی
              <input type="file" accept=".json" onChange={handleImport} ref={fileInputRef} className="hidden" />
            </label>
            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors whitespace-nowrap"
              title="حذف تمام اطلاعات ذخیره شده و شروع مجدد"
            >
              <RefreshCcw size={16} />
            </button>
        </div>

        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm dark:text-white/60 text-slate-500 bg-white/50 dark:bg-black/20 p-2 rounded-xl">
           <button 
             onClick={() => { setCurrentMenuId('root'); setHistory([]); }}
             className="hover:text-blue-500 p-1 rounded-md transition-colors"
           >
             <Home size={16} />
           </button>
           <span>/</span>
           {history.map((histId, idx) => (
             <React.Fragment key={histId}>
               <span 
                 onClick={() => {
                   const newHistory = history.slice(0, idx);
                   setHistory(newHistory);
                   setCurrentMenuId(histId);
                 }}
                 className="cursor-pointer hover:text-blue-500 truncate max-w-[100px]"
               >
                 {menus[histId]?.title || '...'}
               </span>
               <span>/</span>
             </React.Fragment>
           ))}
           <span className="font-bold dark:text-white text-slate-800 truncate max-w-[150px]">
             {currentMenu.title}
           </span>
           {history.length > 0 && (
               <button onClick={navigateBack} className="mr-auto flex items-center gap-1 text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-lg">
                 <ArrowRight size={12} />
                 بازگشت
               </button>
            )}
         </div>
         
         <MenuContentEditorCard
           currentMenu={currentMenu}
           currentMenuId={currentMenuId}
           updateMenu={updateMenu}
           insertVariable={insertVariable}
           handleSuggest={handleSuggest}
           loadingSuggestions={loadingSuggestions}
           isUploading={isUploading}
           handleMediaUpload={handleMediaUpload}
           removeMedia={removeMedia}
         />
         
         <MenuButtonsCard
           addRow={addRow}
           addSupportButton={addSupportButton}
           currentMenu={currentMenu}
           currentMenuId={currentMenuId}
           moveRowUp={moveRowUp}
           moveRowDown={moveRowDown}
           setSelectedButton={setSelectedButton}
           selectedButton={selectedButton}
           getButtonDisplayText={getButtonDisplayText}
           duplicateRow={duplicateRow}
           removeRow={removeRow}
         />
         
         <ButtonPropertiesCard
           selectedButton={selectedButton}
           getSelectedBtnObj={getSelectedBtnObj}
           removeButton={removeButton}
           getButtonDisplayText={getButtonDisplayText}
           updateCurrentButton={updateCurrentButton}
           getProducts={getProducts}
           navigateTo={navigateTo}
           setEditingFormId={setEditingFormId}
           setIsNewProductModalOpen={setIsNewProductModalOpen}
           getDisplayableImageUrl={getDisplayableImageUrl}
           isUploading={isUploading}
           handleCatalogUpload={handleCatalogUpload}
           updateInquiryConfig={updateInquiryConfig}
         />
       </div>
       
       <LiveSimulatorPreview
         currentMenu={currentMenu}
         handlePreviewAction={handlePreviewAction}
         getButtonDisplayText={getButtonDisplayText}
         navigateTo={navigateTo}
         navigateBack={navigateBack}
       />

     </div>
   );
};


export default KeyboardBuilder;
