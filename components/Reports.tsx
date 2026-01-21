
import React, { useState } from 'react';
import { AnyData, Assessment, SystemSettings } from '../types';
import AssessmentDetailModal from './AssessmentDetailModal';

interface ReportsProps {
  allData: AnyData[];
  showLoading: (text: string) => void;
  hideLoading: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function Reports({ allData, showLoading, hideLoading, showToast }: ReportsProps) {
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  const assessments = allData.filter((d): d is Assessment => d.type === 'assessment');
  const settings = allData.find(d => d.type === 'settings') as SystemSettings;

  // Helper to apply global filters
  const applyFilters = (list: Assessment[]) => {
    return list.filter(a => {
      if (filterStatus && a.status !== filterStatus) return false;
      if (startDate && new Date(a.date) < new Date(startDate)) return false;
      if (endDate && new Date(a.date) > new Date(endDate)) return false;
      return true;
    });
  };

  const areaAssessments = applyFilters(assessments.filter(a => a.assessment_type === 'area'));
  const classroomAssessments = applyFilters(assessments.filter(a => a.assessment_type === 'classroom'));
  const restroomAssessments = applyFilters(assessments.filter(a => a.assessment_type === 'restroom'));

  const totalFiltered = applyFilters(assessments);
  
  const avgScore = totalFiltered.length 
    ? (totalFiltered.reduce((sum, a) => sum + a.score, 0) / totalFiltered.length).toFixed(0) 
    : 0;

  const handleClearFilters = () => {
    setFilterStatus('');
    setStartDate('');
    setEndDate('');
    showToast('ล้างตัวกรองแล้ว', 'info');
  };

  const handleExportPDF = () => {
    if (totalFiltered.length === 0) {
      showToast('ไม่มีข้อมูลให้พิมพ์', 'error');
      return;
    }
    
    // Create print layout
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const schoolName = settings?.school_name || 'โรงเรียนน้ำคำวิทยา';
    const schoolAffiliation = settings?.school_affiliation || '';
    
    let rowsHtml = totalFiltered.map((a, i) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i+1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${new Date(a.date).toLocaleDateString('th-TH')}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${a.location}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${a.assessment_type === 'area' ? 'เขตพื้นที่' : a.assessment_type === 'classroom' ? 'ห้องเรียน' : 'ห้องน้ำ'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">${a.score}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${getStatusLabel(a.status)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${a.evaluator}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>รายงานสรุปผลการประเมินความสะอาด</title>
          <style>
            body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .school-name { font-size: 24px; font-weight: bold; }
            .report-title { font-size: 18px; margin-top: 10px; text-decoration: underline; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; }
            .summary { margin-top: 30px; padding: 20px; border: 1px solid #eee; background: #fafafa; border-radius: 8px; }
            .signature { margin-top: 50px; float: right; text-align: center; width: 250px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">${schoolName}</div>
            <div style="font-size: 14px;">${schoolAffiliation}</div>
            <div class="report-title">รายงานสรุปผลการประเมินความสะอาด</div>
            <div style="margin-top: 5px;">ประจำช่วงวันที่ ${startDate || 'เริ่มต้น'} ถึง ${endDate || 'ปัจจุบัน'}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th width="50">ลำดับ</th>
                <th width="100">วันที่</th>
                <th>สถานที่/ห้อง</th>
                <th width="100">ประเภท</th>
                <th width="80">คะแนน</th>
                <th width="100">สถานะ</th>
                <th>ผู้ประเมิน</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="summary">
            <strong>สรุปผลภาพรวม:</strong> จำนวนทั้งหมด ${totalFiltered.length} รายการ | คะแนนเฉลี่ยรวม ${avgScore} คะแนน
          </div>
          <div class="signature">
             <br/><br/>
             .......................................................<br/>
             ( ${settings?.executives || '...........................................'} )<br/>
             ตำแหน่ง .........................................
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportExcel = () => {
    if (totalFiltered.length === 0) {
      showToast('ไม่มีข้อมูลให้ส่งออก', 'error');
      return;
    }

    showLoading('กำลังจัดเตรียมไฟล์ Excel...');

    setTimeout(() => {
      const schoolName = settings?.school_name || 'School';
      const excelContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
          <style>
            .title { font-size: 16pt; font-weight: bold; text-align: center; }
            .header { background-color: #4F46E5; color: white; font-weight: bold; text-align: center; border: 0.5pt solid #000; }
            .cell { border: 0.5pt solid #ccc; text-align: left; }
            .score { text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <tr><td colspan="6" class="title">รายงานสรุปการประเมินความสะอาด - ${schoolName}</td></tr>
            <tr><td colspan="6" style="text-align: center;">ข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH')}</td></tr>
            <tr></tr>
            <tr>
              <td class="header">ลำดับ</td>
              <td class="header">วันที่ประเมิน</td>
              <td class="header">สถานที่/ห้อง</td>
              <td class="header">ประเภทการประเมิน</td>
              <td class="header">คะแนน (เต็ม 100)</td>
              <td class="header">สถานะ</td>
              <td class="header">ผู้ประเมิน</td>
            </tr>
            ${totalFiltered.map((a, i) => `
              <tr>
                <td class="cell" style="text-align:center;">${i+1}</td>
                <td class="cell">${a.date}</td>
                <td class="cell">${a.location}</td>
                <td class="cell">${a.assessment_type}</td>
                <td class="cell score">${a.score}</td>
                <td class="cell" style="text-align:center;">${getStatusLabel(a.status)}</td>
                <td class="cell">${a.evaluator}</td>
              </tr>
            `).join('')}
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `รายงานความสะอาด_${Date.now()}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      hideLoading();
      showToast('ส่งออกไฟล์ Excel สำเร็จ', 'success');
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-emerald-500';
      case 'good': return 'bg-blue-500';
      case 'needs_improvement': return 'bg-amber-500';
      default: return 'bg-gray-500';
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

  const renderTable = (title: string, data: Assessment[], type: 'area' | 'classroom' | 'restroom') => {
    const config = {
      area: { color: 'blue', label: 'เขตพื้นที่' },
      classroom: { color: 'emerald', label: 'ห้องเรียน' },
      restroom: { color: 'amber', label: 'ห้องน้ำ' }
    }[type];

    const typeAvg = data.length 
      ? (data.reduce((sum, a) => sum + a.score, 0) / data.length).toFixed(1) 
      : '0.0';

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8 dark:bg-slate-900 dark:border-slate-800">
        <div className={`bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between dark:bg-slate-800/50 dark:border-slate-700`}>
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-6 rounded-full bg-${config.color}-500`}></div>
            <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
            <span className={`text-[10px] bg-${config.color}-100 text-${config.color}-700 px-2 py-0.5 rounded-full font-bold`}>{data.length} รายการ</span>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-slate-400 font-bold uppercase">คะแนนเฉลี่ยส่วนนี้</p>
             <p className={`text-lg font-black text-${config.color}-600`}>{typeAvg}</p>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider text-left border-b border-slate-50 dark:border-slate-800">
                <th className="pb-3 px-2">วันที่</th>
                <th className="pb-3 px-2">สถานที่</th>
                <th className="pb-3 px-2">ผู้ประเมิน</th>
                <th className="pb-3 px-2 text-center">คะแนน</th>
                <th className="pb-3 px-2 text-center">สถานะ</th>
                <th className="pb-3 px-2 text-right">รูปภาพ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm italic">ไม่มีข้อมูลการประเมินในส่วนนี้</td>
                </tr>
              ) : (
                data.map(a => (
                  <tr 
                    key={a.assessment_id} 
                    className="table-row hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer group"
                    onClick={() => setSelectedAssessment(a)}
                  >
                    <td className="py-3 px-2 text-[10px] font-bold text-slate-500">{new Date(a.date).toLocaleDateString('th-TH')}</td>
                    <td className="py-3 px-2 font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 transition-colors">
                      <div className="flex items-center gap-2">
                        {a.location}
                        <svg className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-xs text-slate-600 dark:text-slate-400">{a.evaluator}</td>
                    <td className={`py-3 px-2 text-center font-black ${a.score >= 80 ? 'text-emerald-600' : a.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{a.score}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-[10px] ${getStatusColor(a.status)} text-white px-2 py-1 rounded-lg font-bold`}>{getStatusLabel(a.status)}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span className="text-[10px] font-bold">{a.image_count}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="page-content fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">รายงานแยกตามหมวดหมู่ (Categorized Reports)</h2>
          <p className="text-slate-500 mt-1">สรุปผลการประเมินแยกตามประเภทพื้นที่ ห้องเรียน และห้องน้ำ</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold text-xs shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg> พิมพ์รายงาน (PDF)
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold text-xs shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> ส่งออก Excel
            </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8 dark:bg-slate-900 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">สถานะ (Status)</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50 font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-white">
              <option value="">ทั้งหมด</option>
              <option value="excellent">ดีเยี่ยม (Excellent)</option>
              <option value="good">ดี (Good)</option>
              <option value="needs_improvement">ควรปรับปรุง (Needs Improvement)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ช่วงวันที่เริ่มต้น</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50 font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ถึงวันที่</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50 font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleClearFilters} className="text-sm font-bold text-rose-500 hover:text-rose-700">ล้างตัวกรองทั้งหมด</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {renderTable('1. รายงานผล: เขตพื้นที่รับผิดชอบ (Area Zone)', areaAssessments, 'area')}
        {renderTable('2. รายงานผล: ห้องเรียน (Classroom)', classroomAssessments, 'classroom')}
        {renderTable('3. รายงานผล: ห้องน้ำ (Restroom)', restroomAssessments, 'restroom')}
      </div>
      
      {totalFiltered.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 p-12 rounded-3xl text-center dark:bg-amber-900/20 dark:border-amber-800">
             <svg className="w-16 h-16 mx-auto text-amber-400 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
             <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400">ไม่พบข้อมูลตามเงื่อนไขที่กำหนด</h3>
             <p className="text-amber-600 dark:text-amber-500 text-sm mt-1">กรุณาลองเปลี่ยนเงื่อนไขการกรองหรือช่วงวันที่</p>
          </div>
      )}

      <AssessmentDetailModal 
        isOpen={!!selectedAssessment} 
        onClose={() => setSelectedAssessment(null)} 
        assessment={selectedAssessment} 
        allData={allData} 
      />
    </div>
  );
}
