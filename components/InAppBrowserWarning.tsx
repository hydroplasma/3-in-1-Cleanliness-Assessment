
import React, { useEffect, useState } from 'react';

export default function InAppBrowserWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [externalLink, setExternalLink] = useState('');

  // ลิงก์ Google Sites ที่ต้องการให้คัดลอก
  const GOOGLE_SITE_URL = "https://sites.google.com/view/sapa-nkw2568/%E0%B8%95%E0%B8%A3%E0%B8%A7%E0%B8%88%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B8%AA%E0%B8%B0%E0%B8%AD%E0%B8%B2%E0%B8%94-3-in-1";

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    // Detect LINE, Facebook, Instagram, and other common in-app browsers
    const isInApp = 
      /Line/i.test(userAgent) || 
      /FBAN/i.test(userAgent) || 
      /FBAV/i.test(userAgent) || 
      /Instagram/i.test(userAgent) ||
      /Twitter/i.test(userAgent);

    if (isInApp) {
      setShowWarning(true);
      
      // Prepare the external link
      // Note: In Google Sites, window.location.href is the iframe URL (the app itself), not the parent site.
      // Opening this will open the App in full screen (without Google Sites header), which is actually better for functionality.
      const currentUrl = window.location.href;
      const separator = currentUrl.includes('?') ? '&' : '?';
      // Adding openExternalBrowser=1 is a specific trick for LINE
      setExternalLink(`${currentUrl}${separator}openExternalBrowser=1`);
    }
  }, []);

  const handleCopyLink = () => {
    // ใช้ URL ที่ระบุมาโดยเฉพาะ
    navigator.clipboard.writeText(GOOGLE_SITE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-start pt-16 p-4 text-center animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700 relative overflow-hidden mt-4">
        
        {/* Background Decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner animate-bounce">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
            กรุณาเปิดใน Browser หลัก
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
            ระบบตรวจพบว่าคุณใช้งานผ่าน <span className="font-bold text-indigo-600 dark:text-indigo-400">LINE / Facebook</span> ซึ่งอาจทำให้การทำงานไม่สมบูรณ์ เช่น การอัปโหลดรูปภาพหรือการบันทึกข้อมูล
          </p>

          {/* Instruction Image */}
          <div className="mb-6 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-700 shadow-inner bg-slate-50 dark:bg-slate-900">
            <img 
              src="https://img2.pic.in.th/1000135856.md.jpg" 
              alt="How to open in browser" 
              className="w-full h-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-3">
            {/* Primary Action: Open in Browser using Anchor Tag for better iframe escape */}
            <a 
              href={externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] no-underline"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              แตะเพื่อเปิดใน Chrome / Safari
            </a>

            {/* Secondary Action: Copy Link */}
            <button 
              onClick={handleCopyLink}
              className={`w-full py-3 rounded-xl font-bold text-sm shadow-sm border-2 transition-all flex items-center justify-center gap-2 ${copied ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'}`}
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  คัดลอกลิงก์เรียบร้อย
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  คัดลอกลิงก์ไปเปิดเอง
                </>
              )}
            </button>
          </div>

          <p className="mt-6 text-[10px] text-slate-400 font-medium">
            * เพื่อความปลอดภัยและความเสถียรของระบบ กรุณาใช้เบราว์เซอร์มาตรฐาน
          </p>
        </div>
      </div>
    </div>
  );
}
