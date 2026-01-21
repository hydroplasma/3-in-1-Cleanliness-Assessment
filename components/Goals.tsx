import React, { useState } from 'react';
import { AnyData, Goal } from '../types';
import { dataService } from '../services/dataService';
import Modal from './Modal';

interface GoalsProps {
  allData: AnyData[];
}

export default function Goals({ allData }: GoalsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const goals = allData.filter((d): d is Goal => d.type === 'goal');

  const [newGoal, setNewGoal] = useState({
    location: '',
    target: '',
    deadline: ''
  });

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">เป้าหมาย (Goals & Targets)</h2>
        <p className="text-slate-500 mt-1">ตั้งค่าและติดตามเป้าหมายความสะอาดในแต่ละพื้นที่</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">เป้าหมายที่กำลังดำเนินการ</h3>
            <button onClick={() => setModalOpen(true)} className="btn-primary text-white px-4 py-2 rounded-xl text-sm font-semibold"> + เพิ่มเป้าหมายใหม่ </button>
          </div>
          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                <p className="text-sm">ยังไม่มีการตั้งเป้าหมาย สร้างเป้าหมายแรกของคุณ!</p>
              </div>
            ) : (
              goals.map(g => {
                const progress = Math.min((g.goal_current / g.goal_target) * 100, 100);
                const isComplete = progress >= 100;
                return (
                  <div key={g.goal_id} className={`border ${isComplete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'} rounded-xl p-5`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900">{g.goal_location}</h4>
                        <p className="text-sm text-slate-500">เป้าหมาย: {g.goal_target} คะแนน • สิ้นสุด: {new Date(g.goal_deadline).toLocaleDateString('th-TH')}</p>
                      </div>
                      {isComplete && <span className="text-2xl">🏆</span>}
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">ความคืบหน้า</span>
                        <span className="font-bold text-slate-900">{g.goal_current} / {g.goal_target}</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <h3 className="text-lg font-bold mb-4">สถิติความสำเร็จ</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2"><span>เป้าหมายที่สำเร็จ</span> <span className="font-bold">0/{goals.length}</span></div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-sm opacity-90 mb-2">รางวัลที่ได้รับทั้งหมด</p>
              <p className="text-3xl font-bold">🏆 0</p>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="ตั้งเป้าหมายใหม่">
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">สถานที่</label>
            <input 
              type="text" 
              required 
              placeholder="ตัวอย่าง: อาคาร A - ชั้น 1" 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900" 
              value={newGoal.location}
              onChange={e => setNewGoal({...newGoal, location: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">คะแนนเป้าหมาย</label>
            <input 
              type="number" 
              required 
              min="0" 
              max="100" 
              placeholder="85" 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900" 
              value={newGoal.target}
              onChange={e => setNewGoal({...newGoal, target: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">วันสิ้นสุด</label>
            <input 
              type="date" 
              required 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900" 
              value={newGoal.deadline}
              onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-6 py-3 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors">ยกเลิก</button>
            <button type="submit" className="flex-1 btn-primary text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center"><span>สร้างเป้าหมาย</span></button>
          </div>
        </form>
      </Modal>
    </div>
  );
}