import React from 'react';
import { List, ArrowRight } from 'lucide-react';
import { MenuPage } from '../../types';

interface MenuSidebarProps {
  showMenuSidebar: boolean;
  setShowMenuSidebar: (show: boolean) => void;
  menus: Record<string, MenuPage>;
  currentMenuId: string;
  setCurrentMenuId: (id: string) => void;
  setHistory: (history: string[]) => void;
}

export const MenuSidebar: React.FC<MenuSidebarProps> = ({
  showMenuSidebar,
  setShowMenuSidebar,
  menus,
  currentMenuId,
  setCurrentMenuId,
  setHistory,
}) => {
  if (!showMenuSidebar) return null;

  return (
    <div className="absolute inset-y-0 right-0 w-64 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 p-4 shadow-2xl animate-fade-in overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <List size={18} /> لیست منوها
        </h3>
        <button onClick={() => setShowMenuSidebar(false)}>
          <ArrowRight className="text-white/50 hover:text-white" size={20} />
        </button>
      </div>
      <div className="space-y-2">
        {Object.values(menus).map((m: MenuPage) => (
          <button
            key={m.id}
            onClick={() => {
              setCurrentMenuId(m.id);
              setShowMenuSidebar(false);
              setHistory([]);
            }}
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
  );
};
