import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Instagram, 
  BarChart3, 
  Workflow, 
  Settings, 
  FileText,
  Bell,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navigation = [
    { name: 'Overview', href: '/', icon: LayoutDashboard, color: '#8B5CF6' },
    { name: 'Approvals', href: '/approvals', icon: CheckSquare, color: '#EC4899' },
    { name: 'Accounts', href: '/accounts', icon: Instagram, color: '#F59E0B' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, color: '#10B981' },
    { name: 'Workflows', href: '/workflows', icon: Workflow, color: '#3B82F6' },
    { name: 'Logs', href: '/logs', icon: FileText, color: '#6366F1' },
    { name: 'Settings', href: '/settings', icon: Settings, color: '#64748B' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 dark:opacity-10"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 -right-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 dark:opacity-10"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 left-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 dark:opacity-10"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Glassmorphic Sidebar */}
      <motion.aside 
        className="relative w-72 backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border-r border-white/20 dark:border-slate-700/50 shadow-2xl"
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-3 h-20 border-b border-white/20 dark:border-slate-700/50 px-6"
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Reels Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered</p>
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigation.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <motion.div
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    active
                      ? 'text-white shadow-lg'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`
                      }}
                      layoutId="activeNav"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={`h-5 w-5 relative z-10 ${active ? 'text-white' : ''}`} />
                  <span className="relative z-10">{item.name}</span>
                  
                  {hoveredItem === item.name && !active && (
                    <motion.div
                      className="absolute left-0 w-1 h-8 rounded-r-full"
                      style={{ backgroundColor: item.color }}
                      layoutId="hoverIndicator"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Stats Card at Bottom */}
        <motion.div 
          className="absolute bottom-6 left-4 right-4 p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            🎯 Daily Progress
          </div>
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>3 pending</span>
            <span>12 approved</span>
          </div>
          <div className="mt-2 h-2 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: '80%' }}
              transition={{ delay: 0.5, duration: 1 }}
            />
          </div>
        </motion.div>
      </motion.aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Glassmorphic Header */}
        <motion.header 
          className="relative flex h-20 items-center justify-between backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border-b border-white/20 dark:border-slate-700/50 px-8 shadow-lg"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          <div className="flex items-center gap-4">
            <motion.div
              className="text-sm font-medium text-slate-600 dark:text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <motion.button 
              className="relative p-3 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              <motion.span 
                className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.button>

            {/* User Profile */}
            <motion.div 
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20"
              whileHover={{ scale: 1.05 }}
            >
              {user?.picture && (
                <motion.img
                  src={user.picture}
                  alt={user.name}
                  className="h-10 w-10 rounded-full ring-2 ring-purple-500/50"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                />
              )}
              <div className="text-sm">
                <div className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</div>
              </div>
            </motion.div>

            {/* Logout Button */}
            <motion.button
              onClick={logout}
              className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </motion.button>
          </div>
        </motion.header>

        {/* Page content with animations */}
        <main className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
