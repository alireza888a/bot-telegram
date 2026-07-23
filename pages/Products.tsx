import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Plus, Trash2, Edit, ShoppingBag, CheckCircle, X, DollarSign, Image as ImageIcon, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { Product } from '../types';
import { telegramService } from '../services/telegramService';
import { syncNow } from '../services/cloudSync';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bot_products') || '[]');
    } catch {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);
  const [category, setCategory] = useState('');
  const [postConfirmMenuId, setPostConfirmMenuId] = useState('');
  const [postOrderFormId, setPostOrderFormId] = useState('');

  const getKbMenus = (): Record<string, { id?: string; title?: string; content?: string }> => {
    try {
      return JSON.parse(localStorage.getItem('kb_menus') || '{}');
    } catch {
      return {};
    }
  };

  const getKbForms = (): Record<string, { id?: string; title?: string }> => {
    try {
      return JSON.parse(localStorage.getItem('kb_forms') || '{}');
    } catch {
      return {};
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const token = localStorage.getItem('bot_token') || '';
      const dbChannel = localStorage.getItem('bot_db_channel') || '';

      if (!token || !dbChannel) {
        alert('هشدار: کانال دیتابیس یا توکن ربات تنظیم نشده است. ابتدا از بخش تنظیمات ربات، توکن و کانال دیتابیس را ست کنید.');
        return;
      }

      setIsUploading(true);
      try {
        const uploadedId = await telegramService.uploadToDb(token, dbChannel, file, 'image');
        if (uploadedId) {
          setImageUrl(uploadedId);
          console.log(`Product image uploaded to DB. ID: ${uploadedId}`);
        } else {
          alert('هشدار: آپلود در کانال دیتابیس ناموفق بود. لطفا بررسی کنید که ربات در کانال دیتابیس "ادمین" باشد و آیدی کانال صحیح وارد شده باشد (شروع با -100).');
        }
      } catch (err) {
        console.error('Failed to upload product image to DB channel', err);
        alert('خطا در ارتباط با تلگرام برای آپلود فایل. لطفا اتصال اینترنت و VPN را بررسی کنید.');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('bot_products', JSON.stringify(products));
    syncNow();
  }, [products]);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setDescription('');
    setImageUrl('');
    setActive(true);
    setCategory('');
    setPostConfirmMenuId('');
    setPostOrderFormId('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price);
    setDescription(product.description);
    setImageUrl(product.imageUrl || '');
    setActive(product.active);
    setCategory(product.category || '');
    setPostConfirmMenuId(product.post_confirm_menu_id || '');
    setPostOrderFormId(product.post_order_form_id || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === '') {
      alert('لطفاً نام و قیمت محصول را وارد کنید.');
      return;
    }

    if (editingProduct) {
      // Edit existing
      setProducts(products.map(p => p.id === editingProduct.id ? {
        ...p,
        name,
        price: Number(price),
        description,
        imageUrl: imageUrl || undefined,
        active,
        category: category.trim() || 'عمومی',
        post_confirm_menu_id: postConfirmMenuId || undefined,
        post_order_form_id: postOrderFormId || undefined
      } : p));
    } else {
      // Create new
      const newProduct: Product = {
        id: 'prod_' + Math.random().toString(36).substr(2, 9),
        name,
        price: Number(price),
        description,
        imageUrl: imageUrl || undefined,
        active,
        category: category.trim() || 'عمومی',
        post_confirm_menu_id: postConfirmMenuId || undefined,
        post_order_form_id: postOrderFormId || undefined
      };
      setProducts([...products, newProduct]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('آیا از حذف این محصول اطمینان دارید؟')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const toggleActiveStatus = (product: Product) => {
    setProducts(products.map(p => p.id === product.id ? { ...p, active: !p.active } : p));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-800 flex items-center gap-2">
            <ShoppingBag className="text-blue-500" />
            مدیریت محصولات فروشگاه
          </h2>
          <p className="text-xs dark:text-white/50 text-slate-500 mt-1">
            محصولات فروشگاه تلگرامی خود را از این قسمت مدیریت، ویرایش و اضافه کنید.
          </p>
          <p className="text-xs text-blue-400/90 font-medium mt-1">
            💡 محصولات رو می‌تونی مستقیم داخل دکمه‌ساز هم اضافه یا انتخاب کنی.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all font-medium text-sm"
        >
          <Plus size={18} />
          افزودن محصول جدید
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <ShoppingBag size={64} className="text-slate-400 opacity-40 animate-pulse" />
          <h3 className="text-lg font-bold dark:text-white text-slate-700">هیچ محصولی ثبت نشده است</h3>
          <p className="text-slate-400 max-w-md text-sm">
            شما هنوز محصولی به کاتالوگ فروشگاه خود اضافه نکرده‌اید. با کلیک بر روی دکمه بالا، اولین محصول خود را ثبت کنید.
          </p>
          <button
            onClick={openAddModal}
            className="mt-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/30 px-4 py-2 rounded-xl text-sm transition-all"
          >
            افزودن اولین محصول
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <GlassCard key={product.id} className="relative flex flex-col justify-between overflow-hidden group">
              <div>
                {/* Product Image */}
                <div className="relative h-48 -mx-6 -mt-6 mb-4 bg-slate-900/40 border-b dark:border-white/5 border-black/5 flex items-center justify-center p-4 overflow-hidden text-center">
                  {product.imageUrl && product.imageUrl.trim() !== '' ? (
                    (!product.imageUrl.trim().startsWith('http') && !product.imageUrl.trim().startsWith('blob:') && !product.imageUrl.trim().startsWith('data:')) ? (
                      <div className="flex flex-col items-center gap-2 text-blue-400 p-4">
                        <ImageIcon size={32} className="animate-pulse" />
                        <span className="text-xs font-medium leading-relaxed">📷 عکس آپلودشده (فقط توی تلگرام قابل مشاهده)</span>
                        <span className="text-[10px] text-slate-500 font-mono break-all line-clamp-1">{product.imageUrl}</span>
                      </div>
                    ) : (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <ImageIcon size={36} />
                      <span className="text-xs">بدون تصویر</span>
                    </div>
                  )}
                  {/* Status Badge */}
                  <span
                    className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      product.active
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}
                  >
                    {product.active ? 'فعال' : 'غیرفعال'}
                  </span>
                  {/* Category Badge */}
                  <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {product.category || 'عمومی'}
                  </span>
                </div>

                {/* Product Metadata */}
                <div className="space-y-2">
                  <h3 className="text-lg font-bold dark:text-white text-slate-800 line-clamp-1">{product.name}</h3>
                  <div className="flex items-center gap-1.5 text-blue-500 font-bold text-sm">
                    <DollarSign size={16} />
                    <span>{product.price.toLocaleString('fa-IR')} تومان</span>
                  </div>
                  <p className="text-xs dark:text-slate-400 text-slate-600 line-clamp-3 min-h-[48px]">
                    {product.description || 'بدون توضیحات.'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t dark:border-white/5 border-black/5 flex items-center justify-between">
                <button
                  onClick={() => toggleActiveStatus(product)}
                  className={`flex items-center gap-1.5 text-xs transition-colors py-1.5 px-2.5 rounded-lg border ${
                    product.active
                      ? 'text-green-500 bg-green-500/5 hover:bg-green-500/10 border-green-500/20'
                      : 'text-slate-400 bg-slate-400/5 hover:bg-slate-400/10 border-slate-400/10'
                  }`}
                >
                  {product.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  <span>{product.active ? 'فعال' : 'غیرفعال'}</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20 transition-colors"
                    title="ویرایش محصول"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                    title="حذف محصول"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-white/5 bg-[#0f172a]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag className="text-blue-500" size={20} />
                {editingProduct ? 'ویرایش محصول' : 'افزودن محصول جدید'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">نام محصول <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="مثال: اشتراک یک‌ماهه طلایی"
                  required
                  className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">قیمت (به تومان) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="مثال: ۵۰۰۰۰"
                  required
                  className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors text-right"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">توضیحات محصول</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="توضیحات مربوط به محصول، ویژگی‌ها، نحوه دریافت و غیره..."
                  rows={3}
                  className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl p-4 text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">تصویر محصول (آپلود مستقیم یا آدرس اینترنتی)</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/20 transition-all text-sm font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? (
                        <span>⏳ در حال آپلود...</span>
                      ) : (
                        <span>📤 آپلود عکس از گالری</span>
                      )}
                    </button>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center justify-center"
                        title="حذف عکس"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="یا آدرس عکس را اینجا وارد کنید: https://..."
                    className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors text-right text-xs"
                    dir="ltr"
                  />
                  {imageUrl && imageUrl.trim() !== '' && !imageUrl.trim().startsWith('http') && !imageUrl.trim().startsWith('blob:') && !imageUrl.trim().startsWith('data:') && (
                    <p className="text-[10px] text-blue-400 flex items-center gap-1 bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
                      <CheckCircle size={12} />
                      <span>عکس با شناسه تلگرام با موفقیت تنظیم شد.</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">دسته‌بندی (اختیاری)</label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="مثال: اشتراک‌ها، فیزیکی، عمومی"
                  className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">منوی بعد از تایید (اختیاری)</label>
                <select
                  value={postConfirmMenuId}
                  onChange={e => setPostConfirmMenuId(e.target.value)}
                  className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">پیش‌فرض سراسری (تنظیمات)</option>
                  {Object.entries(getKbMenus()).map(([id, menu]) => (
                    <option key={id} value={id}>
                      {menu.title || menu.content || id} ({id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">فرم بعد از تایید (اختیاری)</label>
                <select
                  value={postOrderFormId}
                  onChange={e => setPostOrderFormId(e.target.value)}
                  className="w-full bg-[#0f172a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">پیش‌فرض سراسری (تنظیمات)</option>
                  {Object.entries(getKbForms()).map(([id, form]) => (
                    <option key={id} value={id}>
                      {form.title || id} ({id})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  اگر اینجا چیزی انتخاب نکنید، همان تنظیم پیش‌فرضی که در صفحه تنظیمات گذاشته‌اید استفاده می‌شود. برای هر محصول می‌توانید جدا مشخص کنید.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-sm font-bold text-white">وضعیت نمایش محصول</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">در صورت غیرفعال بودن، در فروشگاه نمایش داده نمی‌شود.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    active ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      active ? '-translate-x-6' : '-translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
                >
                  <Check size={16} />
                  {editingProduct ? 'ذخیره تغییرات' : 'افزودن به محصولات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
