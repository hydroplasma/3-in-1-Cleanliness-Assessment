
import React, { useState, useMemo, useEffect } from 'react';
import { AnyData, Assessment, Room } from '../types';
import AssessmentDetailModal from './AssessmentDetailModal';
import { useLanguage } from '../services/i18n';

interface DashboardProps {
  allData: AnyData[];
  setActivePage: (page: string) => void;
}

export default function Dashboard({ allData, setActivePage }: DashboardProps) {
  const { t, language } = useLanguage();
  const assessments = allData.filter((d): d is Assessment => d.type === 'assessment');
  const rooms = allData.filter((d): d is Room => d.type === 'room');
  const totalAssessments = assessments.length;

  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showPendingPopup, setShowPendingPopup] = useState(false);

  // Get recent assessments - sorted by date then created_at from newest to oldest
  const recent = useMemo(() => {
    return [...assessments]
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 3);
  }, [assessments]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'area': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'classroom': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'restroom': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-700';
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const calculateAvg = (type: string) => {
    const typeAssessments = assessments.filter(a => a.assessment_type === type);
    if (!typeAssessments.length) return 0;
    return (typeAssessments.reduce((sum, a) => sum + a.score, 0) / typeAssessments.length).toFixed(1);
  };

  // Logic for Dynamic Trends (Last 5 Months)
  const getTrendData = () => {
    const months = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toISOString().substring(0, 7); // YYYY-MM
      const monthLabel = d.toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH', { month: 'short' });
      
      const monthAssessments = assessments.filter(a => a.date.startsWith(monthStr));
      const avg = monthAssessments.length 
        ? monthAssessments.reduce((sum, a) => sum + a.score, 0) / monthAssessments.length 
        : 0;
      
      months.push({ label: monthLabel, avg, isCurrent: i === 0 });
    }
    return months;
  };

  const trendData = getTrendData();

  // Logic for Dynamic Top Scorers (Top 3 Locations)
  const getTopScorers = () => {
    const locationScores: Record<string, { total: number, count: number, type: string }> = {};
    
    assessments.forEach(a => {
      if (!locationScores[a.location]) {
        locationScores[a.location] = { total: 0, count: 0, type: a.assessment_type };
      }
      locationScores[a.location].total += a.score;
      locationScores[a.location].count += 1;
    });

    return Object.entries(locationScores)
      .map(([name, data]) => ({
        name,
        avg: Math.round(data.total / data.count),
        type: data.type,
        room: rooms.find(r => r.room_name === name)
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3);
  };

  const topScorers = getTopScorers();

  // Logic for Top Assessors (New Feature for Motivation)
  const getTopAssessors = () => {
    const assessorStats: Record<string, { count: number, lastDate: string }> = {};
    assessments.forEach(a => {
      if (!assessorStats[a.evaluator]) {
        assessorStats[a.evaluator] = { count: 0, lastDate: '' };
      }
      assessorStats[a.evaluator].count += 1;
      if (a.date > assessorStats[a.evaluator].lastDate) {
        assessorStats[a.evaluator].lastDate = a.date;
      }
    });

    return Object.entries(assessorStats)
      .map(([name, data]) => ({ name, count: data.count, lastDate: data.lastDate }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const topAssessors = getTopAssessors();

  // Logic for Pending Tasks (For the logged-in user)
  const getPendingTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayAssessments = assessments.filter(a => a.date === today);
    const assessedLocations = new Set(todayAssessments.map(a => a.location));
    
    // In a real app, we'd filter by currentUser's assigned locations
    // For now, let's show all unassessed rooms to create a sense of collective responsibility
    return rooms.filter(r => !assessedLocations.has(r.room_name));
  };

  const pendingTasks = getPendingTasks();

  // Show pending tasks popup on first load if there are pending tasks
  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('has_seen_pending_popup');
    if (!hasSeenPopup && pendingTasks.length > 0) {
      setShowPendingPopup(true);
      sessionStorage.setItem('has_seen_pending_popup', 'true');
    }
  }, [pendingTasks.length]);

  return (
    <div className="page-content fade-in">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('overview')} ({t('dashboard')})</h2>
          <p className="text-slate-500 mt-1">{t('overview_desc')}</p>
        </div>
        {pendingTasks.length > 0 && (
          <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl flex items-center gap-3 animate-pulse">
            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
            <span className="text-xs font-bold text-rose-600">วันนี้เหลืออีก {pendingTasks.length} จุดที่ยังไม่ได้ตรวจ!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card card-hover rounded-2xl p-6 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-1">{t('assessment_area')}</h3>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{calculateAvg('area') || '0.0'}</span>
            <span className="text-sm text-slate-400 mb-1">/ 100</span>
          </div>
        </div>
        <div className="stat-card card-hover rounded-2xl p-6 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-1">{t('assessment_classroom')}</h3>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{calculateAvg('classroom') || '0.0'}</span>
            <span className="text-sm text-slate-400 mb-1">/ 100</span>
          </div>
        </div>
        <div className="stat-card card-hover rounded-2xl p-6 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-1">{t('assessment_restroom')}</h3>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{calculateAvg('restroom') || '0.0'}</span>
            <span className="text-sm text-slate-400 mb-1">/ 100</span>
          </div>
        </div>
        <div className="stat-card card-hover rounded-2xl p-6 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-1">{t('total_assessments')}</h3>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{totalAssessments}</span>
            <span className="text-sm text-slate-400 mb-1">{t('times_this_month')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 transition-colors lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('trends')}</h3>
          </div>
          <div className="h-64 flex items-end justify-around px-4 gap-3">
            {trendData.map((m, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 group relative">
                <div 
                  className={`w-full ${m.isCurrent ? 'bg-gradient-to-t from-emerald-500 to-emerald-300 shadow-lg' : 'bg-gradient-to-t from-blue-500 to-blue-300'} rounded-t-xl transition-all duration-1000`} 
                  style={{ height: `${Math.max(m.avg * 2, 4)}px` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {Math.round(m.avg)}
                  </div>
                </div>
                <span className={`text-[10px] ${m.isCurrent ? 'text-slate-900 font-bold dark:text-white' : 'text-slate-500 font-medium'} mt-2`}>{m.label}</span>
              </div>
            ))}
          </div>
          {totalAssessments === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] rounded-2xl pointer-events-none">
              <p className="text-slate-400 text-sm font-bold italic">{t('no_data')}</p>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">🏆 ผู้ตรวจดีเด่น (Top Assessors)</h3>
          </div>
          <div className="space-y-4">
            {topAssessors.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic text-sm">
                ยังไม่มีข้อมูลผู้ตรวจ
              </div>
            ) : (
              topAssessors.map((assessor, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-indigo-200 transition-all">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : 'bg-orange-400'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{assessor.name}</p>
                    <p className="text-[10px] text-slate-500">ตรวจล่าสุด: {new Date(assessor.lastDate).toLocaleDateString('th-TH')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-indigo-600">{assessor.count}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">ครั้ง</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
              💡 <b>เคล็ดลับ:</b> การตรวจที่สม่ำเสมอช่วยให้โรงเรียนสะอาดขึ้น และคุณจะได้รับการจัดอันดับที่สูงขึ้น!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 transition-colors flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-rose-600">📍 จุดที่ยังไม่ได้ตรวจวันนี้</h3>
            <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded-full">{pendingTasks.length} จุด</span>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
            {pendingTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                </div>
                <p className="text-slate-900 dark:text-white font-bold">ยอดเยี่ยม! ตรวจครบทุกจุดแล้ว</p>
                <p className="text-xs text-slate-500 mt-1">ขอบคุณที่ปฏิบัติหน้าที่อย่างแข็งขัน</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {pendingTasks.map((task, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${task.room_type === 'area' ? 'bg-blue-500' : task.room_type === 'classroom' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                      <div>
                        <p className="text-sm font-bold text-rose-600">{task.room_name}</p>
                        <p className="text-[10px] text-rose-400 uppercase">{task.room_type || 'classroom'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActivePage(`assessment-${task.room_type || 'classroom'}`)}
                      className="text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all"
                    >
                      ไปตรวจเลย
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t('top_scorers')}</h3>
          <div className="space-y-4">
            {topScorers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic text-sm">
                {t('no_data')}
              </div>
            ) : (
              topScorers.map((s, idx) => (
                <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${idx === 0 ? 'bg-gradient-to-r from-amber-50 to-transparent border-amber-100 dark:from-amber-900/10 dark:border-amber-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'}`}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold shadow-lg ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' : idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' : 'bg-gradient-to-br from-orange-300 to-orange-400 text-white'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-white">{s.name}</h4>
                    <p className="text-xs text-slate-500 capitalize">{s.type} • {s.room?.room_building || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-emerald-600">{s.avg}</span>
                    <p className="text-xs text-slate-400">{t('score')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('recent_assessments')}</h3>
          <button 
            className="text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition-colors"
            onClick={() => setActivePage('report')}
          >
            {t('view_all')} →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recent.length === 0 ? (
            <div className="text-center py-8 col-span-full text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-sm">{t('no_data')}</p>
            </div>
          ) : (
            recent.map((a, idx) => (
              <div 
                key={idx} 
                className="border border-slate-100 rounded-xl p-4 hover:border-indigo-400 hover:shadow-lg transition-all bg-white cursor-pointer group dark:bg-slate-800 dark:border-slate-700"
                onClick={() => setSelectedAssessment(a)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] ${getTypeColor(a.assessment_type)} px-2.5 py-1 rounded-full font-bold uppercase tracking-wider`}>{getTypeLabel(a.assessment_type)}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{new Date(a.date).toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH')}</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">{a.location}</h4>
                <p className="text-[10px] text-slate-500 mb-3">{t('by')} {a.evaluator}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`text-2xl font-black ${getScoreColor(a.score)}`}>{a.score}</span>
                    <span className="text-slate-400 text-[10px] ml-1 font-bold uppercase">{t('score')}</span>
                  </div>
                  {a.image_count > 0 && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      <span className="text-[10px] font-bold">{a.image_count}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AssessmentDetailModal 
        isOpen={!!selectedAssessment} 
        onClose={() => setSelectedAssessment(null)} 
        assessment={selectedAssessment} 
        allData={allData} 
      />

      {showPendingPopup && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h3 className="text-2xl font-black text-rose-600 mb-2">จุดที่ยังไม่ได้ตรวจวันนี้</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">วันนี้เหลืออีก <span className="text-rose-600 font-bold">{pendingTasks.length} จุด</span> ที่ยังไม่ได้รับการประเมิน</p>
            
            <div className="text-left bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl mb-6 border border-slate-100 dark:border-slate-700 max-h-48 overflow-y-auto custom-scrollbar">
              {pendingTasks.map((task, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${task.room_type === 'area' ? 'bg-blue-500' : task.room_type === 'classroom' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  <span className="text-sm font-bold text-rose-600 truncate">{task.room_name}</span>
                  <span className="text-[10px] text-rose-400 uppercase ml-auto">{task.room_type || 'classroom'}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowPendingPopup(false)} 
              className="w-full btn-primary text-white py-4 rounded-2xl font-black shadow-xl text-lg transform active:scale-95 transition-all"
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
