
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { SystemSettings } from '../types';
import { useLanguage } from '../services/i18n';
import ConfirmationModal from './ConfirmationModal';
import Modal from './Modal';

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
     allowMultipleDailyAreas: false,
     telegram_report_title: 'แบบฟอร์มรายงานความสะอาด'
  });
  const [saved, setSaved] = useState(false);
  const [showCacheModal, setShowCacheModal] = useState(false);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [alertModal, setAlertModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info' as 'info' | 'success' | 'error' | 'warning' 
  });

  useEffect(() => {
     const allData = dataService.getAll();
     const existing = allData.find(d => d.type === 'settings') as SystemSettings;
     if (existing) {
        setSettings({ 
          ...existing, 
          showQuickLogin: existing.showQuickLogin !== undefined ? existing.showQuickLogin : true,
          allowMultipleDailyAreas: existing.allowMultipleDailyAreas !== undefined ? existing.allowMultipleDailyAreas : false,
          telegram_report_title: existing.telegram_report_title || 'แบบฟอร์มรายงานความสะอาด'
        });
     }
  }, []);

  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  };

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

  const performClearCache = () => {
    localStorage.removeItem("cached_data");
    window.location.reload();
  };

  const testTelegram = async () => {
    if (!settings.telegram_token || !settings.telegram_chat_id) {
        showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุ Token และ Chat ID ก่อนทดสอบ', 'warning');
        return;
    }
    try {
        const res = await fetch(`https://api.telegram.org/bot${settings.telegram_token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: settings.telegram_chat_id,
                text: `🔔 *ทดสอบการแจ้งเตือน*\nหัวข้อ: ${settings.telegram_report_title} (ข้อความอัตโนมัติ)`,
                parse_mode: 'Markdown'
            })
        });
        const data = await res.json();
        if (data.ok) {
            showAlert('สำเร็จ', '✅ ส่งข้อความทดสอบสำเร็จ!', 'success');
        } else {
            showAlert('ล้มเหลว', '❌ ส่งข้อความไม่สำเร็จ: ' + data.description, 'error');
        }
    } catch (e) {
        showAlert('ข้อผิดพลาด', '⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ Telegram API', 'error');
    }
  };

  const handleManualReportClick = () => {
    if (!settings.telegram_token || !settings.telegram_chat_id) {
        showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุ Token และ Chat ID ก่อน', 'warning');
        return;
    }
    setShowReportModal(true);
  };

  const executeManualReport = async () => {
    try {
        const res = await dataService.triggerManualReport();
        if (res.status === 'success') {
            showAlert('สำเร็จ', '✅ ส่งรายงานสรุปผลสำเร็จ', 'success');
        } else {
            showAlert('ล้มเหลว', '❌ เกิดข้อผิดพลาด: ' + res.message, 'error');
        }
    } catch (e) {
        showAlert('ข้อผิดพลาด', '⚠️ Error connecting to server', 'error');
    }
  };

  const themes = [
    { id: 'indigo', name: 'Indigo', color: 'bg-indigo-600' },
    { id: 'blue', name: 'Blue', color: 'bg-blue-600' },
    { id: 'emerald', name: 'Emerald', color: 'bg-emerald-600' },
    { id: 'rose', name: 'Rose', color: 'bg-rose-600' },
  ];

  const getAlertIcon = () => {
    switch(alertModal.type) {
        case 'success': return <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg></div>;
        case 'error': return <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></div>;
        case 'warning': return <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>;
        default: return <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>;
    }
  };

  return (
    <div className="page-content fade-in">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
         <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">ตั้งค่าระบบ (System Settings)</h2>
            <p className="text-slate-500 mt-1">กำหนดข้อมูลโรงเรียนและความปลอดภัยของหน้าประเมิน</p>
         </div>
         <button onClick={handleSave} className="btn-primary text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg w-full md:w-auto">
            {saved ? 'บันทึกแล้ว!' : 'บันทึกการเปลี่ยนแปลง'}
         </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">ข้อมูลโรงเรียน (School Info)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ชื่อโรงเรียน</label>
              <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={settings.school_name || ''} onChange={e => setSettings({...settings, school_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">สังกัด</label>
              <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={settings.school_affiliation || ''} onChange={e => setSettings({...settings, school_affiliation: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ผู้บริหาร</label>
              <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={settings.executives || ''} onChange={e => setSettings({...settings, executives: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">นโยบายการบันทึกข้อมูล</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">อนุญาตให้ประเมินเขตพื้นที่ได้หลายคนต่อวัน</p>
                  <p className="text-xs text-slate-500 max-w-[280px]">หากปิด: แต่ละเขตพื้นที่ในหนึ่งวันจะบันทึกได้เพียง 1 ครั้งเท่านั้น (ใช้คนแรกที่ส่งเป็นเกณฑ์)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.allowMultipleDailyAreas} onChange={e => setSettings({...settings, allowMultipleDailyAreas: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">แสดงบัญชีทดสอบ (Quick Login)</p>
                  <p className="text-xs text-slate-500">แสดงตัวเลือกบัญชี Demo ในหน้าแรก</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.showQuickLogin} onChange={e => setSettings({...settings, showQuickLogin: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">การแจ้งเตือน Telegram</h3>
                <div className="flex gap-2">
                    <button onClick={handleManualReportClick} className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-bold transition-colors">
                        ส่งรายงานเดี๋ยวนี้
                    </button>
                    <button onClick={testTelegram} className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-bold transition-colors">
                        ทดสอบ
                    </button>
                </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">หัวข้อรายงานประจำวัน</label>
                <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={settings.telegram_report_title || ''} onChange={e => setSettings({...settings, telegram_report_title: e.target.value})} placeholder="แบบฟอร์มรายงานความสะอาด" />
                <p className="text-[10px] text-slate-400 mt-1 italic">* ระบบจะเติม "(ข้อความอัตโนมัติ)" ต่อท้ายหัวข้อนี้ใน Telegram</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Bot Token</label>
                    <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs" value={settings.telegram_token || ''} onChange={e => setSettings({...settings, telegram_token: e.target.value})} placeholder="123456:ABC..." />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Chat ID</label>
                    <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs" value={settings.telegram_chat_id || ''} onChange={e => setSettings({...settings, telegram_chat_id: e.target.value})} placeholder="-100..." />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">ล้างแคชข้อมูล</h3>
            <button onClick={() => setShowCacheModal(true)} className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-sm border border-rose-200 transition-all flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              {t('clear_cache')}
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={showCacheModal}
        onClose={() => setShowCacheModal(false)}
        onConfirm={performClearCache}
        title="ยืนยันการล้างแคช"
        message={t('confirm_clear_cache')}
        confirmText="ล้างแคช"
        type="warning"
      />

      <ConfirmationModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onConfirm={executeManualReport}
        title="ยืนยันการส่งรายงาน"
        message="ยืนยันการส่งรายงานสรุปผลประจำวันไปยัง Telegram เดี๋ยวนี้?"
        confirmText="ส่งรายงาน"
        type="info"
      />

      <Modal isOpen={alertModal.isOpen} onClose={closeAlert} title={alertModal.title}>
         <div className="text-center">
            {getAlertIcon()}
            <p className="text-slate-600 dark:text-slate-300 font-medium mb-6">{alertModal.message}</p>
            <button onClick={closeAlert} className="w-full btn-primary text-white py-3 rounded-xl font-bold shadow-lg">ตกลง</button>
         </div>
      </Modal>
    </div>
  );
}
