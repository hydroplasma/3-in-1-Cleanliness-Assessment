
import React, { useState } from 'react';
import { AnyData, Assessment, Room, SystemSettings } from '../types';
import { useLanguage } from '../services/i18n';

interface CertificatesProps {
  allData: AnyData[];
  settings: SystemSettings;
}

export default function Certificates({ allData, settings }: CertificatesProps) {
  const { t } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeCategory, setActiveCategory] = useState<'area' | 'classroom' | 'restroom'>('area');
  
  const assessments = allData.filter((d): d is Assessment => d.type === 'assessment');
  const rooms = allData.filter((d): d is Room => d.type === 'room');
  
  // Filter assessments for selected month and ACTIVE category only
  const monthlyData = assessments.filter(a => 
    a.date.startsWith(selectedMonth) && 
    a.assessment_type === activeCategory
  );
  
  // Group by location for the SELECTED category
  const locations = Array.from(new Set(monthlyData.map(a => a.location)));
  const rankings = locations.map(loc => {
    const locAssessments = monthlyData.filter(a => a.location === loc);
    const avgScore = locAssessments.reduce((sum, a) => sum + a.score, 0) / locAssessments.length;
    const roomInfo = rooms.find(r => r.room_name === loc);
    return {
      name: loc,
      score: Math.round(avgScore),
      responsibleClass: roomInfo?.responsible_class || 'ทั่วไป',
      count: locAssessments.length,
      category: activeCategory
    };
  }).filter(r => r.score >= 80).sort((a, b) => b.score - a.score);

  const getCategoryName = (cat: string) => {
    if (cat === 'area') return 'เขตพื้นที่รับผิดชอบ (Area Zone)';
    if (cat === 'classroom') return 'ห้องเรียน (Classroom)';
    return 'ห้องน้ำ (Restroom)';
  };

  const printCertificate = (rank: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const schoolName = settings?.school_name || 'โรงเรียนน้ำคำวิทยา';
    const affiliation = settings?.school_affiliation || '';
    const executives = settings?.executives || 'ผู้อำนวยการโรงเรียน';

    printWindow.document.write(`
      <html>
        <head>
          <title>เกียรติบัตร - ${rank.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
            body { 
              margin: 0; padding: 0; font-family: 'Sarabun', sans-serif;
              display: flex; justify-content: center; align-items: center;
              height: 100vh; background: #fff;
            }
            .certificate {
              width: 297mm; height: 210mm; padding: 20mm; box-sizing: border-box;
              border: 15px double #C5A059; position: relative; text-align: center;
            }
            .garuda { width: 80px; margin-bottom: 20px; }
            .school-name { font-size: 32pt; font-weight: bold; margin-bottom: 10px; }
            .recipient { font-size: 40pt; font-weight: bold; color: #8B7355; margin: 20px 0; }
            .description { font-size: 18pt; line-height: 1.6; margin: 30px 50px; }
            .footer { margin-top: 60px; display: flex; justify-content: space-around; align-items: flex-end; }
            .sign-area { text-align: center; width: 300px; }
            .line { border-bottom: 1px dotted #333; margin-bottom: 10px; }
            .date { font-size: 14pt; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="certificate">
            <img class="garuda" src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Garuda_emblem_of_Thailand.svg/512px-Garuda_emblem_of_Thailand.svg.png" />
            <div class="school-name">${schoolName}</div>
            <div style="font-size: 16pt;">${affiliation}</div>
            <div style="font-size: 20pt; margin-top: 20px;">ขอมอบเกียรติบัตรฉบับนี้เพื่อแสดงว่า</div>
            <div class="recipient">${rank.name}</div>
            <div class="description">
              เป็นพื้นที่ที่มีการจัดการด้านความสะอาดและสุขอนามัยในหมวด <strong>${getCategoryName(rank.category)}</strong><br/>
              ได้คะแนนเฉลี่ยอยู่ในเกณฑ์ <strong>"${rank.score >= 90 ? 'ดีเยี่ยม' : 'ดีมาก'}"</strong> (${rank.score} คะแนน)<br/>
              ประจำเดือน ${new Date(selectedMonth).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
            </div>
            <div class="footer">
              <div class="sign-area">
                <div class="line"></div>
                <div>( ${executives} )</div>
                <div>ผู้อำนวยการโรงเรียน</div>
              </div>
            </div>
            <div class="date">ให้ไว้ ณ วันที่ ${new Date(issueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="page-content fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('cert_print')}</h2>
          <p className="text-slate-500 mt-1">ออกเกียรติบัตรแยกตามหมวดหมู่และช่วงเวลา</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
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
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">วันที่พิมพ์เกียรติบัตร</label>
            <input 
              type="date" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full">
              <button 
                onClick={() => setActiveCategory('area')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeCategory === 'area' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                เขตพื้นที่
              </button>
              <button 
                onClick={() => setActiveCategory('classroom')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeCategory === 'classroom' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                ห้องเรียน
              </button>
              <button 
                onClick={() => setActiveCategory('restroom')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeCategory === 'restroom' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                ห้องน้ำ
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rankings.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl text-center border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">ไม่มีผู้ผ่านเกณฑ์ในหมวดหมู่นี้</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">คะแนนเฉลี่ยต้องมากกว่า 80 ขึ้นไป</p>
          </div>
        ) : (
          rankings.map((r, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 border-t-8 border-t-amber-400 hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                  {r.score >= 90 ? '🏆 ดีเยี่ยม' : '🎖️ ดีมาก'}
                </div>
                <div className="text-[10px] text-slate-400 font-bold">{r.count} ครั้ง</div>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{r.name}</h3>
              <p className="text-xs text-slate-500 mb-6">ผู้รับผิดชอบ: {r.responsibleClass}</p>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl mb-6">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">คะแนนเฉลี่ย</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{r.score}</p>
                </div>
              </div>
              
              <button 
                onClick={() => printCertificate(r)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black shadow-lg hover:shadow-amber-500/30 transition-all text-xs flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                พิมพ์เกียรติบัตร
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
