
import React from 'react';
import { CurrentUser } from '../types';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen: boolean;
  closeMobileMenu: () => void;
  user: CurrentUser | null;
}

export default function Sidebar({ activePage, setActivePage, isOpen, closeMobileMenu, user }: SidebarProps) {
  const handleNav = (page: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActivePage(page);
    closeMobileMenu();
  };

  const navClass = (page: string) => 
    `sidebar-item flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-700 font-medium cursor-pointer transition-all duration-200 ${activePage === page ? 'active shadow-lg' : 'hover:bg-primary-50 dark:text-slate-300 dark:hover:bg-slate-800'}`;

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isCouncil = user?.role === 'student_council';
  
  // Roles that can perform assessments and view reports
  const canAssess = isAdmin || isTeacher || isCouncil;

  return (
    <aside className={`w-64 bg-white dark:bg-slate-900 shadow-xl fixed left-0 top-16 bottom-0 z-40 transform transition-transform duration-300 border-r border-slate-100 dark:border-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <nav className="p-3 space-y-1 overflow-y-auto h-full pb-20">
        <a href="#" onClick={(e) => handleNav('dashboard', e)} className={navClass('dashboard')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
          <span>หน้าหลัก (Dashboard)</span>
        </a>

        {canAssess && (
          <>
            <div className="px-2 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 dark:text-slate-500">การประเมินผล</p>
            </div>
            <a href="#" onClick={(e) => handleNav('assessment-area', e)} className={navClass('assessment-area')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              <span>เขตพื้นที่รับผิดชอบ</span>
            </a>
            <a href="#" onClick={(e) => handleNav('assessment-classroom', e)} className={navClass('assessment-classroom')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <span>ห้องเรียน</span>
            </a>
            <a href="#" onClick={(e) => handleNav('assessment-restroom', e)} className={navClass('assessment-restroom')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span>ห้องน้ำ</span>
            </a>
            <a href="#" onClick={(e) => handleNav('report', e)} className={navClass('report')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>รายงานผลสรุป</span>
            </a>
          </>
        )}

        <div className="px-2 pt-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 dark:text-slate-500">ความคืบหน้า</p>
        </div>
        <a href="#" onClick={(e) => handleNav('goals', e)} className={navClass('goals')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          <span>เป้าหมาย (Goals)</span>
        </a>

        {isAdmin && (
          <>
            <div className="px-2 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 dark:text-slate-500">จัดการระบบ (Admin)</p>
            </div>
            <a href="#" onClick={(e) => handleNav('certificates', e)} className={navClass('certificates')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <span>พิมพ์เกียรติบัตร</span>
            </a>
            <a href="#" onClick={(e) => handleNav('users', e)} className={navClass('users')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              <span>จัดการผู้ใช้งาน</span>
            </a>
            <a href="#" onClick={(e) => handleNav('rooms', e)} className={navClass('rooms')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <span>จัดการห้อง/พื้นที่</span>
            </a>
            <a href="#" onClick={(e) => handleNav('criteria', e)} className={navClass('criteria')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              <span>เกณฑ์การให้คะแนน</span>
            </a>
            <a href="#" onClick={(e) => handleNav('settings', e)} className={navClass('settings')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span>ตั้งค่าโรงเรียน/ระบบ</span>
            </a>
          </>
        )}
      </nav>
    </aside>
  );
}
