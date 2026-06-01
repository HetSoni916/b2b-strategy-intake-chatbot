import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquareCode, BarChart3, Bot, Settings } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Sidebar() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat', label: 'Strategy Chat', icon: MessageSquareCode },
    { to: '/evaluation', label: 'AI Evaluation', icon: BarChart3 },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md transition-colors">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 dark:border-gray-800 px-6">
        <Bot className="h-7 w-7 text-brand-500 animate-pulse-subtle" />
        <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-500 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
          StratBot B2B
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 shadow-sm border-l-4 border-brand-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-100'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex items-center justify-between border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">HS</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Het Soni</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">B2B Consultant</p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
