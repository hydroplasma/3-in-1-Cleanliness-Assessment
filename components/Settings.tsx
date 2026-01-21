
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { SystemSettings } from '../types';

export default function Settings() {
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
     logo_url: '',
     reminder_daily: {
       1: '08:30', 2: '08:30', 3: '08:30', 4: '08:30', 5: '08:30', 6: '', 0: ''
     }
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
     // Load existing settings
     const allData = dataService.getAll();
     const existing = allData.find(d => d.type === 'settings') as SystemSettings;
     if (existing) {
        // Handle legacy reminder_time migration if needed
        const baseDaily = existing.reminder_daily || { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 0: '' };
        if (!existing.reminder_daily && existing.reminder_time) {
           [1, 2, 3, 4, 5].forEach(d => baseDaily[d] = existing.reminder_time!);
        }
        setSettings({ ...existing, reminder_daily: baseDaily });
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

  const handleDailyTimeChange = (day: number, time: string) => {
    setSettings({
      ...settings,
      reminder_daily: {
        ...settings.reminder_daily,
        [day]: time
      }
    });
  };

  const copyToAllDays = (time: string) => {
    if (!time) return;
    const newDaily = { ...settings.reminder_daily };
    [1, 2, 3, 4, 5, 6, 0].forEach(d => newDaily[d] = time);
    setSettings({ ...settings, reminder_daily: newDaily });
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
            <p className="text-slate-500 mt-1">กำหนดค่าความชอบ ข้อมูลโรงเรียน และการเชื่อมต่อระบบ</p>
         </div>
         <button onClick={handleSave} className="btn-primary text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg w-full md:w-auto">
            {saved ? 'บันทึกแล้ว!' : 'บันทึกการเปลี่ยนแปลง'}
         </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* School Information Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">ข้อมูลโรงเรียน (School Information)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ชื่อโรงเรียน</label>
              <input 
                 type="text" 
                 placeholder="เช่น โรงเรียนน้ำคำวิทยา" 
                 className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                 value={settings.school_name || ''}
                 onChange={e => setSettings({...settings, school_name: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">สังกัด (Affiliation)</label>
              <input 
                 type="text" 
                 placeholder="เช่น สังกัดองค์การบริหารส่วนจังหวัดศรีสะเกษ" 
                 className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                 value={settings.school_affiliation || ''}
                 onChange={e => setSettings({...settings, school_affiliation: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ผู้บริหาร (Executives)</label>
              <input 
                 type="text" 
                 placeholder="เช่น ผอ.สมชาย ใจดี" 
                 className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                 value={settings.executives || ''}
                 onChange={e => setSettings({...settings, executives: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ลิงก์โลโก้ (Logo URL)</label>
              <input 
                 type="text" 
                 placeholder="https://example.com/logo.png" 
                 className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                 value={settings.logo_url || ''}
                 onChange={e => setSettings({...settings, logo_url: e.target.value})} 
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">ธีมสี (Theme Color)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {themes.map(t => (
                <button
                    key={t.id}
                    onClick={() => setSettings({...settings, themeColor: t.id as any})}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${settings.themeColor === t.id ? 'border-indigo-600 bg-indigo-50 dark:bg-slate-800' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}
                >
                    <div className={`w-8 h-8 rounded-full ${t.color}`}></div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.name}</span>
                </button>
                ))}
            </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">การเชื่อมต่อ & การแจ้งเตือนรายวัน</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Telegram Bot Token</label>
                        <input 
                            type="password" 
                            placeholder="Token" 
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            value={settings.telegram_token}
                            onChange={e => setSettings({...settings, telegram_token: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Telegram Chat ID</label>
                        <input 
                            type="text" 
                            placeholder="Chat ID" 
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            value={settings.telegram_chat_id}
                            onChange={e => setSettings({...settings, telegram_chat_id: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ตั้งเวลาแจ้งเตือนรายวัน (Reminder Times)</label>
                        <button 
                          type="button"
                          onClick={() => copyToAllDays(settings.reminder_daily?.[1] || '')}
                          className="text-[10px] px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-bold"
                        >
                          ใช้เวลาของวันจันทร์กับทุกวัน
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {dayLabels.map(day => (
                          <div key={day.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <span className={`text-xs font-bold ${day.color}`}>{day.name}</span>
                            <input 
                              type="time" 
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-xs"
                              value={settings.reminder_daily?.[day.id] || ''}
                              onChange={e => handleDailyTimeChange(day.id, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-3">* เว้นว่างไว้หากไม่ต้องการให้แจ้งเตือนในวันนั้นๆ</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600">แจ้งเตือนคะแนนต่ำ</span>
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" checked={settings.notify_low_score} onChange={e => setSettings({...settings, notify_low_score: e.target.checked})} />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600">แจ้งเตือนเป้าหมาย</span>
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" checked={settings.notify_goals} onChange={e => setSettings({...settings, notify_goals: e.target.checked})} />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600">แจ้งเตือนเมื่อยังไม่ได้ตรวจ</span>
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" checked={settings.notify_reminders} onChange={e => setSettings({...settings, notify_reminders: e.target.checked})} />
                        </label>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
