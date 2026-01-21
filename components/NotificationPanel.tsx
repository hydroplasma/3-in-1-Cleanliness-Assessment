import React from 'react';
import { AnyData, Notification } from '../types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  allData: AnyData[];
}

export default function NotificationPanel({ isOpen, onClose, allData }: NotificationPanelProps) {
  const notifications = allData.filter((d): d is Notification => d.type === 'notification' && !d.notification_read);

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 fade-in">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">การแจ้งเตือน</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <p className="text-sm">ไม่มีการแจ้งเตือนใหม่</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.notification_id} className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <div className="flex gap-3">
                <div className={`w-10 h-10 rounded-xl ${n.notification_type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center flex-shrink-0`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 text-sm">{n.notification_title}</h4>
                  <p className="text-sm text-slate-600 mt-0.5">{n.notification_message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(n.notification_created_at).toLocaleString('th-TH')}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}