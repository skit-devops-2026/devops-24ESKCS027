import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Users,
  UserCheck,
  Sparkles,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/organizer/dashboard', icon: LayoutDashboard },
    { name: 'My Events', href: '/organizer/events', icon: CalendarDays },
    { name: 'Create Event', href: '/organizer/events/new', icon: PlusCircle },
    { name: 'Profile & Host Info', href: '/organizer/profile', icon: UserCheck },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-slate-800 bg-slate-950/95 p-5 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo / Header */}
          <div className="flex items-center justify-between px-2 pb-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/25">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white">EventHive</span>
                <span className="ml-2 rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-300 uppercase tracking-widest border border-brand-500/30">
                  Organizer
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Management
            </p>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 font-bold'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/60 p-3 border border-slate-800">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
              alt={user?.name || 'Organizer'}
              className="h-10 w-10 rounded-xl object-cover ring-2 ring-brand-500/30"
            />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-bold text-white">{user?.name || 'Alex Rivera'}</p>
              <p className="truncate text-xs text-brand-300/80">{user?.organization || 'Event Host'}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
