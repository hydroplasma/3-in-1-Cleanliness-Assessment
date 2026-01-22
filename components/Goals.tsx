
import React, { useState } from 'react';
import { AnyData, Goal, Room } from '../types';
import { dataService } from '../services/dataService';
import Modal from './Modal';
import { useLanguage } from '../services/i18n';

interface GoalsProps {
  allData: AnyData[];
}

export default function Goals({ allData }: GoalsProps) {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const goals = allData.filter((d): d is Goal => d.type === 'goal');
  const rooms = allData.filter((d): d is Room => d.type === 'room');

  const [newGoal, setNewGoal] = useState({
    location: '',
    target: '',
    deadline: ''
  });

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.location) return;

    await dataService.create({
      type: 'goal',
      goal_id: 'GOAL-' + Date.now(),
      goal_location: newGoal.location,
      goal_target: parseFloat(newGoal.target),
      goal_current: 0,
      goal_deadline: newGoal.deadline
    });
    setModalOpen(false);
    setNewGoal({ location: '', target: '', deadline: '' });
  };

  return (
    <div className="page-content fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">เป้าหมาย (Goals & Targets)</h2>
          <p className="text-slate-500 mt-1">กำหนดเป้าหมายคะแนนความสะอาดแยกตามพื้นที่</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg> เพิ่มเป้าหมาย
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-full py-16 bg-white rounded-3xl border border-slate-100 text-center dark:bg-slate-900 dark:border-slate-800">
             <svg className="w-16 h-16 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
             <p className="text-slate-500 font-bold">ยังไม่มีการตั้งเป้าหมายในระบบ</p>
          </div>
        ) : (
          goals.map(g => {
            const progress = Math.min((g.goal_current / g.goal_target) * 100, 100);
            return (
              <div key={g.goal_id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 dark:bg-indigo-900/30">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">เดดไลน์</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{new Date(g.goal_deadline).toLocaleDateString('th-TH')}</p>
                  </div>
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1">{g.goal_location}</h4>
                <p className="text-sm font-bold text-indigo-600 mb-6">คะแนนเป้าหมาย: {g.goal_target}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">ความสำเร็จ</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="ตั้งเป้าหมายใหม่">
        <form onSubmit={handleAddGoal} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">เลือกพื้นที่/ห้อง (Location)</label>
            <select 
              required 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              value={newGoal.location}
              onChange={e => setNewGoal({...newGoal, location: e.target.value})}
            >
              <option value="">-- {t('select_location')} --</option>
              {rooms.map(room => (
                <option key={room.room_id} value={room.room_name}>
                  {room.room_name} {room.room_building ? `(${room.room_building})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">คะแนนเป้าหมาย (80-100)</label>
            <input 
              type="number" required min="1" max="100" placeholder="85" 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
              value={newGoal.target}
              onChange={e => setNewGoal({...newGoal, target: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">วันที่ต้องบรรลุเป้าหมาย</label>
            <input 
              type="date" required 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
              value={newGoal.deadline}
              onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-6 py-3 text-slate-600 font-bold rounded-xl hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">ยกเลิก</button>
            <button type="submit" className="flex-1 btn-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg">บันทึกเป้าหมาย</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
