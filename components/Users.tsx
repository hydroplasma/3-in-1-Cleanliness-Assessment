
import React, { useState, useRef } from 'react';
import { AnyData, User, Room } from '../types';
import { dataService } from '../services/dataService';
import Modal from './Modal';
import { useLanguage } from '../services/i18n';

interface UsersProps {
  allData: AnyData[];
}

export default function Users({ allData }: UsersProps) {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const users = allData.filter((d): d is User => d.type === 'user');
  const rooms = allData.filter((d): d is Room => d.type === 'room');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    class: '',
    status: 'active',
    assigned_locations: [] as string[]
  });
  
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const openAddModal = () => {
    setEditingUser(null);
    setShowPassword(false);
    setFormData({ 
      name: '', 
      email: '', 
      password: '', 
      role: '', 
      class: '', 
      status: 'active',
      assigned_locations: []
    });
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setShowPassword(false);
    setFormData({ 
      name: user.user_name, 
      email: user.user_email, 
      password: '', // Leave empty to keep existing
      role: user.user_role,
      class: user.user_class || '',
      status: user.user_status,
      assigned_locations: user.assigned_locations || []
    });
    setModalOpen(true);
  };

  const handleToggleLocation = (loc: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_locations: prev.assigned_locations.includes(loc)
        ? prev.assigned_locations.filter(l => l !== loc)
        : [...prev.assigned_locations, loc]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      const updatedUser: any = {
        ...editingUser,
        user_name: formData.name,
        user_email: formData.email,
        user_role: formData.role as User['user_role'],
        user_class: formData.class,
        user_status: formData.status,
        assigned_locations: formData.assigned_locations
      };
      if (formData.password) {
        updatedUser.password = formData.password;
      }
      await dataService.update(updatedUser);
    } else {
      await dataService.create({
        type: 'user',
        user_id: 'USR-' + Date.now(),
        user_name: formData.name,
        user_email: formData.email,
        password: formData.password || 'demo123', 
        user_role: formData.role as User['user_role'],
        user_class: formData.class,
        user_status: formData.status,
        assigned_locations: formData.assigned_locations,
        user_created_at: new Date().toISOString()
      });
    }

    setModalOpen(false);
  };

  const deleteUser = async (user: User) => {
    if (confirm(`คุณต้องการลบผู้ใช้ "${user.user_name}" หรือไม่?`)) {
      await dataService.delete(user);
    }
  };

  const handleExportExcel = () => {
    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"></head>
      <body>
        <table>
          <tr>
            <td style="background-color: #4F46E5; color: white; font-weight: bold;">Name</td>
            <td style="background-color: #4F46E5; color: white; font-weight: bold;">Email</td>
            <td style="background-color: #4F46E5; color: white; font-weight: bold;">Role</td>
            <td style="background-color: #4F46E5; color: white; font-weight: bold;">Class</td>
            <td style="background-color: #4F46E5; color: white; font-weight: bold;">Status</td>
          </tr>
          ${users.map(u => `
            <tr>
              <td>${u.user_name}</td>
              <td>${u.user_email}</td>
              <td>${u.user_role}</td>
              <td>${u.user_class || ''}</td>
              <td>${u.user_status}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${Date.now()}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        // Simplified import logic for User data (expecting JSON for reliability, but label as data transfer)
        const importedData = JSON.parse(content);
        if (Array.isArray(importedData)) {
           for (const item of importedData) {
             if (item.type === 'user' || (item.user_email && item.user_name)) {
                await dataService.create({
                  ...item,
                  type: 'user',
                  user_id: item.user_id || 'USR-' + Date.now() + Math.random(),
                  user_created_at: item.user_created_at || new Date().toISOString()
                });
             }
           }
           alert(t('import_success'));
        }
      } catch (err) {
        alert(t('import_error'));
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    teacher: 'bg-blue-100 text-blue-700',
    student: 'bg-emerald-100 text-emerald-700',
    student_council: 'bg-orange-100 text-orange-700'
  };

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    teacher: 'Teacher',
    student: 'Student',
    student_council: 'Student Council'
  };

  return (
    <div className="page-content fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">จัดการผู้ใช้งาน (User Management)</h2>
          <p className="text-slate-500 mt-1">จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง</p>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold text-xs shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4 4m0 0l-4-4m4 4V4" /></svg>
              {t('export_excel')}
           </button>
           <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-bold text-xs shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0l4 4m-4-4L8 8" /></svg>
              {t('import_data')}
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json,.csv" />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <button onClick={openAddModal} className="btn-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 w-full sm:w-auto justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg> เพิ่มผู้ใช้งาน
            </button>
            <div className="relative w-full sm:w-auto">
              <input type="text" placeholder="ค้นหาผู้ใช้..." className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm w-full sm:w-64 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left py-4 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider rounded-l-xl">ชื่อผู้ใช้</th>
                <th className="text-left py-4 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">อีเมล</th>
                <th className="text-left py-4 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">บทบาท</th>
                <th className="text-left py-4 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">สถานะ</th>
                <th className="text-right py-4 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider rounded-r-xl">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <p className="text-sm">ไม่พบผู้ใช้งาน</p>
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.user_id} className="table-row border-b border-slate-50 dark:border-slate-800">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {u.user_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{u.user_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{u.user_email}</td>
                    <td className="py-4 px-4"><span className={`role-badge ${roleColors[u.user_role]}`}>{roleLabels[u.user_role]}</span></td>
                    <td className="py-4 px-4"><span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">{u.user_status}</span></td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors" onClick={() => openEditModal(u)}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button className="text-slate-400 hover:text-red-600 transition-colors" onClick={() => deleteUser(u)}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? "แก้ไขข้อมูลผู้ใช้" : "เพิ่มผู้ใช้งานใหม่"}>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">ชื่อ - นามสกุล</label>
              <input type="text" required placeholder="สมชาย ใจดี" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">อีเมล (Email)</label>
              <input type="email" required placeholder="somchai@school.com" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">กำหนดรหัสผ่านใหม่</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder={editingUser ? "เว้นว่างเพื่อใช้รหัสเดิม" : "กำหนดรหัสผ่าน (เช่น demo123)"} 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                required={!editingUser}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.882 9.882L5.146 5.147m13.71 13.71L14.117 14.117M19.071 4.929l-4.242 4.242" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{editingUser ? "* หากต้องการเปลี่ยนรหัสผ่าน ให้กรอกข้อมูลใหม่ลงในช่องนี้" : "* รหัสผ่านเริ่มต้นคือ demo123 (หรือกำหนดใหม่ได้ตามต้องการ)"}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">บทบาท (Role)</label>
              <select required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} >
                <option value="">-- เลือกบทบาท --</option>
                <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                <option value="teacher">ครู (Teacher)</option>
                <option value="student_council">คณะกรรมการสภานักเรียน</option>
                <option value="student">นักเรียน (Student)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">สถานะ</label>
              <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} >
                <option value="active">ใช้งาน (Active)</option>
                <option value="inactive">ระงับการใช้งาน (Inactive)</option>
              </select>
            </div>
          </div>

          {(formData.role === 'teacher' || formData.role === 'student_council') && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
              <label className="block text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-3">กำหนดสิทธิ์การประเมินพื้นที่</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                {rooms.map(room => (
                  <label key={room.room_id} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 cursor-pointer hover:border-indigo-300 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600" 
                      checked={formData.assigned_locations.includes(room.room_name)}
                      onChange={() => handleToggleLocation(room.room_name)}
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">{room.room_name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-slate-100 mt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="w-full md:flex-1 px-6 py-3 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">ยกเลิก</button>
            <button type="submit" className="w-full md:flex-1 btn-primary text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center"><span>{editingUser ? "บันทึกแก้ไข" : "เพิ่มผู้ใช้"}</span></button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
