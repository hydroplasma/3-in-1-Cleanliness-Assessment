import React from 'react';
import { CurrentUser, AnyData, SystemSettings } from '../types';

interface HeaderProps {
  user: CurrentUser;
  onLogout: () => void;
  toggleMobileMenu: () => void;
  toggleNotifications: () => void;
  allData: AnyData[];
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Header({ user, onLogout, toggleMobileMenu, toggleNotifications, allData, darkMode, toggleDarkMode }: HeaderProps) {
  const unreadCount = allData.filter(d => d.type === 'notification' && !d.notification_read).length;
  const settings = allData.find(d => d.type === 'settings') as SystemSettings | undefined;

  const schoolName = settings?.school_name || 'โรงเรียนน้ำคำวิทยา';
  const schoolAffiliation = settings?.school_affiliation || 'โรงเรียนสาธิต';
  const logoUrl = settings?.logo_url;

  return (
    <header className="gradient-header text-white shadow-xl fixed top-0 left-0 right-0 z-50 transition-colors duration-300">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3.5">
        <div className="flex items-center space-x-3">
          <button onClick={toggleMobileMenu} className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm overflow-hidden">
            {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">ระบบประเมินความสะอาด</h1>
            <p className="text-xs text-indigo-200 truncate max-w-[150px] sm:max-w-xs">{schoolName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
           <button onClick={toggleDarkMode} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors" title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {darkMode ? (
               <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          <button onClick={toggleNotifications} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full notification-badge"></span>
            )}
          </button>
          <div className="flex items-center space-x-2 bg-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">
              {user.initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight">{user.userName}</p>
              <p className="text-xs text-indigo-200 leading-tight">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors" title="ออกจากระบบ">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
}