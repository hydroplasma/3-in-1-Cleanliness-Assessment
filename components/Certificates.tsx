
import React, { useState } from 'react';
import { AnyData, Assessment, Room, SystemSettings } from '../types';

interface CertificatesProps {
  allData: AnyData[];
  settings: SystemSettings;
}

export default function Certificates({ allData, settings }: CertificatesProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  
  const assessments = allData.filter((d): d is Assessment => d.type === 'assessment');
  const rooms = allData.filter((d): d is Room => d.type === 'room');
  
  // Filter assessments for selected month and group by location
  const monthlyData = assessments.filter(a => a.date.startsWith(selectedMonth));
  
  // Get unique locations and calculate average score
  const locations = Array.from(new Set(monthlyData.map(a => a.location)));
  const rankings = locations.map(loc => {
    const locAssessments = monthlyData.filter(a => a.location === loc);
    const avgScore = locAssessments.reduce((sum, a) => sum + a.score, 0) / locAssessments.length;
    const roomInfo = rooms.find(r => r.room_name === loc);
    return {
      name: loc,
      score: Math.round(avgScore),
      responsibleClass: roomInfo?.responsible_class || 'ทั่วไป',
      count: locAssessments.length
    };
  }).filter(r => r.score >= 80).sort((a, b) => b.score - a.score);

  const printCertificate = (rank: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const schoolName = settings?.school_name || 'โรงเรียนน้ำคำวิทยา';
    const affiliation = settings?.school_affiliation || '';
    const executives = settings?.executives || 'ผู้อำนวยการโรงเรียน';

    printWindow.document.write(`
      <html>
        <head>
          <title>เกียรติบัตรความสะอาด</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
            body { 
              margin: 0; padding: 0; 
              font-family: 'Sarabun', sans-serif;
              display: flex; justify-content: center; align-items: center;
              height: 100vh; background: #fff;
            }
            .certificate {
              width: 297mm; height: 210mm;
              padding: 20mm; box-sizing: border-box;
              border: 15px double #C5A059;
              background-color: #fff;
              position: relative; text-align: center;
              box-shadow: inset 0 0 100px rgba(197, 160, 89, 0.1);
            }
            .garuda { width: 80px; margin-bottom: 20px; }
            .school-name { font-size: 32pt; font-weight: bold; color: #1a1a1a; margin-bottom: 10px; }
            .affiliation { font-size: 16pt; margin-bottom: 30px; }
            .given-to { font-size: 20pt; margin-bottom: 10px; }
            .recipient { font-size: 40pt; font-weight: bold; color: #8B7355; margin: 20px 0; }
            .description { font-size: 18pt; line-height: 1.6; margin: 30px 50px; }
            .footer { margin-top: 60px; display: flex; justify-content: space-around; align-items: flex-end; }
            .sign-area { text-align: center; width: 300px; }
            .line { border-bottom: 1px dotted #333; margin-bottom: 10px; width: 100%; }
            .date { font-size: 14pt; margin-top: 10px; }
            .seal { width: 120px; height: 120px; border-radius: 50%; border: 2px dashed #C5A059; display: flex; align-items: center; justify-content: center; opacity: 0.2; position: absolute; bottom: 50px; left: 50px; transform: rotate(-15deg); }
          </style>
        </head>
        <body>
          <div class="certificate">
            <img class="garuda" src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Garuda_emblem_of_Thailand.svg/512px-Garuda_emblem_of_Thailand.svg.png" />
            <div class="school-name">${schoolName}</div>
            <div class="affiliation">${affiliation}</div>
            <div class="given-to">ขอมอบเกียรติบัตรฉบับนี้เพื่อแสดงว่า</div>
            <div class="recipient">${rank.name}</div>
            <div class="description">
              เป็นพื้นที่ที่มีการจัดการด้านความสะอาดและสุขอนามัยในเกณฑ์ <strong>"${rank.score >= 90 ? 'ดีเยี่ยม' : 'ดีมาก'}"</strong><br/>
              ประจำเดือน ${new Date(selectedMonth).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}<br/>
              ขอให้รักษาคุณความดีและมาตรฐานความสะอาดนี้สืบไป
            </div>
            
            <div class="footer">
              <div class="sign-area">
                <div class="line"></div>
                <div>( ${executives} )</div>
                <div>${settings?.executives ? 'ผู้อำนวยการโรงเรียน' : 'ผู้รับผิดชอบระบบ'}</div>
              </div>
            </div>
            
            <div class="date">ให้ไว้ ณ วันที่ ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div class="seal">OFFICIAL SEAL</div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="page-content fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">พิมพ์เกียรติบัตร (Certificate Printing)</h2>
          <p className="text-slate-500 mt-1">มอบเกียรติบัตรสำหรับห้องเรียนหรือพื้นที่ที่ได้รับคะแนนความสะอาดดีเยี่ยม</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">เลือกเดือนที่สรุปผล</label>
          <input 
            type="month" 
            className="px-4 py-2 border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rankings.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl text-center border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">ไม่มีผู้ผ่านเกณฑ์ในเดือนนี้</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">ผู้ผ่านเกณฑ์ต้องมีคะแนนเฉลี่ยตั้งแต่ 80 คะแนนขึ้นไป</p>
          </div>
        ) : (
          rankings.map((r, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 border-t-8 border-t-amber-400 transition-all hover:shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                  {r.score >= 90 ? '🏆 ดีเยี่ยม' : '🎖️ ดีมาก'}
                </div>
                <div className="text-xs text-slate-400 font-bold">จาก {r.count} ครั้ง</div>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{r.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">ผู้รับผิดชอบ: {r.responsibleClass}</p>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl mb-6">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">คะแนนเฉลี่ย</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{r.score}</p>
                </div>
                <div className="h-10 w-10 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-indigo-600">/100</span>
                </div>
              </div>
              
              <button 
                onClick={() => printCertificate(r)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black shadow-lg hover:shadow-amber-500/30 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
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
