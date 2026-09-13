import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Plus, Bell, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Organizer Workspace Active</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Create Event Button */}
        <Link
          to="/organizer/events/new"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-600/25 hover:from-brand-500 hover:to-indigo-500 transition-all transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Event</span>
        </Link>

        {/* Profile Pill */}
        <Link
          to="/organizer/profile"
          className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-1.5 pr-3 hover:border-slate-700 transition-colors"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'}
            alt={user?.name}
            className="h-7 w-7 rounded-lg object-cover ring-1 ring-brand-500/40"
          />
          <div className="hidden md:block text-left text-xs">
            <span className="font-bold text-slate-200 block leading-tight">{user?.name}</span>
            <span className="text-[10px] text-brand-400 font-medium">Organizer</span>
          </div>
        </Link>
      </div>
    </header>
  );
};
