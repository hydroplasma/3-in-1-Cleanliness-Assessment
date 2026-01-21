
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '../types';

export const translations = {
  th: {
    app_name: "ระบบประเมินความสะอาด",
    welcome: "ยินดีต้อนรับเข้าสู่ระบบ",
    logout_success: "ออกจากระบบแล้ว",
    loading: "กำลังโหลด...",
    dashboard: "หน้าหลัก",
    assessment: "การประเมินผล",
    assessment_area: "เขตพื้นที่รับผิดชอบ",
    assessment_classroom: "ห้องเรียน",
    assessment_restroom: "ห้องน้ำ",
    report: "รายงานผลสรุป",
    goals: "เป้าหมาย",
    progress: "ความคืบหน้า",
    admin: "จัดการระบบ",
    cert_print: "พิมพ์เกียรติบัตร",
    manage_users: "จัดการผู้ใช้งาน",
    manage_rooms: "จัดการห้อง/พื้นที่",
    criteria: "เกณฑ์การให้คะแนน",
    settings: "ตั้งค่าโรงเรียน/ระบบ",
    
    // Login
    login_title: "เข้าสู่ระบบประเมิน",
    quick_login: "บัญชีทดสอบ (Quick Login)",
    or_use_account: "หรือใช้บัญชีของคุณ",
    email: "อีเมลผู้ใช้งาน",
    password: "รหัสผ่าน",
    login_btn: "เข้าสู่ระบบ",
    account_not_found: "ไม่พบบัญชีผู้ใช้นี้ในระบบ",
    invalid_password: "รหัสผ่านไม่ถูกต้อง",
    account_suspended: "บัญชีนี้ถูกระงับการใช้งาน",
    
    // Features
    feat_3in1: "ประเมินผล 3-in-1",
    feat_3in1_desc: "เขตพื้นที่, ห้องเรียน และห้องน้ำ พร้อมระบบ Rubric 1-5 คะแนน",
    feat_security: "ความปลอดภัยภาพถ่าย",
    feat_security_desc: "ประทับลายน้ำ (Watermark) สถานที่/วัน/เวลา ลงบนภาพหลักฐานทันที",
    feat_attendance: "ระบบเช็คชื่อเวร",
    feat_attendance_desc: "ดึงรายชื่อนักเรียนตามโซนรับผิดชอบอัตโนมัติ เพื่อเช็คชื่อทำเวร",
    feat_report: "วิเคราะห์ข้อมูล & รายงาน",
    feat_report_desc: "Dashboard สถิติย้อนหลัง พร้อมส่งออกรายงานรูปแบบ TXT และ Excel",

    // Dashboard
    overview: "ภาพรวม",
    overview_desc: "ติดตามคะแนนความสะอาดและแนวโน้มในทุกพื้นที่",
    total_assessments: "การประเมินทั้งหมด",
    times_this_month: "ครั้งในเดือนนี้",
    trends: "แนวโน้มคะแนน",
    top_scorers: "ผู้ทำคะแนนยอดเยี่ยม",
    recent_assessments: "การประเมินล่าสุด",
    view_all: "ดูทั้งหมด",
    score: "คะแนน",
    by: "โดย",
    no_data: "ยังไม่มีข้อมูล",
    
    // Assessment Form
    location: "สถานที่",
    select_location: "-- เลือกสถานที่ --",
    date: "วันที่ประเมิน",
    rubric_title: "หัวข้อการประเมินและเกณฑ์รูบริก",
    level: "ระดับ",
    upload_photos: "อัปโหลดรูปภาพหลักฐาน (สูงสุด 5 รูป)",
    click_upload: "คลิกเพื่ออัปโหลด",
    watermark_info: "ระบบจะประทับลายน้ำ วันที่/เวลา/สถานที่ อัตโนมัติ",
    remarks: "หมายเหตุเพิ่มเติม",
    clear: "ล้างค่า",
    save_assessment: "บันทึกการประเมิน",
    saving: "กำลังบันทึก...",
    success_save: "บันทึกข้อมูลเรียบร้อยแล้ว!",
    error_save: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
    duplicate_alert: "ตรวจพบข้อมูลการประเมินซ้ำ",
    attendance_check: "เช็คชื่อนักเรียน (Attendance)",
    student_present: "มาทั้งหมด",
    student_absent: "ไม่มาทั้งหมด",
    
    // Status
    excellent: "ดีเยี่ยม",
    good: "ดี",
    needs_improvement: "ควรปรับปรุง",
    
    developer: "พัฒนาโดย: นายธวัชชัย แก่นจักร์ ครู โรงเรียนน้ำคำวิทยา"
  },
  en: {
    app_name: "Cleanliness Assessment",
    welcome: "Welcome to the system",
    logout_success: "Logged out successfully",
    loading: "Loading...",
    dashboard: "Dashboard",
    assessment: "Assessment",
    assessment_area: "Area Zone",
    assessment_classroom: "Classroom",
    assessment_restroom: "Restroom",
    report: "Reports",
    goals: "Goals",
    progress: "Progress",
    admin: "Admin",
    cert_print: "Certificates",
    manage_users: "User Management",
    manage_rooms: "Room/Area Management",
    criteria: "Scoring Criteria",
    settings: "System Settings",
    
    // Login
    login_title: "Login to System",
    quick_login: "Quick Login (Demo)",
    or_use_account: "Or use your account",
    email: "Email Address",
    password: "Password",
    login_btn: "Login",
    account_not_found: "Account not found",
    invalid_password: "Invalid password",
    account_suspended: "Account suspended",

    // Features
    feat_3in1: "3-in-1 Assessment",
    feat_3in1_desc: "Area, Classroom, and Restroom evaluation with 1-5 Rubric system",
    feat_security: "Photo Security",
    feat_security_desc: "Automatic Watermark (Location/Date/Time) on evidence photos",
    feat_attendance: "Duty Attendance",
    feat_attendance_desc: "Automatically fetch student list by zone for attendance check",
    feat_report: "Analytics & Reports",
    feat_report_desc: "Dashboard with historical stats and Excel export support",

    // Dashboard
    overview: "Overview",
    overview_desc: "Track cleanliness scores and trends across all areas",
    total_assessments: "Total Assessments",
    times_this_month: "times this month",
    trends: "Score Trends",
    top_scorers: "Top Scorers",
    recent_assessments: "Recent Assessments",
    view_all: "View All",
    score: "Score",
    by: "By",
    no_data: "No data available",
    
    // Assessment Form
    location: "Location",
    select_location: "-- Select Location --",
    date: "Date",
    rubric_title: "Evaluation Criteria & Rubrics",
    level: "Level",
    upload_photos: "Upload Evidence Photos (Max 5)",
    click_upload: "Click to upload",
    watermark_info: "System automatically applies watermark",
    remarks: "Additional Remarks",
    clear: "Clear",
    save_assessment: "Submit Assessment",
    saving: "Saving...",
    success_save: "Data saved successfully!",
    error_save: "Error saving data",
    duplicate_alert: "Duplicate assessment detected",
    attendance_check: "Student Attendance",
    student_present: "All Present",
    student_absent: "All Absent",
    
    // Status
    excellent: "Excellent",
    good: "Good",
    needs_improvement: "Improvement Needed",
    
    developer: "Developed by: Mr. Thawatchai Kaenjak, Namkham Wittaya School"
  },
  is: {
    app_name: "ระบบประเมินความสะอาด",
    welcome: "ยินดีต้อนฮับเข้าสู่ระบบ",
    logout_success: "ออกจากระบบแล้ว",
    loading: "กำลังโหลด... (ถ่าจักคราว)",
    dashboard: "หน้าหลัก",
    assessment: "การประเมินผล",
    assessment_area: "เขตพื้นที่รับผิดชอบ",
    assessment_classroom: "ห้องเรียน",
    assessment_restroom: "ห้องน้ำ",
    report: "รายงานผลสรุป",
    goals: "เป้าหมาย",
    progress: "ความคืบหน้า",
    admin: "จัดการระบบ",
    cert_print: "พิมพ์เกียรติบัตร",
    manage_users: "จัดการผู้ใช้งาน",
    manage_rooms: "จัดการห้อง/พื้นที่",
    criteria: "เกณฑ์การให้คะแนน",
    settings: "ตั้งค่าโรงเรียน/ระบบ",
    
    // Login
    login_title: "เข้าใช้งานระบบ",
    quick_login: "บัญชีทดสอบ (ลองเบิ่ง)",
    or_use_account: "หรือใช้บัญชีของเจ้า",
    email: "อีเมลผู้ใช้งาน",
    password: "รหัสผ่าน",
    login_btn: "เข้าใช้งาน",
    account_not_found: "บ่พบบัญชีนี้ในระบบ",
    invalid_password: "รหัสผ่านบ่ถืกต้อง",
    account_suspended: "บัญชีนี้ถืกระงับ",

    // Features
    feat_3in1: "ประเมินผล 3-in-1",
    feat_3in1_desc: "เขตพื้นที่, ห้องเรียน และห้องน้ำ พร้อมระบบ Rubric 1-5 คะแนน",
    feat_security: "ความปลอดภัยภาพถ่าย",
    feat_security_desc: "ประทับลายน้ำ (Watermark) สถานที่/มื้อ/เวลา ลงบนภาพหลักฐานทันที",
    feat_attendance: "ระบบเช็คซื่อเวร",
    feat_attendance_desc: "ดึงรายซื่อนักเรียนตามโซนรับผิดชอบอัตโนมัติ เพื่อเช็คซื่อทำเวร",
    feat_report: "วิเคราะห์ข้อมูล & รายงาน",
    feat_report_desc: "Dashboard สถิติย้อนหลัง พร้อมส่งออกรายงานรูปแบบ TXT และ Excel",

    // Dashboard
    overview: "ภาพรวม",
    overview_desc: "เบิ่งคะแนนความสะอาดและแนวโน้มในซุเขตพื้นที่",
    total_assessments: "การประเมินทั้งหมด",
    times_this_month: "เทื่อในเดือนนี้",
    trends: "แนวโน้มคะแนน",
    top_scorers: "ผู้ทำคะแนนได้ดีคัก",
    recent_assessments: "การประเมินล่าสุด",
    view_all: "เบิ่งทั้งหมด",
    score: "คะแนน",
    by: "โดย",
    no_data: "ยังบ่มีข้อมูล",
    
    // Assessment Form
    location: "สถานที่",
    select_location: "-- เลือกสถานที่ --",
    date: "มื้อที่ประเมิน",
    rubric_title: "หัวข้อการประเมินและเกณฑ์รูบริก",
    level: "ระดับ",
    upload_photos: "อัปโหลดรูปภาพหลักฐาน (ได้ 5 รูป)",
    click_upload: "จิ้มเพื่ออัปโหลด",
    watermark_info: "ระบบสิประทับลายน้ำ มื้อ/เวลา/สถานที่ ให้เอง",
    remarks: "หมายเหตุเพิ่มเติม",
    clear: "ล้างค่า",
    save_assessment: "บันทึกการประเมิน",
    saving: "กำลังบันทึก...",
    success_save: "บันทึกข้อมูลเรียบร้อยแล้ว!",
    error_save: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
    duplicate_alert: "พ้อข้อมูลการประเมินซ้ำ",
    attendance_check: "เช็คซื่อนักเรียน (Attendance)",
    student_present: "มาเบิดทุกคน",
    student_absent: "บ่มาจักคน",
    
    // Status
    excellent: "ดีคัก (ดีเยี่ยม)",
    good: "ดี",
    needs_improvement: "ควรปรับปรุง",
    
    developer: "พัฒนาโดย: นายธวัชชัย แก่นจักร์ ครู โรงเรียนน้ำคำวิทยา"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['th']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('th');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && (savedLang === 'th' || savedLang === 'en' || savedLang === 'is')) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: keyof typeof translations['th']) => {
    return translations[language][key] || translations['th'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
