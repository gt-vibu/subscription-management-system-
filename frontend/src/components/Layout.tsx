import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { Badge } from './ui/Badge';
import { LogOut, Compass, Sparkles, Search, User, ChevronLeft, ChevronRight } from 'lucide-react';
import CommandMenu from './CommandMenu';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem('sidebar-collapsed') === 'true'
  );

  // Mouse coordinates for interactive glow spotlight
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 200 };
  const glowX = useSpring(mouseX, springConfig);
  const glowY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - 150); // half of 300px width
      mouseY.set(e.clientY - 150);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Set theme on load (default to light)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  // Command Menu Hotkey Listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged Out',
        description: 'You have been logged out of the session.',
        variant: 'success',
      });
      navigate('/login');
    } catch (err) {
      toast({
        title: 'Logout Failed',
        description: 'An error occurred during logout.',
        variant: 'destructive',
      });
    }
  };

  const isLinkActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row p-3 md:p-4 gap-4 bg-grid-layout relative transition-colors duration-200 overflow-hidden">
      {/* Interactive Cursor Spotlight Glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-30 opacity-40 mix-blend-screen hidden md:block"
        style={{
          x: glowX,
          y: glowY,
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 80%)',
          borderRadius: '50%',
        }}
      />

      {/* Drifting Ambient Glowing Orbs */}
      <motion.div
        animate={{
          x: [0, 60, -40, 0],
          y: [0, 80, -50, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none z-0"
      />
      <motion.div
        animate={{
          x: [0, -80, 50, 0],
          y: [0, -100, 70, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-[110px] pointer-events-none z-0"
      />
      <motion.div
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -60, 40, 0],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-10 right-10 w-64 h-64 rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none z-0"
      />

      {/* Vercel Ambient Glow Blobs */}
      <div className="glow-bg-blob-1" />
      <div className="glow-bg-blob-2" />

      {/* Raycast Command Menu Portal */}
      <CommandMenu isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />

      {/* Desktop Arc-Style Floating Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="hidden md:flex glass-card rounded-2xl flex-col justify-between p-4 shrink-0 z-30 overflow-hidden relative"
      >
        <div className="space-y-8">
          {/* Logo Brand and Toggle Button */}
          <div className="flex items-center justify-between px-1">
            <Link to="/" className="flex items-center space-x-2 shrink-0">
              <span className="h-6 w-6 rounded-md bg-slate-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-extrabold text-xs">
                S
              </span>
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-extrabold tracking-tight text-md text-foreground whitespace-nowrap overflow-hidden"
                  >
                    SubFlow
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation links */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2 whitespace-nowrap overflow-hidden">
              {isCollapsed ? '•••' : 'Menu'}
            </div>
            
            {(!user || user.role === 'USER') && (
              <Link
                to="/catalog"
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium sidebar-link ${
                  isLinkActive('/catalog') ? 'sidebar-link-active text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Compass className="h-4 w-4 shrink-0" />
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      Plan Catalog
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )}

            {user && (
              <Link
                to="/dashboard"
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium sidebar-link ${
                  isLinkActive('/dashboard') ? 'sidebar-link-active text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      Dashboard
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar Footer Details */}
        <div className="space-y-4 pt-4 border-t border-border">
          {user ? (
            <div className="space-y-3">
              {/* Account summary widget */}
              <div className="flex items-center space-x-3 px-2 overflow-hidden">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex flex-col min-w-0 overflow-hidden"
                    >
                      <span className="text-xs font-semibold text-foreground truncate">{user.name}</span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{user.role}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons row */}
              <div className="flex items-center justify-between px-2 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl p-2 bg-rose-50 hover:bg-rose-100/70 border border-rose-200/60 text-rose-700 transition-colors"
                  title="Log Out"
                >
                  <LogOut className="h-4 w-4" />
                  {!isCollapsed && <span className="text-xs font-semibold">Log Out</span>}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/login" className="w-full">
                <button className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors">
                  {isCollapsed ? 'In' : 'Sign In'}
                </button>
              </Link>
              {!isCollapsed && (
                <Link to="/register" className="w-full">
                  <button className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                    Sign Up
                  </button>
                </Link>
              )}
            </div>
          )}

          {/* Quick search hotkey indicator */}
          <button
            onClick={() => setIsCmdOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 bg-secondary border border-border rounded-xl text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer overflow-hidden"
          >
            <span className="flex items-center gap-1.5">
              <Search className="h-3 w-3 shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">Quick Search</span>}
            </span>
            {!isCollapsed && <kbd className="text-[9px] font-bold bg-background border border-border px-1 py-0.5 rounded text-muted-foreground">⌘K</kbd>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header navigation */}
      <header className="md:hidden glass-card rounded-2xl p-4 flex items-center justify-between z-30">
        <Link to="/" className="flex items-center space-x-2">
          <span className="h-5 w-5 rounded bg-slate-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-extrabold text-[10px]">
            S
          </span>
          <span className="font-extrabold tracking-tight text-sm text-foreground">SubFlow</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCmdOpen(true)}
            className="p-1.5 bg-secondary border border-border rounded-lg text-muted-foreground"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {user && (
            <Link to="/dashboard" className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1">
              Dashboard
            </Link>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="p-1.5 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link to="/login" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main viewport Container */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Dynamic header stats or spacer on desktop */}
        <div className="hidden md:flex h-10 items-center justify-end px-4 mb-2">
          {user && (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Access Profile:</span>
              <Badge variant="secondary" className="text-[10px] bg-secondary border-border text-foreground">
                {user.role}
              </Badge>
            </div>
          )}
        </div>

        {/* View content panel */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
