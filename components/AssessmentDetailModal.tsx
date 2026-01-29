
import React, { useState, useEffect } from 'react';
import { Assessment, Criterion, AnyData } from '../types';
import Modal from './Modal';
import { useLanguage } from '../services/i18n';

interface AssessmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment | null;
  allData: AnyData[];
}

export default function AssessmentDetailModal({ isOpen, onClose, assessment, allData }: AssessmentDetailModalProps) {
  const { language } = useLanguage();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Close viewer when modal closes
  useEffect(() => {
    if (!isOpen) setViewerIndex(null);
  }, [isOpen]);

  if (!assessment) return null;

  const criteria = allData.filter((d): d is Criterion => d.type === 'criterion' && d.criterion_type === assessment.assessment_type);

  // Helper to get translated text
  const getDisplay = (field: any) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    const mappedLang = language === 'is' ? 'isan' : language;
    return field[mappedLang] || field['th'] || field['en'] || '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-emerald-500 text-white';
      case 'good': return 'bg-blue-500 text-white';
      case 'needs_improvement': return 'bg-amber-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return 'ดีเยี่ยม';
      case 'good': return 'ดี';
      case 'needs_improvement': return 'ควรปรับปรุง';
      default: return status;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewerIndex === null || !assessment.images) return;
    setViewerIndex((viewerIndex - 1 + assessment.images.length) % assessment.images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewerIndex === null || !assessment.images) return;
    setViewerIndex((viewerIndex + 1) % assessment.images.length);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="รายละเอียดผลการประเมิน">
        <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
          {/* Header Summary */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 dark:border-slate-800">
             <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-8 ${assessment.score >= 80 ? 'border-emerald-100' : assessment.score >= 60 ? 'border-amber-100' : 'border-red-100'} mb-3 shadow-sm`}>
                <span className={`text-4xl font-black ${getScoreColor(assessment.score)}`}>{assessment.score}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">คะแนน</span>
             </div>
             <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{assessment.location}</h3>
             <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${getStatusColor(assessment.status)} shadow-sm`}>{getStatusLabel(assessment.status)}</span>
                <span className="text-xs text-slate-400 font-semibold">{new Date(assessment.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
             </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">หมวดหมู่</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">{assessment.assessment_type}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">ผู้ประเมิน</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{assessment.evaluator}</p>
              </div>
          </div>

          {/* Attendance Summary */}
          {assessment.assessment_type === 'area' && assessment.attendance_data && (
              <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800/50">
                  <h4 className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> สรุปการเช็คชื่อเวร</span>
                      <span className="bg-white px-2 py-0.5 rounded-lg shadow-sm text-indigo-700">{assessment.attendance_score} / 10</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                      {assessment.attendance_data.map((student) => (
                          <div key={student.id} className={`text-[10px] px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 font-bold ${student.present ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 text-slate-400 dark:bg-slate-800'}`}>
                              {student.name}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* Criteria Results */}
          <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ผลคะแนนแยกตามเกณฑ์</h4>
              {criteria.map((c) => {
                  const score = assessment[`criterion_${c.criterion_id}_score`] || 0;
                  const rubricText = getDisplay(c[`rubric_${score}`]) || 'ไม่มีข้อมูลรูบริก';
                  return (
                      <div key={c.criterion_id} className="border border-slate-100 rounded-2xl p-4 bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
                          <div className="flex justify-between items-start mb-2.5">
                              <h5 className="text-sm font-bold text-slate-800 dark:text-white leading-snug flex-1 pr-3">{getDisplay(c.criterion_name)}</h5>
                              <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${score >= 4 ? 'bg-emerald-500 text-white' : score >= 3 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                                  {score}
                              </div>
                          </div>
                          <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl dark:bg-slate-900/50 dark:text-slate-400 border-l-4 border-slate-200 dark:border-slate-700 leading-relaxed">
                              "{rubricText}"
                          </p>
                      </div>
                  );
              })}
          </div>

          {/* Evidence Photos */}
          {assessment.images && assessment.images.length > 0 && (
              <div className="space-y-3">
                  <div className="flex items-center justify-between pl-1">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">รูปภาพหลักฐาน ({assessment.images.length})</h4>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-900/30">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                          มีพิกัดลายน้ำยืนยัน
                      </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      {assessment.images.map((img, idx) => (
                          <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-100 group shadow-sm cursor-pointer" onClick={() => setViewerIndex(idx)}>
                              <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                                  <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                              </div>
                              <div className="absolute top-2 left-2 bg-emerald-600 text-[8px] text-white px-1.5 py-0.5 rounded-lg shadow-lg font-bold flex items-center gap-1 backdrop-blur-sm bg-opacity-80">
                                  VERIFIED
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* Remarks */}
          {assessment.remarks && (
              <div className="p-5 bg-amber-50 rounded-2xl dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase mb-2 tracking-widest">หมายเหตุจากผู้ประเมิน</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{assessment.remarks}</p>
              </div>
          )}

          <div className="pt-4 sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md pb-2">
              <button onClick={onClose} className="w-full btn-primary text-white py-4 rounded-2xl font-black shadow-xl uppercase tracking-widest text-sm transform active:scale-95 transition-all">ปิดหน้าต่าง</button>
          </div>
        </div>
      </Modal>

      {/* Full-screen Image Viewer */}
      {viewerIndex !== null && assessment.images && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-fadeIn" onClick={() => setViewerIndex(null)}>
          {/* Close Button */}
          <button 
            className="absolute top-6 right-6 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-[110]"
            onClick={() => setViewerIndex(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          {/* Previous Button */}
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-[110]"
            onClick={handlePrev}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          </button>

          {/* Next Button */}
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-[110]"
            onClick={handleNext}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </button>

          {/* Main Image */}
          <div className="relative max-w-[90%] max-h-[80%] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={assessment.images[viewerIndex]} 
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg border border-white/10" 
              alt="Full Evidence"
            />
            
            {/* Image Indicator */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/70 font-bold text-sm bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
              รูปที่ {viewerIndex + 1} / {assessment.images.length}
            </div>
          </div>

          <p className="absolute bottom-6 text-white/40 text-[10px] font-medium tracking-widest uppercase">คลิกพื้นที่ว่างเพื่อปิด</p>
        </div>
      )}
    </>
  );
}
