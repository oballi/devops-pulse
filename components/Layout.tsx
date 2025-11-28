import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Search, Edit, LogOut, LayoutDashboard, Moon, Sun } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onHomeClick: () => void;
  onLoginClick: () => void;
  onAdminClick: () => void;
  onLogoutClick: () => void;
  onWriteClick: () => void;
  onAboutClick: () => void;
  onSearch?: (query: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, theme, toggleTheme, onHomeClick, onLoginClick, onAdminClick, onLogoutClick, onWriteClick, onAboutClick, onSearch }) => {
  const [searchValue, setSearchValue] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
        onSearch(searchValue);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-dark-bg transition-colors duration-300">
      {/* Navbar */}
      <header className="border-b border-gray-100 dark:border-dark-border sticky top-0 z-50 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-sm transition-all duration-300">
        <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onHomeClick} className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center transform group-hover:rotate-3 transition-transform duration-300">
                <Terminal size={24} strokeWidth={2.5} />
              </div>
              <span className="font-sans text-xl font-bold tracking-tight text-gray-900 dark:text-white hidden md:block">
                  omer.in
              </span>
            </button>
          </div>

          <nav className="flex items-center gap-4 md:gap-6">
            <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                <button onClick={onAboutClick} className="hover:text-black dark:hover:text-white transition-colors">Hakkımda</button>
            </div>
            
            <div className="hidden md:flex items-center gap-1 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-card px-3 py-2 rounded-full border border-gray-100 dark:border-dark-border w-64 focus-within:ring-2 focus-within:ring-gray-200 dark:focus-within:ring-gray-700 transition-all">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Ara..." 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400 dark:placeholder-gray-500 font-sans text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Theme Toggle */}
            <button 
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {user ? (
                <>
                    <button 
                        onClick={onWriteClick}
                        className="hidden md:flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                    >
                        <Edit size={18} />
                        <span>Yaz</span>
                    </button>
                    
                    {/* User Dropdown / Menu */}
                    <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-dark-border ml-2 relative" ref={userMenuRef}>
                         <button 
                            onClick={onAdminClick}
                            className="hidden md:block text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-medium transition-colors"
                         >
                            {user.name || user.username || 'Admin'}
                         </button>
                         <button 
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                         >
                             <img 
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name || user.username}`} 
                                alt="User" 
                                className="w-full h-full object-cover" 
                             />
                         </button>
                         
                         {/* Dropdown Menu */}
                         {isUserMenuOpen && (
                             <div className="absolute right-0 top-12 w-56 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-xl rounded-xl py-2 z-50 animate-scale-in">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
                                </div>
                                <div className="py-1">
                                    <button 
                                        onClick={() => { onAdminClick(); setIsUserMenuOpen(false); }} 
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-border flex items-center gap-3 transition-colors"
                                    >
                                        <LayoutDashboard size={18} className="text-gray-400" /> 
                                        <span>Admin Paneli</span>
                                    </button>
                                    <button 
                                        onClick={() => { onWriteClick(); setIsUserMenuOpen(false); }} 
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-border flex items-center gap-3 transition-colors md:hidden"
                                    >
                                        <Edit size={18} className="text-gray-400" /> 
                                        <span>Yeni Yazı</span>
                                    </button>
                                </div>
                                <div className="border-t border-gray-100 dark:border-dark-border pt-1">
                                    <button 
                                        onClick={() => { onLogoutClick(); setIsUserMenuOpen(false); }} 
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 transition-colors"
                                    >
                                        <LogOut size={18} /> 
                                        <span>Çıkış Yap</span>
                                    </button>
                                </div>
                             </div>
                         )}
                    </div>
                </>
            ) : (
                /* Public user sees nothing (or maybe search) */
                null
            )}
            
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-100 dark:border-dark-border py-12 mt-12 bg-white dark:bg-dark-bg transition-colors duration-300">
        <div className="max-w-screen-xl mx-auto px-4 flex flex-col md:flex-row justify-center items-center gap-6">
            <div className="text-gray-400 dark:text-gray-500 text-sm font-sans flex flex-col md:flex-row items-center gap-2 md:gap-6">
                <div className="flex items-center gap-2">
                    <Terminal size={16} />
                    <span>© {new Date().getFullYear()} omer.in Teknoloji Blogu.</span>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;