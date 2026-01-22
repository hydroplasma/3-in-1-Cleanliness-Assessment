
import React, { useState } from 'react';
import { AnyData, Assessment, Room, SystemSettings } from '../types';
import { useLanguage } from '../services/i18n';

interface CertificatesProps {
  allData: AnyData[];
  settings: SystemSettings;
}

export default function Certificates({ allData, settings }: CertificatesProps) {
  const { t, language } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeCategory, setActiveCategory] = useState<'area' | 'classroom' | 'restroom'>('area');
  
  const assessments = allData.filter((d): d is Assessment => d.type === 'assessment');
  const rooms = allData.filter((d): d is Room => d.type === 'room');
  
  const monthlyData = assessments.filter(a => 
    a.date.startsWith(selectedMonth) && 
    a.assessment_type === activeCategory
  );
  
  const locations = Array.from(new Set(monthlyData.map(a => a.location)));
  const rankings = locations.map(loc => {
    const locAssessments = monthlyData.filter(a => a.location === loc);
    const avgScore = locAssessments.reduce((sum, a) => sum + a.score, 0) / locAssessments.length;
    const roomInfo = rooms.find(r => r.room_name === loc);
    return {
      name: loc,
      score: Math.round(avgScore),
      responsibleClass: roomInfo?.responsible_class || 'General',
      count: locAssessments.length,
      category: activeCategory
    };
  }).filter(r => r.score >= 80).sort((a, b) => b.score - a.score);

  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case 'area':
        return { label: t('assessment_area'), color: '#3b82f6' };
      case 'classroom':
        return { label: t('assessment_classroom'), color: '#10b981' };
      case 'restroom':
        return { label: t('assessment_restroom'), color: '#f59e0b' };
      default:
        return { label: '', color: '#C5A059' };
    }
  };

  const printCertificate = (rank: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const schoolName = settings?.school_name || 'School Name';
    const affiliation = settings?.school_affiliation || '';
    const executives = settings?.executives || t('cert_director');
    const details = getCategoryDetails(rank.category);
    const locale = language === 'th' ? 'th-TH' : language === 'is' ? 'th-TH' : 'en-US';

    printWindow.document.write(`
      <html>
        <head>
          <title>${t('cert_title')} - ${rank.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
            body { 
              margin: 0; padding: 0; font-family: 'Sarabun', sans-serif;
              display: flex; justify-content: center; align-items: center;
              height: 100vh; background: #fff;
            }
            .certificate {
              width: 297mm; height: 210mm; padding: 20mm; box-sizing: border-box;
              border: 15px double ${details.color}; position: relative; text-align: center;
              background: #fff;
            }
            .garuda { width: 80px; margin-bottom: 20px; }
            .school-name { font-size: 32pt; font-weight: bold; margin-bottom: 5px; }
            .recipient { font-size: 38pt; font-weight: bold; color: ${details.color}; margin: 20px 0; }
            .description { font-size: 18pt; line-height: 1.6; margin: 25px 40px; }
            .footer { margin-top: 50px; display: flex; justify-content: center; }
            .sign-area { text-align: center; width: 400px; }
            .line { border-bottom: 1px dotted #333; margin-bottom: 10px; }
            .date { font-size: 14pt; margin-top: 20px; }
            @media print {
              .certificate { border-color: ${details.color} !important; -webkit-print-color-adjust: exact; }
              .recipient { color: ${details.color} !important; }
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <img class="garuda" src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Garuda_emblem_of_Thailand.svg/512px-Garuda_emblem_of_Thailand.svg.png" />
            <div class="school-name">${schoolName}</div>
            <div style="font-size: 16pt;">${affiliation}</div>
            <div style="font-size: 20pt; margin-top: 20px;">${t('cert_certify')}</div>
            <div class="recipient">${rank.name}</div>
            <div class="description">
              ${t('cert_description')} <strong>${details.label}</strong><br/>
              ${t('cert_avg_score')} <strong>${rank.score} ${t('score')}</strong> (${rank.score >= 90 ? t('excellent') : t('very_good')})<br/>
              ${t('cert_month_of')} ${new Date(selectedMonth).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
            </div>
            <div class="footer">
              <div class="sign-area">
                <div style="margin-bottom: 40px;"></div>
                <div class="line"></div>
                <div>( ${executives} )</div>
                <div>${t('cert_director')}</div>
              </div>
            </div>
            <div class="date">${t('cert_issued_at')} ${new Date(issueDate).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="page-content fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('cert_print')}</h2>
        <p className="text-slate-500 mt-1">พิมพ์เกียรติบัตรแยกตามประเภทพื้นที่และกำหนดวันที่ออกเอกสาร</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-6 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">เลือกเดือนสรุปผล</label>
            <input 
              type="month" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">วันที่ระบุในเกียรติบัตร</label>
            <input 
              type="date" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setActiveCategory('area')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeCategory === 'area' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('assessment_area')}
              </button>
              <button 
                onClick={() => setActiveCategory('classroom')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeCategory === 'classroom' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('assessment_classroom')}
              </button>
              <button 
                onClick={() => setActiveCategory('restroom')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeCategory === 'restroom' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('assessment_restroom')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rankings.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl text-center border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('cert_no_data')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('cert_min_score')}</p>
          </div>
        ) : (
          rankings.map((r, i) => {
            const details = getCategoryDetails(r.category);
            return (
              <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 hover:shadow-xl transition-all group" style={{ borderTop: `8px solid ${details.color}` }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: `${details.color}20`, color: details.color }}>
                    {r.score >= 90 ? `🏆 ${t('excellent')}` : `🎖️ ${t('very_good')}`}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">{r.count} {t('total_assessments')}</div>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">{r.name}</h3>
                <p className="text-xs text-slate-500 mb-6">{t('by')}: {r.responsibleClass}</p>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl mb-6">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('cert_avg_score')}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{r.score}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6" style={{ color: details.color }} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </div>
                </div>
                
                <button 
                  onClick={() => printCertificate(r)}
                  className="w-full py-3 text-white rounded-2xl font-black shadow-lg transition-all text-xs flex items-center justify-center gap-2 transform active:scale-95"
                  style={{ backgroundColor: details.color }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  {t('cert_print')}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
