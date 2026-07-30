import React from 'react';
import { ShoppingBag, Package, MessageSquare, FileText, Image as ImageIcon, Bell, Calendar } from 'lucide-react';
import { MiniAppModule } from '../../types';

export interface BottomNavigationProps {
  enabledModules: MiniAppModule[];
  activeTab: MiniAppModule;
  setActiveTab: (tab: MiniAppModule) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  enabledModules,
  activeTab,
  setActiveTab
}) => {
  if (!enabledModules || enabledModules.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#121826]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 shadow-2xl">
      <div className="max-w-2xl mx-auto flex items-center justify-around">
        {enabledModules.includes('shop') && (
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'shop' 
                ? 'text-blue-400 font-bold bg-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag size={18} className={activeTab === 'shop' ? 'scale-110' : ''} />
            <span className="text-[10px] mt-1">فروشگاه</span>
          </button>
        )}

        {enabledModules.includes('orders') && (
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'orders' 
                ? 'text-blue-400 font-bold bg-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package size={18} className={activeTab === 'orders' ? 'scale-110' : ''} />
            <span className="text-[10px] mt-1">سفارش‌ها</span>
          </button>
        )}

        {enabledModules.includes('support') && (
          <button
            onClick={() => setActiveTab('support')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'support' 
                ? 'text-blue-400 font-bold bg-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={18} className={activeTab === 'support' ? 'scale-110' : ''} />
            <span className="text-[10px] mt-1">پشتیبانی</span>
          </button>
        )}

        {enabledModules.includes('forms') && (
          <button
            onClick={() => setActiveTab('forms')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'forms' 
                ? 'text-blue-400 font-bold bg-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={18} className={activeTab === 'forms' ? 'scale-110' : ''} />
            <span className="text-[10px] mt-1">فرم‌ها</span>
          </button>
        )}

        {enabledModules.includes('gallery') && (
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'gallery' 
                ? 'text-blue-400 font-bold bg-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon size={18} className={activeTab === 'gallery' ? 'scale-110' : ''} />
            <span className="text-[10px] mt-1">گالری</span>
          </button>
        )}

        {enabledModules.includes('announcements') && (
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'announcements' 
                ? 'text-blue-400 font-bold bg-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell size={18} className={activeTab === 'announcements' ? 'scale-110' : ''} />
            <span className="text-[10px] mt-1">اعلانات</span>
          </button>
        )}

        {enabledModules.includes('booking') && (
          <button
            onClick={() => setActiveTab('booking')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeTab === 'booking' 
                ? 'text-cyan-400 font-bold bg-cyan-600/10' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar size={18} className={activeTab === 'booking' ? 'scale-110' : ''} />
            <span className="text-[10px] mt-1">نوبت‌دهی</span>
          </button>
        )}
      </div>
    </nav>
  );
};
