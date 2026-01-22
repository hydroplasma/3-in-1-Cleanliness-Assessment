
import React, { useState } from 'react';
import { AnyData, Assessment } from '../types';
import AssessmentDetailModal from './AssessmentDetailModal';
import { useLanguage } from '../services/i18n';

interface DashboardProps {
  allData: AnyData[];
  setActivePage: (page: string) => void;
}

export default function Dashboard({ allData, setActivePage }: DashboardProps) {
  const { t } = useLanguage();
  const assessments = allData.filter((d): d is Assessment => d.type === 'assessment');
  const totalAssessments = assessments.length;

  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  const recent = [...assessments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3);

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

  return (
    <div className="page-content fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('overview')} ({t('dashboard')})</h2>
        <p className="text-slate-500 mt-1">{t('overview_desc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card card-hover rounded-2xl p-6 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">+5.2%</span>
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
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">+8.1%</span>
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
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">-2.3%</span>
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
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">+12%</span>
          </div>
          <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-1">{t('total_assessments')}</h3>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{totalAssessments}</span>
            <span className="text-sm text-slate-400 mb-1">{t('times_this_month')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('trends')}</h3>
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
              <option>6 Month History</option>
              <option>3 Month History</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-around px-4 gap-3">
            <div className="flex flex-col items-center flex-1">
              <div className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-xl" style={{height: '140px'}}></div>
              <span className="text-xs text-slate-500 mt-2 font-medium">{t('jan')}</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-xl" style={{height: '160px'}}></div>
              <span className="text-xs text-slate-500 mt-2 font-medium">{t('feb')}</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-xl" style={{height: '135px'}}></div>
              <span className="text-xs text-slate-500 mt-2 font-medium">{t('mar')}</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-xl" style={{height: '170px'}}></div>
              <span className="text-xs text-slate-500 mt-2 font-medium">{t('apr')}</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="w-full bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t-xl shadow-lg" style={{height: '190px'}}></div>
              <span className="text-xs text-slate-700 mt-2 font-bold dark:text-slate-300">{t('may')}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t('top_scorers')}</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-transparent border border-amber-100 dark:from-amber-900/10 dark:border-amber-900/30 transition-colors">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white font-bold shadow-lg">1</div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white">Room 3A</h4>
                <p className="text-xs text-slate-500">Classroom • Bldg A</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-emerald-600">98</span>
                <p className="text-xs text-slate-400">{t('score')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 transition-colors">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-white font-bold">2</div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white">Zone A1</h4>
                <p className="text-xs text-slate-500">Area Zone • Floor 1</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-emerald-600">95</span>
                <p className="text-xs text-slate-400">{t('score')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 transition-colors">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 text-white font-bold">3</div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white">Room 2B</h4>
                <p className="text-xs text-slate-500">Classroom • Bldg B</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-emerald-600">94</span>
                <p className="text-xs text-slate-400">{t('score')}</p>
              </div>
            </div>
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
                  <span className="text-[10px] text-slate-400 font-bold">{new Date(a.date).toLocaleDateString('th-TH')}</span>
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
    </div>
  );
}
