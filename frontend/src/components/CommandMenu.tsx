import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { Search, Compass, ShieldAlert, LogOut, Sun, Sparkles } from 'lucide-react';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      toast({ title: 'Theme Updated', description: 'Switched to Light Mode.' });
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      toast({ title: 'Theme Updated', description: 'Switched to Dark Mode.' });
    }
    onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Logged Out', description: 'Session ended successfully.' });
      navigate('/login');
    } catch (err) {
      toast({ title: 'Logout Failed', variant: 'destructive' });
    }
    onClose();
  };

  const commands = [
    {
      id: 'catalog',
      title: 'Navigate to Plan Catalog',
      category: 'Navigation',
      icon: <Compass className="h-4 w-4 text-zinc-400" />,
      action: () => { navigate('/'); onClose(); },
      show: true
    },
    {
      id: 'dashboard',
      title: 'Navigate to Dashboard',
      category: 'Navigation',
      icon: <Sparkles className="h-4 w-4 text-zinc-400" />,
      action: () => { navigate('/dashboard'); onClose(); },
      show: !!user
    },
    {
      id: 'theme',
      title: 'Toggle System Theme (Light/Dark)',
      category: 'Preferences',
      icon: <Sun className="h-4 w-4 text-zinc-400" />,
      action: toggleTheme,
      show: true
    },
    {
      id: 'login',
      title: 'Sign In to Account',
      category: 'Account',
      icon: <ShieldAlert className="h-4 w-4 text-zinc-400" />,
      action: () => { navigate('/login'); onClose(); },
      show: !user
    },
    {
      id: 'logout',
      title: 'Sign Out / End Session',
      category: 'Account',
      icon: <LogOut className="h-4 w-4 text-zinc-400" />,
      action: handleLogout,
      show: !!user
    }
  ];

  const filteredCommands = commands.filter(
    (c) => c.show && c.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e]/90 text-zinc-200 shadow-2xl backdrop-blur-2xl px-1"
          >
            {/* Search Input Bar */}
            <div className="flex items-center space-x-3 px-4 py-3.5 border-b border-white/5">
              <Search className="h-5 w-5 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none placeholder-zinc-500 text-zinc-100"
              />
              <span className="text-[10px] text-zinc-500 font-bold border border-white/10 rounded px-1.5 py-0.5 bg-white/5">
                ESC
              </span>
            </div>

            {/* Commands List */}
            <div className="max-h-[320px] overflow-y-auto py-2">
              {filteredCommands.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No commands found matching "{query}"
                </div>
              ) : (
                <div className="space-y-3 px-2">
                  {/* Categorize if necessary, but list layout is clean */}
                  <div>
                    <div className="px-2 pb-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      Suggestions
                    </div>
                    <div className="space-y-0.5">
                      {filteredCommands.map((cmd) => (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors group"
                        >
                          <div className="flex items-center space-x-3">
                            {cmd.icon}
                            <span className="font-medium">{cmd.title}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-semibold">
                            Run Action ↵
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Status */}
            <div className="flex justify-between items-center px-4 py-2 border-t border-white/5 bg-white/[0.01] text-[10px] text-zinc-500 font-medium">
              <span>Use ↑↓ to navigate (Click to select)</span>
              <span>SubFlow Raycast Menu</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandMenu;
