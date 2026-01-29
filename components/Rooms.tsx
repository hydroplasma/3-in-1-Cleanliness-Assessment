
import React, { useState } from 'react';
import { AnyData, Room } from '../types';
import { dataService } from '../services/dataService';
import Modal from './Modal';
import { useLanguage } from '../services/i18n';

interface RoomsProps {
  allData: AnyData[];
}

export default function Rooms({ allData }: RoomsProps) {
  const { t } = useLanguage();
  const rooms = allData.filter((d): d is Room => d.type === 'room');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    floor: '',
    type: 'classroom' as 'area' | 'classroom' | 'restroom',
    responsibleClass: ''
  });

  const openAddModal = () => {
    setEditingRoom(null);
    setFormData({ name: '', building: '', floor: '', type: 'classroom', responsibleClass: '' });
    setModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.room_name,
      building: room.room_building,
      floor: room.room_floor,
      type: room.room_type || 'classroom',
      responsibleClass: room.responsible_class
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoom) {
      await dataService.update({
        ...editingRoom,
        room_name: formData.name,
        room_building: formData.building,
        room_floor: formData.floor,
        room_type: formData.type,
        responsible_class: formData.responsibleClass
      });
    } else {
      await dataService.create({
        type: 'room',
        room_id: 'ROOM-' + Date.now(),
        room_name: formData.name,
        room_building: formData.building,
        room_floor: formData.floor,
        room_type: formData.type,
        responsible_class: formData.responsibleClass,
        created_at: new Date().toISOString()
      });
    }
    setModalOpen(false);
  };

  const deleteRoom = async (room: Room) => {
    if (confirm(`ต้องการลบห้อง "${room.room_name}" หรือไม่?`)) {
      await dataService.delete(room);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'area': return t('assessment_area');
      case 'classroom': return t('assessment_classroom');
      case 'restroom': return t('assessment_restroom');
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'area': return 'bg-blue-100 text-blue-700';
      case 'classroom': return 'bg-emerald-100 text-emerald-700';
      case 'restroom': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="page-content fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('manage_rooms')}</h2>
          <p className="text-slate-500 mt-1">จัดการรายชื่อห้องและพื้นที่แยกตามประเภทการประเมิน</p>
        </div>
        <button onClick={openAddModal} className="btn-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg> เพิ่มห้อง/พื้นที่
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                <p className="text-sm">ไม่พบข้อมูลห้อง กรุณาเพิ่มห้องแรกของคุณ!</p>
              </div>
            ) : (
              rooms.map(r => (
                <div key={r.room_id} className="border border-slate-200 rounded-xl p-5 bg-white dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-shadow relative group">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white ${r.room_type === 'area' ? 'bg-blue-500' : r.room_type === 'restroom' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                      {r.room_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-indigo-500 hover:text-indigo-700 p-1" onClick={() => openEditModal(r)} title="แก้ไข">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button className="text-red-500 hover:text-red-700 p-1" onClick={() => deleteRoom(r)} title="ลบ">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getTypeColor(r.room_type)}`}>
                      {getTypeLabel(r.room_type)}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">{r.room_name}</h4>
                  <p className="text-sm text-slate-500 mt-1">{r.room_building || 'ไม่ระบุตึก'} • {r.room_floor || 'ไม่ระบุชั้น'}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">ชั้นเรียนที่รับผิดชอบ:</p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{r.responsible_class || 'ยังไม่กำหนด'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingRoom ? "แก้ไขข้อมูลห้อง/พื้นที่" : "เพิ่มห้อง/พื้นที่ใหม่"}>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ประเภทสถานที่</label>
            <select 
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value as any})}
            >
              <option value="area">{t('assessment_area')}</option>
              <option value="classroom">{t('assessment_classroom')}</option>
              <option value="restroom">{t('assessment_restroom')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ชื่อห้อง/ชื่อพื้นที่</label>
            <input 
              type="text" 
              required 
              placeholder="ตัวอย่าง: ห้อง 3A, เขตพื้นที่ 1" 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">อาคาร</label>
              <input 
                type="text" 
                placeholder="อาคารหลัก" 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                value={formData.building}
                onChange={e => setFormData({...formData, building: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ชั้น</label>
              <input 
                type="text" 
                placeholder="ชั้น 2" 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                value={formData.floor}
                onChange={e => setFormData({...formData, floor: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ชั้นเรียนที่รับผิดชอบ</label>
            <input 
              type="text" 
              placeholder="ตัวอย่าง: ม.3/1" 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
              value={formData.responsibleClass}
              onChange={e => setFormData({...formData, responsibleClass: e.target.value})}
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-6 py-3 text-slate-600 dark:text-slate-400 font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">ยกเลิก</button>
            <button type="submit" className="flex-1 btn-primary text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center"><span>{editingRoom ? "บันทึกแก้ไข" : "เพิ่มห้อง/พื้นที่"}</span></button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
