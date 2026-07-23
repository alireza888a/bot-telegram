
import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Plus, Trash2, Link as LinkIcon, Edit3, Eye, Sparkles, LayoutGrid, Music, Video, Image as ImageIcon, MessageSquare, Layers, Command, FileText, ArrowLeft, ArrowRight, CornerUpRight, Home, Copy, ArrowUp, ArrowDown, List, Reply, Download, Upload, FileJson, LayoutTemplate, Zap, Check, Lock, Globe, Terminal, X, Send, UserCog, ListChecks, RefreshCcw, Cloud, PhoneCall, FileInput, File, AlertTriangle, ShoppingBag, DollarSign } from 'lucide-react';
import { InlineRow, InlineButton, ButtonActionType, MediaAttachment, MenuPage, FormConfig, FormQuestion, InquiryConfig, Product } from '../types';
import { suggestButtonLabels } from '../services/geminiService';
import { telegramService } from '../services/telegramService';
import { syncNow } from '../services/cloudSync';

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
    return btn.text;
  };

  const handleProdImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!token || !dbChannel) {
        alert('هشدار: کانال دیتابیس یا توکن ربات تنظیم نشده است.');
        return;
      }
      setIsProdUploading(true);
      try {
        const uploadedId = await telegramService.uploadToDb(token, dbChannel, file, 'image');
        if (uploadedId) {
          setProdImage(uploadedId);
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

  const handleQuickProductSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || prodPrice === '') {
      alert('لطفاً نام و قیمت محصول را وارد کنید.');
      return;
    }
    const newProd: Product = {
      id: 'prod_' + Math.random().toString(36).substr(2, 9),
      name: prodName,
      price: Number(prodPrice),
      description: prodDesc,
      category: prodCategory.trim() || 'عمومی',
      imageUrl: prodImage || undefined,
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
          default:
              // Callback
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
              alert('برای استفاده از این قابلیت، ابتدا باید کانال دیتابیس را در تنظیمات وصل کنید.');
              setIsUploading(false);
              return;
          }

          try {
              // Usually catalogs are PDFs (Documents) or Images
              const type = file.type.includes('image') ? 'image' : 'document';
              const fileId = await telegramService.uploadToDb(token, dbChannel, file, type);
              
              if (fileId) {
                  updateInquiryConfig({ 
                      catalogFileId: fileId,
                      catalogFileName: file.name,
                      catalogType: type
                  });
              } else {
                  alert('آپلود فایل در کانال دیتابیس با خطا مواجه شد.');
              }
          } catch (err) {
              console.error(err);
              alert('خطا در ارتباط با تلگرام.');
          }
          setIsUploading(false);
          e.target.value = '';
      }
  };

  const removeMedia = (id: string) => {
    updateMenu(currentMenuId, { media: currentMenu.media.filter(m => m.id !== id) });
  };

  const handleSuggest = async () => {
    if (!currentMenu.content) return;
    setLoadingSuggestions(true);
    const result = await suggestButtonLabels(currentMenu.content);
    if(result.length > 0) {
        const btns = result.slice(0, 2).map((text, i) => ({
             id: Date.now() + i + '', text, type: 'callback' as const
        }));
        updateMenu(currentMenuId, {
            rows: [...currentMenu.rows, { id: Date.now().toString(), buttons: btns }]
        });
    }
    setLoadingSuggestions(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-6 h-[calc(100vh-140px)] animate-fade-in pb-10 relative">
      
      {/* ... (Modal code remains same) ... */}
      {editingFormId && forms[editingFormId] && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
              {/* ... (Form Designer Modal Content - Unchanged) ... */}
              <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                  {/* Header */}
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5 rounded-t-2xl">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><ListChecks size={24} className="text-green-400"/> طراحی سوالات فرم</h3>
                        <p className="text-xs text-slate-400 mt-1">شناسه فرم: <span className="font-mono text-white/50">{editingFormId}</span></p>
                      </div>
                      <button onClick={() => setEditingFormId(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"><X size={20}/></button>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                          <label className="text-sm text-blue-300 font-bold mb-2 block flex items-center gap-2">
                              <UserCog size={16}/> مقصد ارسال پاسخ‌ها (آیدی ادمین)
                          </label>
                          <input 
                              type="text" 
                              value={forms[editingFormId].adminId}
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
                              <span className="text-xs text-slate-500">{forms[editingFormId].questions.length} سوال</span>
                          </div>
                          
                          {forms[editingFormId].questions.map((q, idx) => (
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
                                      
                                      <div className="flex items-center gap-2">
                                          <span className="text-[10px] text-slate-500">نوع پاسخ:</span>
                                          <select 
                                            value={q.type}
                                            onChange={(e) => updateQuestion(editingFormId, q.id, { type: e.target.value as any })}
                                            className="bg-black/20 text-xs text-white border border-white/10 rounded p-1 outline-none"
                                          >
                                              <option value="text">✏️ متن</option>
                                              <option value="number">🔢 عدد</option>
                                              <option value="photo">🖼 عکس</option>
                                              <option value="document">📎 فایل</option>
                                          </select>
                                      </div>
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
      )}
      
      {/* Quick Product Creation Modal */}
      {isNewProductModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
                  <div className="flex justify-between items-center p-5 border-b border-white/5 bg-[#0f172a]">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <ShoppingBag className="text-blue-500" size={20} />
                          افزودن محصول جدید به فروشگاه
                      </h3>
                      <button
                          onClick={() => setIsNewProductModalOpen(false)}
                          className="text-slate-400 hover:text-white transition-colors"
                      >
                          <X size={20} />
                      </button>
                  </div>

                  <form onSubmit={handleQuickProductSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                      <div>
                          <label className="block text-xs text-slate-400 mb-1.5">نام محصول <span className="text-red-500">*</span></label>
                          <input
                              type="text"
                              value={prodName}
                              onChange={e => setProdName(e.target.value)}
                              placeholder="مثال: اشتراک یک‌ماهه طلایی"
                              required
                              className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                          />
                      </div>

                      <div>
                          <label className="block text-xs text-slate-400 mb-1.5">قیمت (به تومان) <span className="text-red-500">*</span></label>
                          <input
                              type="number"
                              value={prodPrice}
                              onChange={e => setProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="مثال: ۵۰۰۰۰"
                              required
                              className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors text-right"
                              dir="ltr"
                          />
                      </div>

                      <div>
                          <label className="block text-xs text-slate-400 mb-1.5">توضیحات محصول</label>
                          <textarea
                              value={prodDesc}
                              onChange={e => setProdDesc(e.target.value)}
                              placeholder="توضیحات مربوط به محصول..."
                              rows={3}
                              className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl p-4 text-sm outline-none focus:border-blue-500 transition-colors"
                          />
                      </div>

                      <div>
                          <label className="block text-xs text-slate-400 mb-1.5">دسته‌بندی (اختیاری)</label>
                          <input
                              type="text"
                              value={prodCategory}
                              onChange={e => setProdCategory(e.target.value)}
                              placeholder="مثال: دیجیتال، فیزیکی، سرویس"
                              className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                          />
                      </div>

                      <div>
                          <label className="block text-xs text-slate-400 mb-1.5">منوی بعد از تایید (اختیاری)</label>
                          <select
                              value={prodPostConfirmMenuId}
                              onChange={e => setProdPostConfirmMenuId(e.target.value)}
                              className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                          >
                              <option value="">پیش‌فرض سراسری (تنظیمات)</option>
                              {Object.entries(menus).map(([id, menu]) => (
                                  <option key={id} value={id}>
                                      {menu.title || menu.content || id} ({id})
                                  </option>
                              ))}
                          </select>
                      </div>

                      <div>
                          <label className="block text-xs text-slate-400 mb-1.5">فرم بعد از تایید (اختیاری)</label>
                          <select
                              value={prodPostOrderFormId}
                              onChange={e => setProdPostOrderFormId(e.target.value)}
                              className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                          >
                              <option value="">پیش‌فرض سراسری (تنظیمات)</option>
                              {Object.entries(forms).map(([id, form]) => (
                                  <option key={id} value={id}>
                                      {form.title || id} ({id})
                                  </option>
                              ))}
                          </select>
                          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                              اگر اینجا چیزی انتخاب نکنید، همان تنظیم پیش‌فرضی که در صفحه تنظیمات گذاشته‌اید استفاده می‌شود. برای هر محصول می‌توانید جدا مشخص کنید.
                          </p>
                      </div>

                      <div>
                          <label className="block text-xs text-slate-400 mb-1.5">تصویر محصول (آپلود مستقیم یا لینک)</label>
                          <div className="space-y-2">
                              <div className="flex gap-2">
                                  <input
                                      type="file"
                                      accept="image/*"
                                      ref={prodFileInputRef}
                                      onChange={handleProdImageUpload}
                                      className="hidden"
                                  />
                                  <button
                                      type="button"
                                      onClick={() => prodFileInputRef.current?.click()}
                                      disabled={isProdUploading}
                                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/20 transition-all text-xs font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                  >
                                      {isProdUploading ? <span>⏳ در حال آپلود...</span> : <span>📤 آپلود عکس از گالری</span>}
                                  </button>
                              </div>
                              <input
                                  type="text"
                                  value={prodImage}
                                  onChange={e => setProdImage(e.target.value)}
                                  placeholder="یا لینک مستقیم عکس: https://..."
                                  className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 transition-colors text-right"
                                  dir="ltr"
                              />
                          </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                          <button
                              type="button"
                              onClick={() => setIsNewProductModalOpen(false)}
                              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition-colors"
                          >
                              انصراف
                          </button>
                          <button
                              type="submit"
                              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
                          >
                              <Check size={16} />
                              ذخیره و انتخاب برای دکمه
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* --- MENU SIDEBAR --- */}
      {showMenuSidebar && (
         <div className="absolute inset-y-0 right-0 w-64 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 p-4 shadow-2xl animate-fade-in overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-white flex items-center gap-2"><List size={18}/> لیست منوها</h3>
               <button onClick={() => setShowMenuSidebar(false)}><ArrowRight className="text-white/50 hover:text-white" size={20}/></button>
            </div>
            <div className="space-y-2">
               {Object.values(menus).map((m: MenuPage) => (
                  <button 
                     key={m.id}
                     onClick={() => { setCurrentMenuId(m.id); setShowMenuSidebar(false); setHistory([]); }}
                     className={`w-full text-right p-3 rounded-xl text-sm transition-colors border ${
                        currentMenuId === m.id 
                        ? 'bg-blue-600/20 border-blue-500/50 text-white' 
                        : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-300'
                     }`}
                  >
                     {m.title}
                     {m.id === 'root' && <span className="mr-2 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">خانه</span>}
                  </button>
               ))}
            </div>
         </div>
      )}
      
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
        
        {/* Editor Main Content */}
        <GlassCard title={`ویرایش محتوای: ${currentMenu.title}`}>
          <div className="space-y-4">
             {/* ... (Title and Caption inputs - Unchanged) ... */}
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
                          <Cloud size={12}/> در حال آپلود به فضای ابری...
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
                       {media.type === 'audio' && <div className="w-full h-full bg-orange-500/20 flex items-center justify-center text-orange-400"><Music size={20}/></div>}
                       
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
        
        {/* ... (Keyboard Grid Builder & Button Config - Unchanged) ... */}
        <GlassCard title="دکمه‌های این منو">
           <div className="flex flex-wrap gap-2 mb-6">
              {[1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  onClick={() => addRow(num)}
                  className="flex-1 py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 text-blue-500 dark:text-blue-300 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 min-w-[70px]"
                >
                  <div className="flex gap-0.5">
                    {Array(num).fill(0).map((_, i) => (
                      <div key={i} className="w-3 h-3 bg-current rounded-[2px]" />
                    ))}
                  </div>
                  <span className="text-xs font-bold">{num} تایی</span>
                </button>
              ))}
              <button
                onClick={addSupportButton}
                className="py-3 px-3 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 text-emerald-500 dark:text-emerald-300 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-xs font-bold"
                title="افزودن مستقیم دکمه پشتیبانی"
              >
                <div className="flex items-center gap-1">
                  <span>💬</span>
                </div>
                <span>پشتیبانی</span>
              </button>
           </div>
           
           <div className="space-y-3">
             {currentMenu.rows.length === 0 && (
               <div className="text-center py-6 dark:text-white/20 text-slate-400 border-2 border-dashed dark:border-white/10 border-slate-300 rounded-xl mb-4">
                 هنوز دکمه‌ای اضافه نکرده‌اید.
               </div>
             )}
             
             {currentMenu.rows.map((row, idx) => (
               <div key={row.id} className="relative group">
                   {/* Row Content */}
                   <div className="flex gap-2 pr-8">
                    {/* Row Controls */}
                    <div className="absolute top-1/2 -translate-y-1/2 -right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveRowUp(idx)} disabled={idx === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-20"><ArrowUp size={14}/></button>
                        <button onClick={() => moveRowDown(idx)} disabled={idx === currentMenu.rows.length - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-20"><ArrowDown size={14}/></button>
                    </div>

                    {row.buttons.map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setSelectedButton({ rowId: row.id, btnId: btn.id })}
                        className={`
                          flex-1 py-3 px-3 rounded-lg text-sm truncate transition-all
                          flex items-center justify-center gap-2 relative overflow-hidden
                          ${selectedButton?.btnId === btn.id 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-[1.02] ring-2 ring-white/20' 
                            : 'dark:bg-white/5 bg-white border border-slate-200 dark:border-white/10 dark:hover:bg-white/10 hover:bg-slate-50 dark:text-white/80 text-slate-700'
                          }
                          ${btn.color === 'blue' ? 'border-r-4 border-r-blue-500' : ''}
                          ${btn.color === 'green' ? 'border-r-4 border-r-green-500' : ''}
                          ${btn.color === 'red' ? 'border-r-4 border-r-red-500' : ''}
                          ${btn.color === 'gold' ? 'border-r-4 border-r-amber-400' : ''}
                          ${btn.color === 'orange' ? 'border-r-4 border-r-orange-500' : ''}
                        `}
                      >
                         {/* Icons */}
                         {btn.type === 'submenu' && (
                           <div className="absolute top-0 right-0 w-3 h-3 border-t-[3px] border-l-[3px] border-orange-500/50 rounded-tl-sm" />
                         )}
                         
                         {btn.type === 'link' && <LinkIcon size={12} className="opacity-50" />}
                         {btn.type === 'submenu' && <Layers size={12} className="opacity-50 text-orange-400" />}
                         {btn.type === 'product' && <ShoppingBag size={12} className="opacity-50 text-blue-400" />}
                         {btn.type === 'form' && <FileText size={12} className="opacity-50" />}
                         {btn.type === 'command' && <Command size={12} className="opacity-50" />}
                         {btn.type === 'inquiry' && <PhoneCall size={12} className="opacity-50 text-green-400" />}
                         
                         {getButtonDisplayText(btn)}
                      </button>
                    ))}
                  </div>
                  {/* Right Side Actions */}
                  <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-1 backdrop-blur">
                     <button 
                       onClick={() => duplicateRow(row)}
                       className="p-1.5 text-blue-400 hover:text-blue-300"
                       title="کپی ردیف"
                     >
                       <Copy size={16} />
                     </button>
                     <button 
                       onClick={() => removeRow(row.id)}
                       className="p-1.5 text-red-400 hover:text-red-500"
                       title="حذف"
                     >
                       <Trash2 size={16} />
                     </button>
                  </div>
               </div>
             ))}
             
             {/* Auto Nav Footer - VISUAL INDICATOR FOR USER */}
             {currentMenuId !== 'root' && (
                <div className="relative opacity-70 mt-4 border-t border-dashed dark:border-white/10 border-slate-300 pt-4">
                    <div className="text-[10px] dark:text-slate-400 text-slate-500 mb-2 flex items-center gap-2">
                    <Lock size={12}/> دکمه‌های ناوبری (سیستم به صورت خودکار اضافه می‌کند)
                    </div>
                    <div className="flex gap-2 cursor-not-allowed">
                        <div className="flex-1 py-3 px-2 rounded-lg text-sm dark:bg-white/5 bg-slate-100 border dark:border-white/5 border-slate-200 dark:text-slate-500 text-slate-400 text-center flex items-center justify-center gap-2">🏠 منوی اصلی</div>
                        <div className="flex-1 py-3 px-2 rounded-lg text-sm dark:bg-white/5 bg-slate-100 border dark:border-white/5 border-slate-200 dark:text-slate-500 text-slate-400 text-center flex items-center justify-center gap-2">🔙 بازگشت</div>
                    </div>
                </div>
             )}
           </div>
        </GlassCard>
        
        {/* Button Config Panel */}
        {selectedButton && getSelectedBtnObj() && (
          <GlassCard 
            title="ویژگی‌های دکمه" 
            className="animate-slide-up border-blue-500/30"
            action={
              <button 
                onClick={removeButton}
                className="flex items-center gap-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 size={14}/> حذف دکمه
              </button>
            }
          >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                   <label className="text-xs dark:text-white/50 text-slate-500 mb-1 block">عنوان دکمه</label>
                   {getSelectedBtnObj()!.type === 'product' ? (
                      <div>
                         <input 
                            type="text" 
                            disabled
                            value={getButtonDisplayText(getSelectedBtnObj()!)}
                            className="w-full dark:bg-white/5 bg-slate-200 border dark:border-white/10 border-slate-300 px-3 py-2 rounded-lg text-sm dark:text-slate-300 text-slate-600 font-medium cursor-not-allowed"
                         />
                         <p className="text-[11px] text-blue-400/90 mt-1 flex items-center gap-1">
                            <span>💡</span>
                            <span>این متن خودکار و همیشه براساس قیمت واقعی محصول بهروزه — نیازی به ویرایش نداره.</span>
                         </p>
                      </div>
                   ) : (
                      <input 
                         type="text" 
                         value={getSelectedBtnObj()!.text}
                         onChange={(e) => updateCurrentButton({ text: e.target.value })}
                         className="w-full bg-transparent border-b border-white/20 focus:border-blue-500 px-2 py-1 outline-none dark:text-white text-slate-800"
                      />
                   )}
                </div>

                <div>
                   <label className="text-xs dark:text-white/50 text-slate-500 mb-1 block">نوع عملکرد</label>
                   <select 
                      value={getSelectedBtnObj()!.type}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        if (newType === 'product') {
                          const products = getProducts();
                          const firstProd = products[0];
                          if (firstProd) {
                            updateCurrentButton({
                              type: 'product',
                              productId: firstProd.id,
                              text: `🛒 ${firstProd.name} — ${firstProd.price.toLocaleString('fa-IR')} تومان`
                            });
                          } else {
                            updateCurrentButton({
                              type: 'product',
                              text: '🛒 انتخاب محصول...'
                            });
                          }
                        } else {
                          updateCurrentButton({ type: newType });
                        }
                      }}
                      className="w-full dark:bg-black/20 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-lg p-2 text-sm outline-none dark:text-white text-slate-800"
                   >
                      <option value="callback">نمایش پیام ساده</option>
                      <option value="submenu">زیر منو (دکمه‌های تو در تو)</option>
                      <option value="product">🛒 محصول فروشگاهی</option>
                      <option value="link">لینک وب‌سایت (Url)</option>
                      <option value="form">فرم دریافت اطلاعات</option>
                      <option value="inquiry">📞 استعلام و خرید (ارسال کاتالوگ)</option>
                      <option value="command">اجرای دستور (Command)</option>
                   </select>
                </div>

                <div>
                   <label className="text-xs dark:text-white/50 text-slate-500 mb-1 block">رنگ دکمه (ویژه تلگرام جدید 🎨)</label>
                   <select 
                      value={getSelectedBtnObj()!.color || 'default'}
                      onChange={(e) => updateCurrentButton({ color: e.target.value as any })}
                      className="w-full dark:bg-black/20 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-lg p-2 text-sm outline-none dark:text-white text-slate-800"
                   >
                      <option value="default">شیشه‌ای پیش‌فرض (تاریک/آبی)</option>
                      <option value="blue">🔵 آبی اقیانوسی (روشن)</option>
                      <option value="green">🟢 سبز زمردی (پذیرش/موفقیت)</option>
                      <option value="red">🔴 قرمز یاقوتی (لغو/هشدار)</option>
                      <option value="gold">🟡 طلایی ستاره‌ای (پرایم/ستاره تلگرام)</option>
                      <option value="orange">🟠 نارنجی پرانرژی (خرید/لینک ویژه)</option>
                   </select>
                   <p className="text-[10px] text-amber-500/90 mt-1 leading-relaxed">
                      ⚠️ رنگ‌های طلایی و نارنجی فقط در پیش‌نمایش پنل دیده می‌شوند؛ تلگرام به صورت واقعی فقط آبی، سبز و قرمز را پشتیبانی می‌کند.
                   </p>
                </div>

                <div>
                   {getSelectedBtnObj()!.type === 'submenu' ? (
                      <div className="mt-5">
                         <button 
                            onClick={() => {
                               if (getSelectedBtnObj()!.targetMenuId) {
                                  navigateTo(getSelectedBtnObj()!.targetMenuId!);
                               }
                            }}
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white p-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                         >
                            <CornerUpRight size={16} />
                            ویرایش محتوای زیر منو
                         </button>
                      </div>
                   ) : getSelectedBtnObj()!.type === 'form' ? (
                       <div className="mt-5">
                           <button 
                               onClick={() => setEditingFormId(getSelectedBtnObj()!.value || '')}
                               className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                           >
                               <ListChecks size={16} />
                               📝 طراحی سوالات فرم
                           </button>
                           <p className="text-[10px] text-slate-500 mt-2 text-center">شناسه فرم: {getSelectedBtnObj()!.value}</p>
                       </div>
                   ) : getSelectedBtnObj()!.type === 'product' ? (
                       <div className="mt-2 space-y-3 col-span-1 md:col-span-2 bg-white/5 p-4 rounded-xl border border-white/10">
                           <div className="flex items-center justify-between">
                               <label className="text-xs font-bold text-white flex items-center gap-1.5">
                                   <ShoppingBag size={15} className="text-blue-400" />
                                   انتخاب محصول مرتبط با این دکمه
                               </label>
                               <button
                                   type="button"
                                   onClick={() => setIsNewProductModalOpen(true)}
                                   className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all font-medium"
                               >
                                   <Plus size={14} />
                                   افزودن محصول جدید
                               </button>
                           </div>

                           <div className="max-h-56 overflow-y-auto space-y-2 custom-scrollbar pr-1 pt-1">
                               {getProducts().length === 0 ? (
                                   <div className="bg-black/20 border border-dashed border-white/10 rounded-xl p-4 text-center space-y-2">
                                       <p className="text-xs text-slate-400">هیچ محصولی هنوز ثبت نشده است.</p>
                                       <button
                                           type="button"
                                           onClick={() => setIsNewProductModalOpen(true)}
                                           className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"
                                       >
                                           + ساخت اولین محصول
                                       </button>
                                   </div>
                               ) : (
                                   getProducts().map((prod) => {
                                       const isSelected = getSelectedBtnObj()!.productId === prod.id;
                                       return (
                                           <div
                                               key={prod.id}
                                               onClick={() => {
                                                   updateCurrentButton({
                                                       productId: prod.id,
                                                       text: `🛒 ${prod.name} — ${prod.price.toLocaleString('fa-IR')} تومان`
                                                   });
                                               }}
                                               className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                                   isSelected
                                                       ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                                                       : 'bg-black/20 border-white/5 hover:bg-white/10 text-slate-300'
                                               }`}
                                           >
                                               <div className="flex items-center gap-3">
                                                   <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                       {prod.imageUrl && prod.imageUrl.trim() !== '' && (prod.imageUrl.startsWith('http') || prod.imageUrl.startsWith('blob:') || prod.imageUrl.startsWith('data:')) ? (
                                                           <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                                                       ) : (
                                                           <ShoppingBag size={18} className="text-blue-400" />
                                                       )}
                                                   </div>
                                                   <div>
                                                       <h5 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h5>
                                                       <p className="text-[10px] text-blue-400 font-medium mt-0.5">
                                                           {prod.price.toLocaleString('fa-IR')} تومان
                                                           {prod.category && <span className="text-slate-400 mr-2">({prod.category})</span>}
                                                       </p>
                                                   </div>
                                               </div>
                                               {isSelected && (
                                                   <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                                                       <Check size={12} />
                                                   </div>
                                               )}
                                           </div>
                                       );
                                   })
                               )}
                           </div>
                       </div>
                   ) : getSelectedBtnObj()!.type === 'inquiry' ? (
                       <div className="mt-2 space-y-3 bg-white/5 p-3 rounded-xl border border-white/5 col-span-2 md:col-span-2">
                           <div>
                               <label className="text-xs text-slate-400 mb-1 block">آیدی ادمین فروش (جهت دریافت لید)</label>
                               <input 
                                   value={getSelectedBtnObj()!.inquiryConfig?.adminId || ''}
                                   onChange={e => updateInquiryConfig({ adminId: e.target.value })}
                                   className="w-full bg-black/20 border border-white/10 rounded p-2 text-xs text-white dir-ltr"
                                   placeholder="123456789"
                               />
                           </div>
                           <div>
                               <label className="text-xs text-slate-400 mb-1 block">فایل کاتالوگ (PDF یا عکس)</label>
                               <div className="flex gap-2 items-center">
                                   <label className="flex-1 cursor-pointer bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded p-2 text-xs flex items-center justify-center gap-2 transition-colors">
                                       {isUploading ? <Cloud className="animate-bounce" size={14}/> : <Upload size={14}/>}
                                       {isUploading ? 'در حال آپلود...' : 'آپلود کاتالوگ در دیتابیس'}
                                       <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleCatalogUpload} disabled={isUploading} />
                                   </label>
                                   {getSelectedBtnObj()!.inquiryConfig?.catalogFileId && (
                                       <div className="text-xs text-green-400 flex items-center gap-1">
                                           <Check size={14}/> فایل ذخیره شد
                                       </div>
                                   )}
                               </div>
                           </div>
                           <div>
                               <label className="text-xs text-slate-400 mb-1 block">متن پاسخ خودکار به مشتری</label>
                               <textarea 
                                   value={getSelectedBtnObj()!.inquiryConfig?.responseText || ''}
                                   onChange={e => updateInquiryConfig({ responseText: e.target.value })}
                                   className="w-full h-20 bg-black/20 border border-white/10 rounded p-2 text-xs text-white resize-none"
                               />
                           </div>
                       </div>
                   ) : (
                     <>
                        <label className="text-xs dark:text-white/50 text-slate-500 mb-1 block flex items-center gap-1">
                            {getSelectedBtnObj()!.type === 'link' && <><Globe size={12}/> آدرس اینترنتی (https)</>}
                            {getSelectedBtnObj()!.type === 'command' && <><Terminal size={12}/> نام دستور (بدون اسلش)</>}
                            {getSelectedBtnObj()!.type === 'callback' && 'مقدار دکمه (Callback Data)'}
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={getSelectedBtnObj()!.value || ''}
                                onChange={(e) => updateCurrentButton({ value: e.target.value })}
                                placeholder={
                                    getSelectedBtnObj()!.type === 'link' ? 'https://google.com' :
                                    getSelectedBtnObj()!.type === 'command' ? 'start' : 'data_123'
                                }
                                className="w-full dark:bg-black/20 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-lg p-2 pl-8 text-sm outline-none dark:text-white text-slate-800 text-left dir-ltr"
                                dir="ltr"
                            />
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50">
                                {getSelectedBtnObj()!.type === 'link' && <LinkIcon size={14}/>}
                                {getSelectedBtnObj()!.type === 'command' && <span className="text-xs font-mono">/</span>}
                            </div>
                        </div>
                     </>
                   )}
                </div>
             </div>
          </GlassCard>
        )}
      </div>
      
      {/* ... Preview Column ... */}
      <div className="relative flex flex-col items-center pt-8">
          {/* ... (Unchanged Preview UI) ... */}
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

    </div>
  );
};
