
import React, { useState, useEffect } from 'react';
import { AnyData, CurrentUser, Criterion, Assessment, Room, User } from '../types';
import { dataService } from '../services/dataService';
import { useLanguage } from '../services/i18n';

interface AssessmentFormProps {
  type: 'area' | 'classroom' | 'restroom';
  currentUser: CurrentUser;
  allData: AnyData[];
  showLoading: (text: string) => void;
  hideLoading: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface StudentAttendance {
    id: string;
    name: string;
    present: boolean;
}

export default function AssessmentForm({ type, currentUser, allData, showLoading, hideLoading, showToast }: AssessmentFormProps) {
  // Use language directly from useLanguage
  const { t, language } = useLanguage();

  const config = {
    area: {
      title: t('assessment_area'),
      desc: 'ติดตามและให้คะแนนความสะอาดของพื้นที่ภายนอกและโซนที่ได้รับมอบหมาย',
      gradient: 'from-blue-600 to-indigo-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
      color: 'blue',
      textLight: 'text-blue-100'
    },
    classroom: {
      title: t('assessment_classroom'),
      desc: 'ติดตามและให้คะแนนความสะอาด ความเป็นระเบียบภายในห้องเรียน',
      gradient: 'from-emerald-600 to-teal-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
      color: 'emerald',
      textLight: 'text-emerald-100'
    },
    restroom: {
      title: t('assessment_restroom'),
      desc: 'ติดตามและให้คะแนนความสะอาดและสุขอนามัยของห้องน้ำ',
      gradient: 'from-amber-600 to-orange-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
      color: 'amber',
      textLight: 'text-amber-100'
    }
  }[type];

  const [formData, setFormData] = useState({
    location: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [responsibleStudents, setResponsibleStudents] = useState<StudentAttendance[]>([]);

  const criteria = allData.filter((d): d is Criterion => d.type === 'criterion' && d.criterion_type === type);
  const allRooms = allData.filter((d): d is Room => d.type === 'room');
  const rooms = (currentUser.role === 'admin') 
    ? allRooms 
    : allRooms.filter(r => currentUser.assigned_locations?.includes(r.room_name));

  // Helper to get translated text
  const getDisplay = (field: any) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    const mappedLang = language === 'is' ? 'isan' : language;
    return field[mappedLang] || field['th'] || field['en'] || '';
  };

  useEffect(() => {
    setError('');
    setSuccess('');

    if (formData.location && formData.date) {
      const existingAssessments = allData.filter((d): d is Assessment => d.type === 'assessment');
      const isDuplicate = existingAssessments.some(a => 
        a.location === formData.location && 
        a.assessment_type === type && 
        a.date === formData.date
      );

      if (isDuplicate) {
        setError(`⚠️ ${t('duplicate_alert')}: "${formData.location}"`);
      }
    }

    if (type === 'area' && formData.location) {
        const room = rooms.find(r => r.room_name === formData.location);
        if (room && room.responsible_class) {
            const students = allData.filter((d): d is User => 
                d.type === 'user' && d.user_role === 'student' && d.user_class === room.responsible_class
            );
            setResponsibleStudents(students.map(s => ({ id: s.user_id, name: s.user_name, present: false })));
        } else {
            setResponsibleStudents([]);
        }
    }
  }, [formData.location, formData.date, type, allData, t]);

  const processImage = (file: File, location: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1280;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            } else {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Canvas context not found');
          ctx.drawImage(img, 0, 0, width, height);
          const timestamp = new Date().toLocaleString('th-TH', { 
            year: 'numeric', month: 'long', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
          });
          const watermarkText = `📍 ${location} | 🕒 ${timestamp}`;
          const fontSize = Math.max(16, Math.floor(width / 35));
          ctx.font = `bold ${fontSize}px "Arial", sans-serif`;
          const textMetrics = ctx.measureText(watermarkText);
          const textWidth = textMetrics.width;
          const padding = 20;
          const rectPadding = 15;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(width - textWidth - padding - rectPadding, height - fontSize - padding - rectPadding, textWidth + (rectPadding * 2), fontSize + (rectPadding * 2));
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(watermarkText, width - textWidth - padding, height - padding - 5);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (!formData.location) {
        showToast(t('select_location'), 'error');
        e.target.value = '';
        return;
      }
      setProcessing(true);
      showLoading(t('loading'));
      const newFiles = Array.from(e.target.files).slice(0, 5 - processedImages.length);
      try {
        const results = await Promise.all(newFiles.map(file => processImage(file as File, formData.location)));
        setProcessedImages(prev => [...prev, ...results].slice(0, 5));
        showToast(`Success ${results.length}`, 'success');
      } catch (err) {
        showToast('Error processing', 'error');
      } finally {
        setProcessing(false);
        hideLoading();
      }
    }
  };

  const removeImage = (index: number) => {
    setProcessedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleScoreChange = (criterionId: string, score: number) => {
    setScores(prev => ({ ...prev, [criterionId]: score }));
  };

  const toggleAttendance = (id: string) => {
      setResponsibleStudents(prev => prev.map(s => s.id === id ? { ...s, present: !s.present } : s));
  };

  const setAllAttendance = (present: boolean) => {
      setResponsibleStudents(prev => prev.map(s => ({ ...s, present })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (error.includes('⚠️')) return;

    const scoreValues = Object.values(scores) as number[];
    if (scoreValues.length === 0) {
      showToast('กรุณากรอกคะแนนการประเมินให้ครบถ้วน', 'error');
      return;
    }

    if (processedImages.length < 3) {
      showToast('กรุณาอัปโหลดรูปภาพหลักฐาน 3-5 รูปเพื่อบันทึกข้อมูล', 'error');
      return;
    }

    setSubmitting(true);
    showLoading(t('saving'));

    try {
        let percentageScore = 0;
        let finalRawScore = 0;
        let attendanceScore = 0;

        if (type === 'area') {
            const presentCount = responsibleStudents.filter(s => s.present).length;
            const totalStudents = responsibleStudents.length;
            attendanceScore = totalStudents > 0 ? (presentCount / totalStudents) * 10 : 0;
            const rawCriteriaSum = scoreValues.reduce((a, b) => a + b, 0);
            const maxCriteriaScore = criteria.length * 5;
            const criteriaScore = maxCriteriaScore > 0 ? (rawCriteriaSum / maxCriteriaScore) * 20 : 0;
            finalRawScore = attendanceScore + criteriaScore;
            percentageScore = Math.round((finalRawScore / 30) * 100);
        } else {
            const totalScore = scoreValues.reduce((a, b) => a + b, 0);
            const avgScore = totalScore / scoreValues.length; 
            percentageScore = Math.round((avgScore / 5) * 100);
            finalRawScore = percentageScore;
        }

        const assessmentData: any = {
          type: 'assessment',
          assessment_id: 'ASS-' + Date.now(),
          assessment_type: type,
          location: formData.location,
          date: formData.date,
          evaluator: currentUser.userName,
          remarks: formData.remarks,
          image_count: processedImages.length,
          images: processedImages,
          score: percentageScore, 
          raw_score: parseFloat(finalRawScore.toFixed(2)), 
          attendance_score: parseFloat(attendanceScore.toFixed(2)),
          attendance_data: type === 'area' ? responsibleStudents : undefined,
          status: percentageScore >= 80 ? 'excellent' : percentageScore >= 60 ? 'good' : 'needs_improvement',
          created_at: new Date().toISOString(),
          ...Object.keys(scores).reduce((acc, key) => ({...acc, [`criterion_${key}_score`]: scores[key]}), {})
        };

        const result = await dataService.create(assessmentData);
        if (result.isOk) {
          showToast(t('success_save'), 'success');
          setFormData({ location: '', date: new Date().toISOString().split('T')[0], remarks: '' });
          setProcessedImages([]);
          setScores({});
          setResponsibleStudents([]);
        } else {
          showToast(t('error_save'), 'error');
        }
    } catch (err) {
        showToast('Error', 'error');
    } finally {
        setSubmitting(false);
        hideLoading();
    }
  };

  const scoreLabels: Record<number, string> = { 5: t('rubric_level_5'), 4: t('rubric_level_4'), 3: t('rubric_level_3'), 2: t('rubric_level_2'), 1: t('rubric_level_1') };
  const scoreColors: Record<number, string> = { 
    5: 'bg-emerald-500 text-white', 
    4: 'bg-blue-500 text-white', 
    3: 'bg-indigo-500 text-white', 
    2: 'bg-amber-500 text-white', 
    1: 'bg-rose-500 text-white' 
  };

  return (
    <div className="page-content fade-in max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{config.title}</h2>
        <p className="text-slate-500 mt-1">{config.desc}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className={`bg-gradient-to-r ${config.gradient} text-white p-6`}>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">{config.icon}</svg>
            </div>
            <div>
              <h3 className="text-xl font-bold">{config.title}</h3>
              <p className={`${config.textLight} text-sm mt-0.5`}>{config.desc}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('location')} <span className="text-red-500">*</span></label>
              <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                <option value="">{t('select_location')}</option>
                {rooms.map(room => (
                  <option key={room.room_id} value={room.room_name}>{room.room_name} {room.room_building ? `(${room.room_building})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('date')} <span className="text-red-500">*</span></label>
              <input type="date" required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
          </div>

          {error.includes('⚠️') && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 dark:bg-red-900/20 dark:border-red-800">
               <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               <div className="text-sm font-bold text-red-700 dark:text-red-400">{error}</div>
            </div>
          )}

          {type === 'area' && formData.location && !error.includes('⚠️') && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                      {t('attendance_check')} - 10 {t('score')}
                  </h4>
                  {responsibleStudents.length > 0 ? (
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                          <div className="flex justify-between items-center mb-4">
                              <p className="text-sm text-slate-600 dark:text-slate-400">เช็คชื่อนักเรียนที่มาทำเวร:</p>
                              <div className="flex gap-2">
                                  <button type="button" onClick={() => setAllAttendance(true)} className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200">{t('student_present')}</button>
                                  <button type="button" onClick={() => setAllAttendance(false)} className="text-xs px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300">{t('student_absent')}</button>
                              </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {responsibleStudents.map(student => (
                                  <button key={student.id} type="button" onClick={() => toggleAttendance(student.id)} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${student.present ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700'}`}>
                                      <span className="font-medium text-sm">{student.name}</span>
                                      {student.present && <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>}
                                  </button>
                              ))}
                          </div>
                      </div>
                  ) : (
                      <p className="text-sm text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100 dark:bg-amber-900/20 dark:border-amber-800">ไม่พบข้อมูลนักเรียนที่รับผิดชอบในโซนนี้</p>
                  )}
              </div>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <h4 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              {t('rubric_title')}
            </h4>
            <div className="space-y-10">
              {criteria.map((criterion, idx) => (
                <div key={criterion.criterion_id} className="fade-in">
                  <div className="mb-4">
                    <label className="block text-base font-black text-slate-800 dark:text-white mb-1 uppercase tracking-tight">{idx + 1}. {getDisplay(criterion.criterion_name)}</label>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{getDisplay(criterion.criterion_description)}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {[5, 4, 3, 2, 1].map(score => {
                      const rubricDescription = getDisplay(criterion[`rubric_${score}`]);
                      const isSelected = scores[criterion.criterion_id] === score;
                      
                      return (
                        <label key={score} className="cursor-pointer group block">
                          <input 
                            type="radio" 
                            name={criterion.criterion_id} 
                            value={score} 
                            className="peer hidden" 
                            checked={isSelected} 
                            onChange={() => handleScoreChange(criterion.criterion_id, score)} 
                            required={idx === 0} 
                          />
                          <div className={`flex items-start gap-4 p-4 border-2 rounded-2xl transition-all duration-300 ${isSelected 
                            ? `border-${config.color}-500 bg-${config.color}-50 dark:bg-${config.color}-900/20 shadow-md` 
                            : 'border-slate-100 bg-white hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700'}`}>
                            
                            <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-black text-xl shadow-sm transition-transform group-hover:scale-105 ${isSelected ? scoreColors[score] : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}>
                              {score}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-sm font-bold ${isSelected ? `text-${config.color}-700 dark:text-${config.color}-400` : 'text-slate-700 dark:text-slate-300'}`}>
                                  {t('level')}: {scoreLabels[score]}
                                </span>
                                {isSelected && (
                                  <span className={`w-2 h-2 rounded-full animate-pulse bg-${config.color}-500`}></span>
                                )}
                              </div>
                              <p className={`text-xs leading-relaxed ${isSelected ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-500'}`}>
                                {rubricDescription || 'No rubric description provided'}
                              </p>
                            </div>
                            
                            {isSelected && (
                              <div className={`text-${config.color}-500 self-center`}>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
              <span>{t('upload_photos')}</span>
              {processing && <span className="text-xs text-indigo-600 animate-pulse font-bold">{t('loading')}</span>}
            </h4>
            <div className={`border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 transition-colors ${processedImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-400'}`}>
              <input type="file" id="images" accept="image/*" multiple className="hidden" onChange={handleImageChange} disabled={processedImages.length >= 5 || processing} />
              <label htmlFor="images" className="cursor-pointer block">
                <svg className="w-10 h-10 mx-auto text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('click_upload')}</p>
                <p className="text-[10px] text-slate-400 mt-1">{t('watermark_info')}</p>
              </label>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
              {processedImages.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                  <img src={src} className="w-full h-full object-cover" alt="Processed" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
              ))}
            </div>
            {processedImages.length < 3 && (
              <p className="mt-3 text-xs font-bold text-rose-500 animate-pulse flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {language === 'th' ? 'กรุณาอัปโหลดรูปภาพหลักฐานอย่างน้อย 3 รูป (3-5 รูป)' : 'Please upload at least 3 evidence photos (3-5 photos)'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('remarks')}</label>
            <textarea rows={2} placeholder="..." className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})}></textarea>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" className="flex-1 px-6 py-3 text-slate-600 font-semibold rounded-xl bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" onClick={() => { if(confirm('Clear?')) window.location.reload(); }}>{t('clear')}</button>
            <button type="submit" disabled={submitting || processing || rooms.length === 0 || error.includes('⚠️')} className="flex-[2] btn-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50">
              {submitting ? t('saving') : t('save_assessment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
