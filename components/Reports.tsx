
import React, { useState } from 'react';
import { AnyData, Assessment, SystemSettings, CurrentUser } from '../types';
import AssessmentDetailModal from './AssessmentDetailModal';
import ConfirmationModal from './ConfirmationModal';
import { useLanguage } from '../services/i18n';
import { dataService } from '../services/dataService';

interface ReportsProps {
  allData: AnyData[];
  showLoading: (text: string) => void;
  hideLoading: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  currentUser: CurrentUser;
}

export default function Reports({ allData, showLoading, hideLoading, showToast, currentUser }: ReportsProps) {
  const { t, language } = useLanguage();
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  
  // State for Delete Confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Assessment | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const assessments = allData.filter((d): d is Assessment => d.type === 'assessment');
  const settings = allData.find(d => d.type === 'settings') as SystemSettings;

  const applyFilters = (list: Assessment[]) => {
    return list.filter(a => {
      // 1. Status Filter
      if (filterStatus && a.status !== filterStatus) return false;
      
      // 2. Date Filter
      if (!a.date) return false;

      // Convert stored date to Local Date YYYY-MM-DD for accurate comparison
      const d = new Date(a.date);
      if (isNaN(d.getTime())) return false; // Skip invalid dates

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const itemDate = `${year}-${month}-${day}`;
      
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      
      return true;
    });
  };

  const areaAssessments = applyFilters(assessments.filter(a => a.assessment_type === 'area'));
  const classroomAssessments = applyFilters(assessments.filter(a => a.assessment_type === 'classroom'));
  const restroomAssessments = applyFilters(assessments.filter(a => a.assessment_type === 'restroom'));

  const totalFiltered = applyFilters(assessments);
  
  const handleClearFilters = () => {
    setFilterStatus('');
    setStartDate('');
    setEndDate('');
    showToast(language === 'th' ? 'ล้างตัวกรองแล้ว' : 'Filters cleared', 'info');
  };

  const confirmDelete = (e: React.MouseEvent, assessment: Assessment) => {
    e.stopPropagation();
    setItemToDelete(assessment);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (itemToDelete) {
      await dataService.delete(itemToDelete);
      showToast('ลบข้อมูลเรียบร้อยแล้ว', 'success');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return t('excellent');
      case 'good': return t('good');
      case 'needs_improvement': return t('needs_improvement');
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-emerald-500';
      case 'good': return 'bg-blue-500';
      case 'needs_improvement': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const handleExportPDF = () => {
    if (totalFiltered.length === 0) {
      showToast(language === 'th' ? 'ไม่มีข้อมูลให้พิมพ์' : 'No data to print', 'error');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const schoolName = settings?.school_name || 'School Name';
    const schoolAffiliation = settings?.school_affiliation || '';
    const locale = language === 'th' ? 'th-TH' : 'en-US';
    
    const avgScore = (totalFiltered.reduce((sum, a) => sum + a.score, 0) / totalFiltered.length).toFixed(0);
    
    let rowsHtml = totalFiltered.map((a, i) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i+1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${new Date(a.date).toLocaleDateString(locale)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${a.location}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${a.assessment_type === 'area' ? t('assessment_area') : a.assessment_type === 'classroom' ? t('assessment_classroom') : t('assessment_restroom')}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">${a.score}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${getStatusLabel(a.status)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${a.evaluator}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${t('report')}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
            body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .school-name { font-size: 24px; font-weight: bold; }
            .report-title { font-size: 18px; margin-top: 10px; text-decoration: underline; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; }
            .summary { margin-top: 30px; padding: 20px; border: 1px solid #eee; background: #fafafa; border-radius: 8px; }
            .signature { margin-top: 50px; float: right; text-align: center; width: 250px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">${schoolName}</div>
            <div style="font-size: 14px;">${schoolAffiliation}</div>
            <div class="report-title">${t('report')}</div>
            <div style="margin-top: 5px;">${startDate || 'START'} - ${endDate || 'END'}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th width="50">#</th>
                <th width="100">${t('date')}</th>
                <th>${t('location')}</th>
                <th width="120">${t('assessment')}</th>
                <th width="80">${t('score')}</th>
                <th width="100">Status</th>
                <th>${t('by')}</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="summary">
            <strong>Summary:</strong> Total ${totalFiltered.length} items | Average Score ${avgScore}
          </div>
          <div class="signature">
             <br/><br/>
             .......................................................<br/>
             ( ${settings?.executives || '...........................................'} )<br/>
             ${t('cert_director')}
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportExcel = () => {
    if (totalFiltered.length === 0) {
      showToast(language === 'th' ? 'ไม่มีข้อมูลให้ส่งออก' : 'No data to export', 'error');
      return;
    }
    showLoading(t('loading'));
    setTimeout(() => {
      const schoolName = settings?.school_name || 'School';
      const excelContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"></head>
        <body>
          <table>
            <tr><td colspan="7" style="font-size: 16pt; font-weight: bold; text-align: center;">${t('report')} - ${schoolName}</td></tr>
            <tr>
              <td style="background-color: #4F46E5; color: white;">#</td>
              <td style="background-color: #4F46E5; color: white;">${t('date')}</td>
              <td style="background-color: #4F46E5; color: white;">${t('location')}</td>
              <td style="background-color: #4F46E5; color: white;">${t('assessment')}</td>
              <td style="background-color: #4F46E5; color: white;">${t('score')}</td>
              <td style="background-color: #4F46E5; color: white;">Status</td>
              <td style="background-color: #4F46E5; color: white;">${t('by')}</td>
            </tr>
            ${totalFiltered.map((a, i) => `
              <tr>
                <td>${i+1}</td>
                <td>${a.date}</td>
                <td>${a.location}</td>
                <td>${a.assessment_type === 'area' ? t('assessment_area') : a.assessment_type === 'classroom' ? t('assessment_classroom') : t('assessment_restroom')}</td>
                <td>${a.score}</td>
                <td>${getStatusLabel(a.status)}</td>
                <td>${a.evaluator}</td>
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
      a.download = `Report_${Date.now()}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      hideLoading();
      showToast(language === 'th' ? 'ส่งออกไฟล์ Excel สำเร็จ' : 'Excel exported successfully', 'success');
    }, 1000);
  };

  const renderTable = (title: string, data: Assessment[], type: 'area' | 'classroom' | 'restroom') => {
    const config = {
      area: { color: 'blue', label: t('assessment_area') },
      classroom: { color: 'emerald', label: t('assessment_classroom') },
      restroom: { color: 'amber', label: t('assessment_restroom') }
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
            <span className={`text-[10px] bg-${config.color}-100 text-${config.color}-700 px-2 py-0.5 rounded-full font-bold`}>{data.length} {t('total_assessments')}</span>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('cert_avg_score')}</p>
             <p className={`text-lg font-black text-${config.color}-600`}>{typeAvg}</p>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider text-left border-b border-slate-50 dark:border-slate-800">
                <th className="pb-3 px-2">{t('date')}</th>
                <th className="pb-3 px-2">{t('location')}</th>
                <th className="pb-3 px-2">{t('by')}</th>
                <th className="pb-3 px-2 text-center">{t('score')}</th>
                <th className="pb-3 px-2 text-center">Status</th>
                <th className="pb-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm italic">{t('no_data')}</td>
                </tr>
              ) : (
                data.map(a => (
                  <tr 
                    key={a.assessment_id} 
                    className="table-row hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer group"
                    onClick={() => setSelectedAssessment(a)}
                  >
                    <td className="py-3 px-2 text-[10px] font-bold text-slate-500">{new Date(a.date).toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH')}</td>
                    <td className="py-3 px-2 font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 transition-colors">{a.location}</td>
                    <td className="py-3 px-2 text-xs text-slate-600 dark:text-slate-400">{a.evaluator}</td>
                    <td className={`py-3 px-2 text-center font-black ${a.score >= 80 ? 'text-emerald-600' : a.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{a.score}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-[10px] ${getStatusColor(a.status)} text-white px-2 py-1 rounded-lg font-bold shadow-sm`}>{getStatusLabel(a.status)}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-2 text-slate-400">
                        <div className="flex items-center gap-1 mr-2">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                           <span className="text-[10px] font-bold">{a.image_count}</span>
                        </div>
                        {isAdmin && (
                            <button className="text-red-400 hover:text-red-600 p-1" onClick={(e) => confirmDelete(e, a)} title="ลบข้อมูล">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        )}
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
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('report')}</h2>
          <p className="text-slate-500 mt-1">สรุปผลการประเมินและประวัติย้อนหลัง</p>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors font-bold text-xs shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              PDF
           </button>
           <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold text-xs shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4 4m0 0l-4-4m4 4V4" /></svg>
              Excel
           </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 mb-8">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">ตัวกรองข้อมูล (Filters)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
           <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">สถานะ</label>
             <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">ทั้งหมด</option>
                <option value="excellent">{t('excellent')}</option>
                <option value="good">{t('good')}</option>
                <option value="needs_improvement">{t('needs_improvement')}</option>
             </select>
           </div>
           <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">ตั้งแต่วันที่</label>
             <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={startDate} onChange={e => setStartDate(e.target.value)} />
           </div>
           <div>
             <label className="block text-xs font-bold text-slate-500 mb-1">ถึงวันที่</label>
             <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={endDate} onChange={e => setEndDate(e.target.value)} />
           </div>
           <div>
             <button onClick={handleClearFilters} className="w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm dark:bg-slate-800 dark:text-slate-400">ล้างตัวกรอง</button>
           </div>
        </div>
      </div>

      {renderTable(t('assessment_area'), areaAssessments, 'area')}
      {renderTable(t('assessment_classroom'), classroomAssessments, 'classroom')}
      {renderTable(t('assessment_restroom'), restroomAssessments, 'restroom')}

      <AssessmentDetailModal 
        isOpen={!!selectedAssessment} 
        onClose={() => setSelectedAssessment(null)} 
        assessment={selectedAssessment} 
        allData={allData} 
        currentUser={currentUser}
      />

      <ConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="ยืนยันการลบข้อมูล"
        message={`คุณต้องการลบข้อมูลการประเมินของ "${itemToDelete?.location}" วันที่ ${new Date(itemToDelete?.date || '').toLocaleDateString('th-TH')} หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบข้อมูล"
        type="danger"
      />
    </div>
  );
}
