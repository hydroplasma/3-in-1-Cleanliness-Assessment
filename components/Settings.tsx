
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { SystemSettings } from '../types';
import { useLanguage } from '../services/i18n';

export default function Settings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<SystemSettings>({
     type: 'settings',
     telegram_token: '',
     telegram_chat_id: '',
     notify_low_score: true,
     notify_reminders: true,
     notify_goals: true,
     themeColor: 'indigo',
     school_name: '',
     school_affiliation: '',
     executives: '',
     logo_url: 'https://i.postimg.cc/RZ0PCqVy/NKW-LOGO.png',
     showQuickLogin: true,
     reminder_daily: {
       1: '08:30', 2: '08:30', 3: '08:30', 4: '08:30', 5: '08:30', 6: '', 0: ''
     }
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
     const allData = dataService.getAll();
     const existing = allData.find(d => d.type === 'settings') as SystemSettings;
     if (existing) {
        const baseDaily = existing.reminder_daily || { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 0: '' };
        if (!existing.reminder_daily && existing.reminder_time) {
           [1, 2, 3, 4, 5].forEach(d => baseDaily[d] = existing.reminder_time!);
        }
        setSettings({ 
          ...existing, 
          reminder_daily: baseDaily, 
          showQuickLogin: existing.showQuickLogin !== undefined ? existing.showQuickLogin : true 
        });
     }
  }, []);

  const handleSave = async () => {
     const allData = dataService.getAll();
     const existing = allData.find(d => d.type === 'settings') as SystemSettings;
     
     if (existing) {
        await dataService.update({ ...settings, __backendId: existing.__backendId });
     } else {
        await dataService.create({ ...settings, __backendId: `SET-${Date.now()}` });
     }
     
     setSaved(true);
     setTimeout(() => setSaved(false), 3000);
  };

  const handleClearCache = () => {
    if (confirm(t('confirm_clear_cache'))) {
      localStorage.removeItem("cached_data");
      window.location.reload();
    }
  };

  const dayLabels = [
    { id: 1, name: 'วันจันทร์', color: 'text-yellow-600' },
    { id: 2, name: 'วันอังคาร', color: 'text-pink-600' },
    { id: 3, name: 'วันพุธ', color: 'text-emerald-600' },
    { id: 4, name: 'วันพฤหัสบดี', color: 'text-orange-600' },
    { id: 5, name: 'วันศุกร์', color: 'text-blue-600' },
    { id: 6, name: 'วันเสาร์', color: 'text-purple-600' },
    { id: 0, name: 'วันอาทิตย์', color: 'text-red-600' },
  ];

  const themes = [
    { id: 'indigo', name: 'Indigo (Default)', color: 'bg-indigo-600' },
    { id: 'blue', name: 'Blue', color: 'bg-blue-600' },
    { id: 'emerald', name: 'Emerald', color: 'bg-emerald-600' },
    { id: 'rose', name: 'Rose', color: 'bg-rose-600' },
  ];

  return (
    <div className="page-content fade-in">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
         <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">ตั้งค่าระบบ (System Settings)</h2>
            <p className="text-slate-500 mt-1">กำหนดข้อมูลโรงเรียนและความปลอดภัยของหน้าล็อกอิน</p>
         </div>
         <button onClick={handleSave} className="btn-primary text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg w-full md:w-auto">
            {saved ? 'บันทึกแล้ว!' : 'บันทึกการเปลี่ยนแปลง'}
         </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">ข้อมูลโรงเรียน (School Information)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ชื่อโรงเรียน</label>
              <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={settings.school_name || ''} onChange={e => setSettings({...settings, school_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">สังกัด</label>
              <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={settings.school_affiliation || ''} onChange={e => setSettings({...settings, school_affiliation: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ผู้บริหาร</label>
              <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={settings.executives || ''} onChange={e => setSettings({...settings, executives: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">การเข้าสู่ระบบและความปลอดภัย</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">แสดงบัญชีทดสอบ (Quick Login)</p>
                  <p className="text-xs text-slate-500">แสดงตัวเลือกบัญชี Demo ในหน้าแรกสำหรับทดสอบ</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.showQuickLogin} onChange={e => setSettings({...settings, showQuickLogin: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">ธีมสีของระบบ</h3>
            <div className="grid grid-cols-4 gap-2">
               {themes.map(t => (
                 <button key={t.id} onClick={() => setSettings({...settings, themeColor: t.id as any})} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${settings.themeColor === t.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800'}`}>
                    <div className={`w-6 h-6 rounded-full ${t.color}`}></div>
                    <span className="text-[10px] font-bold">{t.id}</span>
                 </button>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 border-t-4 border-t-rose-500">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">การดูแลระบบ (Maintenance)</h3>
            <p className="text-xs text-slate-500 mb-4">หากพบว่าข้อมูลในแอปไม่อัปเดตเป็นล่าสุดตามเซิร์ฟเวอร์ หรือพบปัญหาการแสดงผลผิดพลาด</p>
            <button 
              onClick={handleClearCache}
              className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-sm border border-rose-200 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              {t('clear_cache')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
