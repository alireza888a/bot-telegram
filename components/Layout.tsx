
import React, { useState } from 'react';
import { Menu, Home, Settings, Layers, Users, Command, Bell, Search, Moon, Sun, Megaphone, LogOut, Download, AlertTriangle, X, Cloud, UserCog } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, toggleTheme, isDarkMode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'داشبورد', icon: <Home size={20} /> },
    { id: 'broadcast', label: 'پیام همگانی', icon: <Megaphone size={20} /> },
    { id: 'channels', label: 'مدیریت کانال‌ها', icon: <Users size={20} /> },
    { id: 'keyboard', label: 'دکمه‌ساز', icon: <Layers size={20} /> },
    { id: 'commands', label: 'دستورات', icon: <Command size={20} /> },
    { id: 'users', label: 'کاربران ربات', icon: <UserCog size={20} /> },
    { id: 'cloud', label: 'انتشار ابری', icon: <Cloud size={20} /> }, // NEW ITEM
    { id: 'settings', label: 'تنظیمات', icon: <Settings size={20} /> },
  ];

  // Helper function to trigger quick backup
  const performQuickBackup = () => {
        const backupData = {
            meta: { version: "2.5.1", type: "quick_exit_backup", date: new Date().toISOString() },
            data: {
                menus: JSON.parse(localStorage.getItem('kb_menus') || '{}'),
                forms: JSON.parse(localStorage.getItem('kb_forms') || '{}'),
                commands: JSON.parse(localStorage.getItem('bot_commands') || '[]'),
                channels: JSON.parse(localStorage.getItem('saved_channels') || '[]'),
                config: {
                    token: localStorage.getItem('bot_token'),
                    db_channel: localStorage.getItem('bot_db_channel')
                }
            }
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `QuickBackup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
  };

  const handleConfirmExit = (withBackup: boolean) => {
      if (withBackup) {
          performQuickBackup();
          setTimeout(() => {
              // Simulate "Exit" by going to connect page and clearing session UI state if any
              setShowExitModal(false);
              onNavigate('bot-connect');
          }, 1000);
      } else {
          setShowExitModal(false);
          onNavigate('bot-connect');
      }
  };

  return (
    <div className="flex min-h-screen dark:text-white/90 text-slate-800 overflow-hidden">
      
      {/* EXIT MODAL */}
      {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
              <div className="bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                  <div className="p-6 text-center">
                      <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
                          <AlertTriangle size={32}/>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">آیا می‌خواهید خارج شوید؟</h3>
                      <p className="text-slate-400 text-sm mb-6">برای جلوگیری از حذف احتمالی اطلاعات در مرورگر، پیشنهاد می‌کنیم قبل از خروج یک نسخه پشتیبان بگیرید.</p>
                      
                      <div className="flex flex-col gap-3">
                          <button 
                              onClick={() => handleConfirmExit(true)}
                              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-600/20"
                          >
                              <Download size={18}/>
                              بله، دانلود بکاپ و خروج
                          </button>
                          <button 
                              onClick={() => handleConfirmExit(false)}
                              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl font-medium transition-colors"
                          >
                              خیر، فقط خارج شو
                          </button>
                      </div>
                  </div>
                  <div className="bg-black/20 p-3 flex justify-center border-t border-white/5">
                      <button onClick={() => setShowExitModal(false)} className="text-xs text-slate-500 hover:text-white transition-colors">
                          انصراف و بازگشت به پنل
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Sidebar - RTL: Right Side */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} 
        dark:bg-white/5 bg-white/60 backdrop-blur-xl border-l dark:border-white/10 border-white/40 transition-all duration-300 relative flex flex-col z-20 shadow-lg`}
      >
        <div className="p-6 flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-lg flex items-center justify-center shrink-0">
             <BotIcon />
           </div>
           {isSidebarOpen && (
             <h1 className="font-bold text-lg whitespace-nowrap tracking-wide dark:text-white text-slate-800">
               Admin<span className="text-cyan-600 dark:text-cyan-400">Panel</span>
             </h1>
           )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                ${currentPage === item.id 
                  ? 'bg-gradient-to-l from-blue-600/80 to-purple-600/80 shadow-[0_0_20px_rgba(59,130,246,0.5)] text-white' 
                  : 'hover:bg-black/5 dark:hover:bg-white/5 dark:text-white/60 text-slate-600 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              <div className={`${currentPage === item.id ? 'text-white' : 'text-current'} transition-transform group-hover:scale-110`}>
                {item.icon}
              </div>
              
              {isSidebarOpen && (
                <span className="font-medium animate-fade-in">{item.label}</span>
              )}
              
              {/* Active Indicator Strip */}
              {currentPage === item.id && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full shadow-[0_0_10px_white]" />
              )}
            </button>
          ))}
        </nav>
        
        {/* Footer Actions */}
        <div className="p-4 border-t dark:border-white/5 border-black/5 flex flex-col gap-2">
            <button 
                onClick={() => setShowExitModal(true)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden hover:bg-red-500/10 text-red-400`}
            >
                <div className="transition-transform group-hover:scale-110 group-hover:translate-x-1">
                    <LogOut size={20} className="rotate-180" />
                </div>
                {isSidebarOpen && <span className="font-medium animate-fade-in">خروج از پنل</span>}
            </button>
        </div>

        {/* Toggle Sidebar Button */}
        <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute bottom-6 left-6 p-2 rounded-lg dark:bg-white/5 bg-black/5 hover:bg-black/10 dark:hover:bg-white/10 dark:text-white/50 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
            <Menu size={20} />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4 dark:bg-white/5 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border dark:border-white/5 border-white/40 shadow-sm">
             <Search size={18} className="dark:text-white/40 text-slate-400" />
             <input 
                type="text" 
                placeholder="جستجو..." 
                className="bg-transparent border-none outline-none text-sm dark:text-white text-slate-800 dark:placeholder-white/40 placeholder-slate-400 w-48"
             />
          </div>

          <div className="flex items-center gap-4">
             {/* Stats Capsule */}
             <div className="hidden md:flex items-center gap-4 dark:bg-white/5 bg-white/60 backdrop-blur-md px-5 py-2 rounded-full border dark:border-white/5 border-white/40 text-sm shadow-sm">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                   <span className="dark:text-white/80 text-slate-700">سیستم آنلاین</span>
                </div>
                <div className="w-[1px] h-4 dark:bg-white/10 bg-black/10" />
                <span className="dark:text-white/60 text-slate-500">نسخه 2.5.1</span>
             </div>

             {/* Theme Toggle */}
             <button 
                onClick={toggleTheme}
                className="relative p-3 rounded-full dark:hover:bg-white/10 hover:bg-black/5 transition-colors dark:text-white text-slate-700"
             >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>

             <button className="relative p-3 rounded-full dark:hover:bg-white/10 hover:bg-black/5 transition-colors dark:text-white text-slate-700">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
             </button>
             
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 dark:border-white/20 border-white/50 shadow-lg cursor-pointer transform hover:scale-105 transition-transform" />
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 relative">
           {/* Background Decor */}
           <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]">
              <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
           </div>

           {children}
        </div>
      </main>
    </div>
  );
};

const BotIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4Z" fill="white" fillOpacity="0.2"/>
    <path d="M12 6L9 11H15L12 6Z" fill="white"/>
    <path d="M9 13C9 14.1 9.9 15 11 15C12.1 15 13 14.1 13 13C13 11.9 12.1 11 11 11C9.9 11 9 11.9 9 13Z" fill="white"/>
  </svg>
);
