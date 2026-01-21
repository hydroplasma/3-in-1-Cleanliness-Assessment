import React, { useState } from 'react';
import { AnyData, Criterion } from '../types';
import { dataService } from '../services/dataService';
import Modal from './Modal';

interface CriteriaProps {
  allData: AnyData[];
}

export default function Criteria({ allData }: CriteriaProps) {
  const criteria = allData.filter((d): d is Criterion => d.type === 'criterion');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [currentType, setCurrentType] = useState<'area' | 'classroom' | 'restroom'>('area');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rubric_5: '',
    rubric_4: '',
    rubric_3: '',
    rubric_2: '',
    rubric_1: ''
  });

  const openAddModal = (type: 'area' | 'classroom' | 'restroom') => {
    setCurrentType(type);
    setEditingCriterion(null);
    setFormData({
      name: '', description: '',
      rubric_5: '', rubric_4: '', rubric_3: '', rubric_2: '', rubric_1: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (c: Criterion) => {
    setCurrentType(c.criterion_type);
    setEditingCriterion(c);
    setFormData({
      name: c.criterion_name,
      description: c.criterion_description,
      rubric_5: c.rubric_5 || '',
      rubric_4: c.rubric_4 || '',
      rubric_3: c.rubric_3 || '',
      rubric_2: c.rubric_2 || '',
      rubric_1: c.rubric_1 || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      criterion_name: formData.name,
      criterion_description: formData.description,
      rubric_5: formData.rubric_5,
      rubric_4: formData.rubric_4,
      rubric_3: formData.rubric_3,
      rubric_2: formData.rubric_2,
      rubric_1: formData.rubric_1,
    };

    if (editingCriterion) {
      await dataService.update({
        ...editingCriterion,
        ...payload
      });
    } else {
      await dataService.create({
        type: 'criterion',
        criterion_id: 'CRIT-' + currentType.toUpperCase() + '-' + Date.now(),
        criterion_type: currentType,
        created_at: new Date().toISOString(),
        ...payload
      });
    }
    setModalOpen(false);
  };

  const renderList = (type: 'area' | 'classroom' | 'restroom', title: string, color: string) => {
    const typeCriteria = criteria.filter(c => c.criterion_type === type);
    
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-xl flex items-center justify-center`}>
              {type === 'area' && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
              {type === 'classroom' && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              {type === 'restroom' && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500">เกณฑ์การประเมินสำหรับ {title}</p>
            </div>
          </div>
          <button 
             className={`text-${color}-600 hover:bg-${color}-50 px-3 py-2 rounded-lg font-semibold text-sm transition-colors`}
             onClick={() => openAddModal(type)}
          >
            + เพิ่มเกณฑ์
          </button>
        </div>
        <div className="space-y-4">
          {typeCriteria.map(c => (
            <div key={c.criterion_id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">{c.criterion_name}</h4>
                  <p className="text-sm text-slate-600 mt-1 mb-2">{c.criterion_description || 'ไม่มีคำอธิบาย'}</p>
                  
                  {/* Collapsible details could go here, for now showing condensed view */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-3 p-3 bg-white rounded-lg border border-slate-100 text-xs text-slate-500">
                     <div><span className="font-bold text-slate-700">5:</span> {c.rubric_5?.substring(0, 50)}...</div>
                     <div><span className="font-bold text-slate-700">1:</span> {c.rubric_1?.substring(0, 50)}...</div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                   <button className="text-slate-400 hover:text-indigo-600 p-1" onClick={() => openEditModal(c)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                   </button>
                   <button className="text-slate-400 hover:text-red-600 p-1" onClick={() => { if(confirm('ต้องการลบเกณฑ์นี้หรือไม่?')) dataService.delete(c) }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                </div>
              </div>
            </div>
          ))}
          {typeCriteria.length === 0 && (
             <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">ยังไม่มีการกำหนดเกณฑ์ คลิก "เพิ่มเกณฑ์" เพื่อเริ่มต้น</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-content fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">จัดการเกณฑ์และรูบริก (Criteria & Rubrics)</h2>
        <p className="text-slate-500 mt-1">ตั้งค่าเกณฑ์การประเมินและรูบริกสำหรับแต่ละประเภทการประเมิน</p>
      </div>
      <div className="space-y-6">
        {renderList('area', 'เกณฑ์เขตพื้นที่ (Area Zone)', 'blue')}
        {renderList('classroom', 'เกณฑ์ห้องเรียน (Classroom)', 'emerald')}
        {renderList('restroom', 'เกณฑ์ห้องน้ำ (Restroom)', 'amber')}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCriterion ? "แก้ไขเกณฑ์" : `เพิ่มเกณฑ์สำหรับ ${currentType === 'area' ? 'เขตพื้นที่' : currentType === 'classroom' ? 'ห้องเรียน' : 'ห้องน้ำ'}`}>
         <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
               <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อหัวข้อเกณฑ์</label>
               <input 
                  type="text" required 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-900"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
               />
            </div>
            <div>
               <label className="block text-sm font-semibold text-slate-700 mb-1">คำอธิบาย</label>
               <textarea 
                  rows={2} required 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-900"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
               ></textarea>
            </div>
            
            <div className="border-t border-slate-100 pt-4 mt-2">
               <h4 className="font-bold text-slate-900 mb-3">รูบริกการให้คะแนน (Rubrics)</h4>
               
               {[5, 4, 3, 2, 1].map(score => (
                  <div key={score} className="mb-3">
                     <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">คะแนน {score}</label>
                     <textarea 
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                        placeholder={`คำอธิบายสำหรับคะแนน ${score}...`}
                        value={(formData as any)[`rubric_${score}`]}
                        onChange={e => setFormData({...formData, [`rubric_${score}`]: e.target.value})}
                     ></textarea>
                  </div>
               ))}
            </div>

            <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
               <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors">ยกเลิก</button>
               <button type="submit" className="flex-1 btn-primary text-white px-4 py-2 rounded-xl font-semibold">บันทึก</button>
            </div>
         </form>
      </Modal>
    </div>
  );
}