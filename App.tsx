
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { BotConnect } from './pages/BotConnect';
import { KeyboardBuilder } from './pages/KeyboardBuilder';
import { Channels } from './pages/Channels';
import { Broadcast } from './pages/Broadcast';
import { Commands } from './pages/Commands';
import { Support } from './pages/Support';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';
import { Products } from './pages/Products';
import { Orders } from './pages/Orders';
import { BotEngine } from './components/BotEngine'; 
import { useCloudAutoSave } from './hooks/useCloudAutoSave';

const App: React.FC = () => {
  // Persist Current Page
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('last_page') || 'dashboard';
    }
    return 'dashboard';
  });
  
  // Call cloud autosave hook
  useCloudAutoSave(currentPage);
  
  // Theme Management
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
       return localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('last_page', currentPage);
  }, [currentPage]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'bot-connect':
        return <BotConnect />;
      case 'keyboard':
        return <KeyboardBuilder />;
      case 'channels':
        return <Channels onNavigate={setCurrentPage} />;
      case 'broadcast':
        return <Broadcast />;
      case 'commands':
        return <Commands />;
      case 'users':
        return <Users />;
      case 'products':
        return <Products />;
      case 'orders':
        return <Orders />;
      case 'support':
        return <Support />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <>
      <BotEngine /> {/* Runs globally */}
      <Layout 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
        toggleTheme={toggleTheme}
        isDarkMode={theme === 'dark'}
      >
        {renderPage()}
      </Layout>
    </>
  );
};

export default App;
