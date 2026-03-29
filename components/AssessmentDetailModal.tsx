
import React, { useState, useEffect, useMemo } from 'react';
import { Assessment, Criterion, AnyData, CurrentUser } from '../types';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { useLanguage } from '../services/i18n';
import { dataService } from '../services/dataService';

interface AssessmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment | null;
  allData: AnyData[];
  currentUser?: CurrentUser;
}

export default function AssessmentDetailModal({ isOpen, onClose, assessment, allData, currentUser }: AssessmentDetailModalProps) {
  const { language, t } = useLanguage();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [imgLoadStatus, setImgLoadStatus] = useState<Record<number, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editScore, setEditScore] = useState(0);
  const [editStatus, setEditStatus] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  
  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!isOpen) {
      setViewerIndex(null);
      setImgLoadStatus({});
      setIsEditing(false);
    } else if (assessment) {
        setEditScore(assessment.score);
        setEditStatus(assessment.status);
        setEditRemarks(assessment.remarks || '');
    }
  }, [isOpen, assessment]);

  const getDisplay = (field: any) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    const mappedLang = language === 'is' ? 'isan' : language;
    return field[mappedLang] || field['th'] || field['en'] || '';
  };

  // Unified Criteria List using Snapshot if available or Robust Fallback
  const displayItems = useMemo(() => {
    if (!assessment) return [];

    // Strategy 1: Use Snapshot (The most reliable for historical data)
    let snapshot = assessment.criteria_snapshot;
    
    // Robust Parsing: Attempt to parse if it's a string
    if (typeof snapshot === 'string') {
        try { 
            const cleanStr = (snapshot as string).trim();
            if (cleanStr.startsWith('[') || cleanStr.startsWith('{')) {
                snapshot = JSON.parse(cleanStr);
            }
        } catch (e) { 
            console.error("Failed to parse criteria_snapshot:", e); 
        }
    }

    if (snapshot && Array.isArray(snapshot) && snapshot.length > 0) {
       return snapshot.map((c: any) => ({
          id: c.id || c.criterion_id,
          name: c.name,
          description: c.description || '',
          score: c.score,
          rubric: c.rubric || ''
       }));
    }

    // Strategy 2: Robust Fallback (Scan ALL criteria for matching keys)
    // We do NOT filter by type here first, because sometimes types might be case-mismatched 
    // (e.g. "Classroom" vs "classroom") in older data. We trust the ID match.
    const allCriteria = allData.filter((d): d is Criterion => d.type === 'criterion');
    
    const foundItems = allCriteria.map(c => {
       const conventions = [
         `criterion_${c.criterion_id}_score`,
         `${c.criterion_id}_score`,
         c.criterion_id
       ];
       
       let score: any = undefined;
       for (const key of conventions) {
          if (assessment[key] !== undefined && assessment[key] !== null && assessment[key] !== "") {
            score = assessment[key];
            break;
          }
       }
       
       if (score !== undefined) {
         const scoreNum = Number(score);
         return {
            id: c.criterion_id,
            name: c.criterion_name,
            description: c.criterion_description,
            score: scoreNum,
            rubric: c[`rubric_${scoreNum}`] || ''
         };
       }
       return null;
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    // If we found items via ID match, use them
    if (foundItems.length > 0) {
        return foundItems;
    }

    return [];

  }, [assessment, allData, language]);

  if (!assessment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-emerald-500 text-white';
      case 'good': return 'bg-blue-500 text-white';
      case 'needs_improvement': return 'bg-amber-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleImageError = (idx: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.src.includes('&cb=')) {
       img.src = `${assessment.images![idx]}&cb=${Date.now()}`;
    } else {
       img.src = 'https://placehold.co/600x400?text=Image+Unavailable';
    }
  };

  const handleSaveEdit = async () => {
      const updated = {
          ...assessment,
          score: editScore,
          status: editStatus as any,
          remarks: editRemarks
      };
      await dataService.update(updated);
      setIsEditing(false);
      window.location.reload(); 
  };

  const handleDelete = async () => {
      await dataService.delete(assessment);
      setDeleteModalOpen(false);
      onClose();
      window.location.reload();
  };

  const hasBreakdown = assessment.raw_score !== undefined && assessment.max_score !== undefined;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="รายละเอียดผลการประเมิน">
        <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-800 relative">
             {isAdmin && !isEditing && (
                 <div className="absolute right-0 top-0 flex gap-2">
                     <button onClick={() => setIsEditing(true)} className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-bold">แก้ไข</button>
                     <button onClick={() => setDeleteModalOpen(true)} className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-bold">ลบ</button>
                 </div>
             )}

             <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-8 ${assessment.score >= 80 ? 'border-emerald-100' : 'border-amber-100'} mb-3 shadow-xl dark:bg-slate-800 dark:border-slate-700`}>
                {isEditing ? (
                    <input type="number" value={editScore} onChange={e => setEditScore(Number(e.target.value))} className="w-16 text-center text-xl font-bold border-b border-slate-300 focus:outline-none dark:bg-transparent dark:text-white" />
                ) : (
                    <span className={`text-4xl font-black ${assessment.score >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{assessment.score}</span>
                )}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">คะแนนสุทธิ</span>
             </div>
             
             <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{assessment.location}</h3>
             
             <div className="flex items-center gap-2 mt-2">
                {isEditing ? (
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="text-xs border rounded p-1 dark:bg-slate-800 dark:text-white">
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="needs_improvement">Needs Improvement</option>
                    </select>
                ) : (
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${getStatusColor(assessment.status)} shadow-sm`}>{assessment.status.toUpperCase()}</span>
                )}
                <span className="text-xs text-slate-400 font-bold">{new Date(assessment.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
             </div>
             {hasBreakdown && (
               <div className="mt-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                 <p className="text-xs text-slate-500 dark:text-slate-400">
                   คะแนนดิบ: <span className="font-bold text-slate-800 dark:text-white">{assessment.raw_score}</span> / {assessment.max_score}
                 </p>
               </div>
             )}
          </div>

          {assessment.attendance_data && assessment.attendance_data.length > 0 && (
              <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30">
                  <h4 className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase mb-3 flex justify-between items-center">
                    <span>สรุปการเช็คชื่อเวรนักเรียน</span>
                    {assessment.attendance_points !== undefined && (
                      <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg shadow-sm text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 text-[10px]">
                        ได้ {assessment.attendance_points} / 10 คะแนน
                      </span>
                    )}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                      {assessment.attendance_data.map((student) => (
                          <div key={student.id} className={`text-[10px] px-2.5 py-1.5 rounded-xl font-bold border transition-all ${student.present ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                              {student.name}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ผลคะแนนแยกตามหัวข้อ (1-5)</h4>
              {displayItems.length === 0 ? (
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                    <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-slate-400 text-sm italic">ไม่พบรายละเอียดคะแนนย่อยในฐานข้อมูล</p>
                 </div>
              ) : (
                 displayItems.map((item, idx) => (
                      <div key={idx} className="border border-slate-100 rounded-2xl p-5 bg-white dark:bg-slate-800 shadow-sm transition-hover hover:border-indigo-200 dark:border-slate-700 dark:hover:border-indigo-500">
                          <div className="flex justify-between items-start mb-3">
                              <h5 className="text-sm font-black text-slate-800 dark:text-white flex-1 pr-4 leading-snug">{getDisplay(item.name)}</h5>
                              <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-md ${item.score >= 4 ? 'bg-emerald-500 text-white' : item.score >= 3 ? 'bg-indigo-500 text-white' : 'bg-rose-500 text-white'}`}>
                                  {item.score}
                              </div>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border-l-4 border-indigo-400">
                             <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                "{getDisplay(item.rubric) || 'ไม่มีข้อมูลรูบริกสำหรับระดับคะแนนนี้'}"
                             </p>
                          </div>
                      </div>
                  ))
              )}
          </div>

          {assessment.images && assessment.images.length > 0 && (
              <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">รูปภาพหลักฐานยืนยัน</h4>
                  <div className="grid grid-cols-2 gap-4">
                      {assessment.images.map((img, idx) => (
                          <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 group cursor-pointer shadow-md" onClick={() => setViewerIndex(idx)}>
                              <img 
                                src={img} 
                                alt={`Evidence ${idx + 1}`}
                                loading="eager" 
                                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${imgLoadStatus[idx] ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setImgLoadStatus(prev => ({...prev, [idx]: true}))}
                                onError={(e) => handleImageError(idx, e)}
                              />
                              {!imgLoadStatus[idx] && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800">
                                   <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all">
                                     <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {assessment.remarks && !isEditing && (
              <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800 shadow-inner">
                  <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase mb-2 tracking-widest">หมายเหตุผู้ตรวจสอบ</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{assessment.remarks}</p>
              </div>
          )}

          {isEditing && (
             <div className="animate-fadeIn">
                <label className="block text-xs font-bold text-slate-500 mb-1">แก้ไขหมายเหตุ</label>
                <textarea 
                   value={editRemarks} 
                   onChange={e => setEditRemarks(e.target.value)} 
                   className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                   rows={3}
                />
             </div>
          )}

          <div className="pt-6 sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-2 flex gap-3">
              {isEditing ? (
                 <>
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-4 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">ยกเลิก</button>
                    <button onClick={handleSaveEdit} className="flex-1 py-4 rounded-2xl font-bold bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 transition-all">บันทึกการแก้ไข</button>
                 </>
              ) : (
                 <button onClick={onClose} className="w-full btn-primary text-white py-4 rounded-2xl font-black shadow-xl uppercase tracking-widest text-sm transform active:scale-95 transition-all">ปิดหน้าต่างสรุปผล</button>
              )}
          </div>
        </div>
      </Modal>

      {viewerIndex !== null && assessment.images && (
        <div className="fixed inset-0 z-[2000] bg-black/95 flex flex-col items-center justify-center animate-fadeIn" onClick={() => setViewerIndex(null)}>
          <button className="absolute top-8 right-8 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all" onClick={() => setViewerIndex(null)}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div className="relative max-w-[95%] max-h-[85%] flex items-center justify-center p-4">
            <img src={assessment.images[viewerIndex]} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10" alt="Full View" />
          </div>
          <div className="mt-6 bg-white/10 backdrop-blur-xl px-6 py-2 rounded-full text-white font-bold tracking-widest text-sm border border-white/20 shadow-2xl">
             รูปที่ {viewerIndex + 1} / {assessment.images.length}
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="ยืนยันการลบข้อมูล"
        message={`คุณต้องการลบข้อมูลการประเมินของ "${assessment.location}" วันที่ ${new Date(assessment.date).toLocaleDateString('th-TH')} หรือไม่?`}
        confirmText="ลบข้อมูล"
        type="danger"
      />
    </>
  );
}
