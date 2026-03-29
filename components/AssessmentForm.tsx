
import React, { useState, useEffect, useMemo } from 'react';
import { AnyData, CurrentUser, Criterion, Assessment, Room, User, SystemSettings } from '../types';
import { dataService } from '../services/dataService';
import { useLanguage } from '../services/i18n';
import ConfirmationModal from './ConfirmationModal';

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
  const { t, language } = useLanguage();

  const config = {
    area: {
      title: t('assessment_area'),
      desc: 'ให้คะแนนความสะอาดของพื้นที่ภายนอกและโซนที่ได้รับมอบหมาย',
      gradient: 'from-blue-600 to-indigo-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
      color: 'blue',
      textLight: 'text-blue-100'
    },
    classroom: {
      title: t('assessment_classroom'),
      desc: 'ให้คะแนนความสะอาดและความเป็นระเบียบภายในห้องเรียน',
      gradient: 'from-emerald-600 to-teal-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
      color: 'emerald',
      textLight: 'text-emerald-100'
    },
    restroom: {
      title: t('assessment_restroom'),
      desc: 'ให้คะแนนความสะอาดและสุขอนามัยของห้องน้ำ',
      gradient: 'from-amber-600 to-orange-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
      color: 'amber',
      textLight: 'text-amber-100'
    }
  }[type];

  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    location: '',
    date: getLocalDate(),
    remarks: '',
  });
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [responsibleStudents, setResponsibleStudents] = useState<StudentAttendance[]>([]);

  const criteria = allData.filter((d): d is Criterion => d.type === 'criterion' && d.criterion_type === type);
  const allRooms = allData.filter((d): d is Room => d.type === 'room');
  const systemSettings = allData.find(d => d.type === 'settings') as SystemSettings | undefined;
  
  const unassessedLocations = useMemo(() => {
    const existingAssessments = allData.filter((d): d is Assessment => d.type === 'assessment' && d.date === formData.date);
    const assessedLocations = new Set(existingAssessments.map(a => a.location));
    
    if (showSuccessModal) {
      assessedLocations.add(formData.location);
    }

    const pending = allRooms.filter(r => !assessedLocations.has(r.room_name));
    const users = allData.filter((d): d is User => d.type === 'user');

    const mapWithEvaluators = (roomsToMap: Room[]) => {
        return roomsToMap.map(r => {
            const assignedUsers = users.filter(u => u.assigned_locations?.includes(r.room_name));
            const evaluators = assignedUsers.length > 0 ? assignedUsers.map(u => u.user_name).join(', ') : 'ไม่มีผู้รับผิดชอบ';
            return { ...r, evaluators };
        });
    };

    return {
      area: mapWithEvaluators(pending.filter(r => r.room_type === 'area')),
      classroom: mapWithEvaluators(pending.filter(r => r.room_type === 'classroom' || !r.room_type)),
      restroom: mapWithEvaluators(pending.filter(r => r.room_type === 'restroom'))
    };
  }, [allData, allRooms, formData.date, formData.location, showSuccessModal]);

  const rooms = useMemo(() => {
    const typeFilteredRooms = allRooms.filter(r => (r.room_type || (type === 'classroom' ? 'classroom' : type)) === type);
    return typeFilteredRooms.filter(r => {
        if (currentUser.role === 'admin' || currentUser.role === 'teacher') return true;
        if (currentUser.assigned_locations && currentUser.assigned_locations.length > 0) {
            return currentUser.assigned_locations.includes(r.room_name);
        }
        if (currentUser.role === 'student_council') {
            if (currentUser.user_class && r.responsible_class === currentUser.user_class) return false;
            return true;
        }
        return false;
    });
  }, [allData, type, currentUser.role, currentUser.assigned_locations, currentUser.user_class]);

  const getDisplay = (field: any) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    const mappedLang = language === 'is' ? 'isan' : language;
    return field[mappedLang] || field['th'] || field['en'] || '';
  };

  useEffect(() => {
    setError('');
    // Logic: Only block classroom and restroom from daily duplicate
    // For "Area", block only if "allowMultipleDailyAreas" is false
    const allowMultipleArea = systemSettings?.allowMultipleDailyAreas || false;
    
    if (formData.location && formData.date) {
      const existingAssessments = allData.filter((d): d is Assessment => d.type === 'assessment');
      const isDuplicate = existingAssessments.some(a => 
        a.location === formData.location && 
        a.assessment_type === type && 
        a.date === formData.date
      );

      if (isDuplicate) {
          if (type === 'area' && allowMultipleArea) {
              // Show warning but don't strictly block in UI if settings allow
              setError(`🔔 แจ้งเตือน: เขตพื้นที่ "${formData.location}" ถูกประเมินไปแล้ว แต่โหมดประเมินหลายคนเปิดอยู่ คุณสามารถส่งซ้ำได้`);
          } else {
              setError(`⚠️ ${t('duplicate_alert')}: "${formData.location}" (วันนี้มีการบันทึกไปแล้ว)`);
          }
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
  }, [formData.location, formData.date, type, allData, t, rooms, systemSettings]);

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
            if (width > height) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            else { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width; canvas.height = height;
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
          const padding = 20; const rectPadding = 15;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(width - textMetrics.width - padding - rectPadding, height - fontSize - padding - rectPadding, textMetrics.width + (rectPadding * 2), fontSize + (rectPadding * 2));
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(watermarkText, width - textMetrics.width - padding, height - padding - 5);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
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
      } catch (err) {
        showToast('Error processing images', 'error');
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

  const toggleAttendance = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      setResponsibleStudents(prev => prev.map(s => s.id === id ? { ...s, present: !s.present } : s));
  };

  const setAllAttendance = (e: React.MouseEvent, present: boolean) => {
      e.preventDefault();
      setResponsibleStudents(prev => prev.map(s => ({ ...s, present })));
  };

  const sendTelegramNotification = async (assessmentData: any) => {
    const settings = allData.find(d => d.type === 'settings') as SystemSettings;
    if (!settings || !settings.telegram_token || !settings.telegram_chat_id) return;

    try {
        const scoreIcon = assessmentData.score >= 80 ? '🟢' : assessmentData.score >= 60 ? '🟡' : '🔴';
        const message = `✅ *บันทึกสำเร็จ*\n📍 *สถานที่:* ${assessmentData.location}\n📊 *ประเภท:* ${t(assessmentData.assessment_type === 'area' ? 'assessment_area' : assessmentData.assessment_type === 'classroom' ? 'assessment_classroom' : 'assessment_restroom')}\n${scoreIcon} *คะแนน:* ${assessmentData.score} / 100\n👤 *ผู้ประเมิน:* ${assessmentData.evaluator}\n📅 *วันที่:* ${new Date(assessmentData.date).toLocaleDateString('th-TH')}`;

        await fetch(`https://api.telegram.org/bot${settings.telegram_token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: settings.telegram_chat_id,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (assessmentData.images && assessmentData.images.length > 0) {
            const imagesToSend = assessmentData.images.slice(0, 1); // Send 1 for quick alert
            for (let i = 0; i < imagesToSend.length; i++) {
                const imgData = imagesToSend[i];
                const res = await fetch(imgData);
                const blob = await res.blob();
                const formData = new FormData();
                formData.append('chat_id', settings.telegram_chat_id);
                formData.append('photo', blob, `evidence.jpg`);
                await fetch(`https://api.telegram.org/bot${settings.telegram_token}/sendPhoto`, {
                    method: 'POST',
                    body: formData
                });
            }
        }
    } catch (e) {
        console.error("Failed to send Telegram alert", e);
    }
  };

  const processSubmission = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    showLoading("กำลังบันทึกข้อมูล...");

    try {
        let finalPercentage = 0;
        let attendancePoints = 0;
        let criteriaSum = 0;
        let maxCriteria = criteria.length * 5;
        let rawScore = 0;
        let maxScore = 0;

        const scoreValues = criteria.map(c => scores[c.criterion_id] || 0);
        criteriaSum = scoreValues.reduce((a, b) => a + b, 0);

        if (type === 'area') {
            const presentCount = responsibleStudents.filter(s => s.present).length;
            const totalStudents = responsibleStudents.length;
            attendancePoints = totalStudents > 0 ? (presentCount / totalStudents) * 10 : 0;
            const criteriaPoints = maxCriteria > 0 ? (criteriaSum / maxCriteria) * 20 : 0;
            rawScore = attendancePoints + criteriaPoints;
            maxScore = 30;
            finalPercentage = Math.round((rawScore / maxScore) * 100);
        } else {
            rawScore = criteriaSum;
            maxScore = maxCriteria;
            finalPercentage = Math.round((rawScore / maxScore) * 100);
        }

        const criteriaSnapshot = criteria.map(c => {
            const score = scores[c.criterion_id];
            return {
                id: c.criterion_id,
                name: c.criterion_name,
                description: c.criterion_description,
                score: score,
                rubric: c[`rubric_${score}`]
            };
        });

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
          score: finalPercentage, 
          raw_score: parseFloat(rawScore.toFixed(2)), 
          max_score: maxScore, 
          attendance_data: type === 'area' ? responsibleStudents : undefined,
          attendance_score: type === 'area' ? responsibleStudents.filter(s => s.present).length : undefined,
          attendance_points: type === 'area' ? parseFloat(attendancePoints.toFixed(2)) : undefined,
          criteria_snapshot: criteriaSnapshot,
          status: finalPercentage >= 80 ? 'excellent' : finalPercentage >= 60 ? 'good' : 'needs_improvement',
          created_at: new Date().toISOString(),
          ...criteria.reduce((acc, c) => ({...acc, [`criterion_${c.criterion_id}_score`]: scores[c.criterion_id]}), {})
        };

        const result = await dataService.create(assessmentData);
        sendTelegramNotification(assessmentData);
        await new Promise(resolve => setTimeout(resolve, 1500));
        hideLoading();

        if (result.isOk) {
          setShowSuccessModal(true);
        } else {
          showToast(t('error_save'), 'error');
          setSubmitting(false);
        }
    } catch (err) {
        hideLoading();
        showToast('Submission failed', 'error');
        setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict block logic
    const allowMultipleArea = systemSettings?.allowMultipleDailyAreas || false;
    const isStrictError = error.includes('⚠️');

    if (isStrictError) {
      showToast('วันนี้มีการบันทึกสถานที่นี้ไปแล้ว', 'error');
      return;
    }

    const answeredCount = Object.keys(scores).filter(k => scores[k] > 0).length;
    if (answeredCount < criteria.length) {
      showToast('กรุณาประเมินให้ครบทุกหัวข้อ', 'error');
      return;
    }

    if (processedImages.length < 3) {
      showToast('กรุณาอัปโหลดรูปภาพอย่างน้อย 3 รูป', 'error');
      return;
    }

    setShowConfirmModal(true);
  };

  const scoreColors: Record<number, string> = { 
    5: 'bg-emerald-600 text-white', 4: 'bg-emerald-500 text-white', 
    3: 'bg-indigo-500 text-white', 2: 'bg-amber-500 text-white', 1: 'bg-rose-500 text-white' 
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

          {error && <div className={`p-4 border rounded-xl text-sm font-bold ${error.includes('⚠️') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700 italic'}`}>{error}</div>}

          {type === 'area' && formData.location && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                      เช็คชื่อเวรนักเรียน (10 คะแนน)
                  </h4>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 dark:bg-slate-800">
                      <div className="flex gap-2 mb-4">
                          <button type="button" onClick={(e) => setAllAttendance(e, true)} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold hover:bg-emerald-200 transition-colors">มาเหมิด</button>
                          <button type="button" onClick={(e) => setAllAttendance(e, false)} className="text-xs px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 font-bold hover:bg-rose-200 transition-colors">ขาดเหมิด</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {responsibleStudents.map(student => (
                              <button key={student.id} type="button" onClick={(e) => toggleAttendance(e, student.id)} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${student.present ? 'bg-emerald-500 border-emerald-300 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                  <span className="font-bold text-sm">{student.name}</span>
                                  {student.present ? (
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                                  ) : (
                                    <div className="w-4 h-4 border-2 border-slate-200 rounded-full"></div>
                                  )}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <h4 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              เกณฑ์คะแนน (ระดับ 1-5)
            </h4>
            <div className="space-y-10">
              {criteria.map((criterion, idx) => {
                const selectedScore = scores[criterion.criterion_id] || 0;
                return (
                  <div key={criterion.criterion_id} className="relative">
                    <div className="mb-4">
                      <label className="block text-base font-black text-slate-800 dark:text-white mb-1">
                        {idx + 1}. {getDisplay(criterion.criterion_name)}
                      </label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{getDisplay(criterion.criterion_description)}</p>
                    </div>
                    <div className="flex flex-row-reverse gap-2 mb-3">
                      {[5, 4, 3, 2, 1].map(score => (
                        <button
                          type="button" key={score}
                          onClick={() => handleScoreChange(criterion.criterion_id, score)}
                          className={`flex-1 min-w-[50px] py-4 rounded-2xl font-black text-2xl transition-all border-2 ${
                            selectedScore === score 
                              ? `${scoreColors[score]} border-white ring-4 ring-indigo-500/30 scale-105 shadow-xl` 
                              : 'bg-white border-slate-100 text-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    {selectedScore > 0 && (
                      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border-l-4 border-indigo-600 animate-fadeIn">
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">รูบริกระดับ {selectedScore}</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium italic">"{getDisplay(criterion[`rubric_${selectedScore}`])}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">รูปถ่ายหลักฐาน (3-5 รูป)</h4>
            <div className={`border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 dark:bg-slate-800 transition-colors ${processedImages.length >= 5 ? 'opacity-50' : 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30'}`}>
              <input type="file" id="images" accept="image/*" multiple className="hidden" onChange={handleImageChange} disabled={processedImages.length >= 5 || processing} />
              <label htmlFor="images" className="cursor-pointer block">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                    <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                </div>
                <p className="text-sm font-black text-slate-700 dark:text-slate-300">คลิกถ่ายภาพ/อัปโหลด</p>
                <p className="text-xs text-slate-400 mt-1 font-bold">ลายน้ำอัตโนมัติ 📍 {formData.location || '...'}</p>
              </label>
            </div>
            
            {processedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
                {processedImages.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 shadow-md group">
                    <img src={src} className="w-full h-full object-cover" alt="Preview" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1.5 right-1.5 bg-rose-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">หมายเหตุ</label>
             <textarea className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white" rows={3} placeholder="สิ่งที่พบเห็น..." value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})}></textarea>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button type="button" className="flex-1 px-6 py-4 text-slate-500 font-bold rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors" onClick={() => setShowClearConfirm(true)}>{t('clear')}</button>
            <button type="submit" disabled={submitting || processing || rooms.length === 0} className="flex-[2] btn-primary text-white px-8 py-4 rounded-2xl font-black shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 transition-all text-lg">
              {submitting ? 'กำลังส่งข้อมูล...' : 'ส่งผลการประเมิน'}
            </button>
          </div>
        </form>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center my-8">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">ส่งผลสำเร็จ!</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">ผู้ตรวจ: {currentUser.userName}</p>
                
                <div className="text-left bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl mb-6 border border-slate-100 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    สถานที่ที่ยังไม่ได้ตรวจวันนี้
                  </h4>
                  
                  <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {unassessedLocations.area.length === 0 && unassessedLocations.classroom.length === 0 && unassessedLocations.restroom.length === 0 ? (
                      <p className="text-sm text-emerald-600 font-bold text-center py-2">🎉 ตรวจครบทุกสถานที่แล้ว!</p>
                    ) : (
                      <>
                        {unassessedLocations.area.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">เขตพื้นที่</p>
                            <div className="flex flex-col gap-1.5">
                              {unassessedLocations.area.map(r => (
                                <div key={r.room_id} className="text-xs px-2.5 py-2 bg-blue-50 border border-blue-100 text-blue-800 rounded-lg font-medium flex justify-between items-center">
                                  <span>{r.room_name}</span>
                                  <span className="text-blue-600 text-[10px] bg-blue-100 px-2 py-0.5 rounded-full text-right max-w-[50%] truncate">{r.evaluators}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {unassessedLocations.classroom.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ห้องเรียน</p>
                            <div className="flex flex-col gap-1.5">
                              {unassessedLocations.classroom.map(r => (
                                <div key={r.room_id} className="text-xs px-2.5 py-2 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg font-medium flex justify-between items-center">
                                  <span>{r.room_name}</span>
                                  <span className="text-emerald-600 text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full text-right max-w-[50%] truncate">{r.evaluators}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {unassessedLocations.restroom.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ห้องน้ำ</p>
                            <div className="flex flex-col gap-1.5">
                              {unassessedLocations.restroom.map(r => (
                                <div key={r.room_id} className="text-xs px-2.5 py-2 bg-amber-50 border border-amber-100 text-amber-800 rounded-lg font-medium flex justify-between items-center">
                                  <span>{r.room_name}</span>
                                  <span className="text-amber-600 text-[10px] bg-amber-100 px-2 py-0.5 rounded-full text-right max-w-[50%] truncate">{r.evaluators}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <button onClick={() => window.location.reload()} className="w-full btn-primary text-white py-4 rounded-2xl font-black shadow-xl text-lg transform hover:scale-105 active:scale-95 transition-all">ตกลง</button>
            </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">ยืนยันการส่งข้อมูล</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6 font-medium">คุณยืนยันส่งคะแนนประเมินสถานที่นี้หรือไม่?</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors dark:bg-slate-700">ยกเลิก</button>
                    <button onClick={processSubmission} className="flex-1 btn-primary text-white py-3 rounded-xl font-bold shadow-lg">ยืนยันส่ง</button>
                </div>
            </div>
        </div>
      )}

      <ConfirmationModal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} onConfirm={() => window.location.reload()} title="ยืนยันการล้างค่า" message="ต้องการล้างข้อมูลที่กรอกหรือไม่?" confirmText="ล้างค่า" type="warning" />
    </div>
  );
}
