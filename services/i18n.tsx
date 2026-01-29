
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
    feat_attendance_desc: "ดึงรายชื่อนักเรียนตามโซนรับผิดชอบอัตโนัติ เพื่อเช็คชื่อทำเวร",
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
    upload_photos: "อัปโหลดรูปภาพหลักฐาน (3-5 รูป)",
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
    
    // Admin Tools
    export_excel: "ส่งออก Excel",
    import_data: "นำเข้าข้อมูล",
    export_json: "ส่งออก JSON",
    import_json: "นำเข้า JSON",
    import_success: "นำเข้าข้อมูลสำเร็จ!",
    import_error: "ไฟล์ไม่ถูกต้อง หรือเกิดข้อผิดพลาดในการนำเข้า",

    // Certificate
    cert_title: "เกียรติบัตร",
    cert_certify: "ขอมอบเกียรติบัตรฉบับนี้เพื่อแสดงว่า",
    cert_description: "เป็นพื้นที่ที่มีการจัดการด้านความสะอาดและสุขอนามัยดีเยี่ยมในหมวด",
    cert_avg_score: "ได้คะแนนเฉลี่ย",
    cert_month_of: "ประจำเดือน",
    cert_issued_at: "ให้ไว้ ณ วันที่",
    cert_director: "ผู้อำนวยการโรงเรียน",
    cert_no_data: "ไม่พบข้อมูลคะแนนเฉลี่ยผ่านเกณฑ์ในเดือนนี้",
    cert_min_score: "คะแนนเฉลี่ยสะสมต้องมากกว่า 80 คะแนนขึ้นไป",

    // Status & Rubrics
    excellent: "ดีเยี่ยม",
    very_good: "ดีมาก",
    good: "ดี",
    fair: "พอใช้",
    needs_improvement: "ควรปรับปรุง",
    rubric_level_5: "ดีเยี่ยม",
    rubric_level_4: "ดีมาก",
    rubric_level_3: "ดี",
    rubric_level_2: "พอใช้",
    rubric_level_1: "ควรปรับปรุง",

    // Months
    jan: "ม.ค.", feb: "ก.พ.", mar: "มี.ค.", apr: "เม.ย.", may: "พ.ค.", jun: "มิ.ย.",
    jul: "ก.ค.", aug: "ส.ค.", sep: "ก.ย.", oct: "ต.ค.", nov: "พ.ย.", dec: "ธ.ค.",

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
    upload_photos: "Upload Evidence Photos (3-5 Photos)",
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
    
    // Admin Tools
    export_excel: "Export Excel",
    import_data: "Import Data",
    export_json: "Export JSON",
    import_json: "Import JSON",
    import_success: "Import Successful!",
    import_error: "Invalid file or error during import",

    // Certificate
    cert_title: "Certificate",
    cert_certify: "This certificate is awarded to certify that",
    cert_description: "has maintained excellent cleanliness and hygiene in the category of",
    cert_avg_score: "with an average score of",
    cert_month_of: "for the month of",
    cert_issued_at: "Given on",
    cert_director: "School Director",
    cert_no_data: "No qualified data found for this month",
    cert_min_score: "Average score must be 80 or higher",

    // Status & Rubrics
    excellent: "Excellent",
    very_good: "Very Good",
    good: "Good",
    fair: "Fair",
    needs_improvement: "Needs Improvement",
    rubric_level_5: "Excellent",
    rubric_level_4: "Very Good",
    rubric_level_3: "Good",
    rubric_level_2: "Fair",
    rubric_level_1: "Improvement Needed",

    // Months
    jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun",
    jul: "Jul", aug: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec",

    developer: "Developed by: Mr. Thawatchai Kaenjak, Namkham Wittaya School"
  },
  is: {
    app_name: "ระบบเบิ่งแยงความสะอาด",
    welcome: "ยินดีต้อนฮับสู่ระบบ",
    logout_success: "ออกจากระบบแล้ว",
    loading: "กำลังโหลด...",
    dashboard: "หน้าหลัก",
    assessment: "การให้คะแนน",
    assessment_area: "เขตที่ฮับผิดชอบ",
    assessment_classroom: "ห้องเรียน",
    assessment_restroom: "ห้องน้ำ",
    report: "สรุปผล",
    goals: "เป้าหมาย",
    progress: "ความคืบหน้า",
    admin: "จัดการระบบ",
    cert_print: "พิมพ์ใบประกาศ",
    manage_users: "จัดการผู้ใช้",
    manage_rooms: "จัดการห้อง/หม่อง",
    criteria: "เกณฑ์ให้คะแนน",
    settings: "ตั้งค่าโรงเรียน/ระบบ",
    
    // Admin Tools
    export_excel: "ส่งออกเอ็กเซล",
    import_data: "ดึงข้อมูลเข้า",
    export_json: "ส่งออก JSON",
    import_json: "นำเข้า JSON",
    import_success: "ดึงข้อมูลเข้าเรียบร้อย!",
    import_error: "ไฟล์บ่ถืกต้อง",

    // Certificate
    cert_title: "ใบประกาศ",
    cert_certify: "มอบใบประกาศฉบับนี้เพื่อยันว่า",
    cert_description: "เป็นหม่องที่มีการจัดการความสะอาดกับสุขอนามัยดีคักในหมวด",
    cert_avg_score: "ได้คะแนนเฉลี่ย",
    cert_month_of: "ประจำเดือน",
    cert_issued_at: "ให้ไว้ ณ วันที่",
    cert_director: "ผู้อำนวยการโรงเรียน",
    cert_no_data: "บ่พบข้อมูลคะแนนเฉลี่ยผ่านเกณฑ์ในเดือนนี้",
    cert_min_score: "คะแนนเฉลี่ยสะสมต้องมากกว่า 80 คะแนนขึ้นไป",

    // สถานะ
    excellent: "ดีคัก",
    very_good: "ดีหลาย",
    good: "ดี",
    fair: "พอใช้",
    needs_improvement: "ควรรีบปรับปรุง",
    rubric_level_5: "ดีคัก",
    rubric_level_4: "ดีหลาย",
    rubric_level_3: "ดี",
    rubric_level_2: "พอใช้",
    rubric_level_1: "ควรรีบปรับปรุง",

    // Months
    jan: "ม.ค.", feb: "ก.พ.", mar: "มี.ค.", apr: "เม.ย.", may: "พ.ค.", jun: "มิ.ย.",
    jul: "ก.ค.", aug: "ส.ค.", sep: "ก.ย.", oct: "ต.ค.", nov: "พ.ย.", dec: "ธ.ค.",
    
    developer: "เฮ็ดโดย: นายธวัชชัย แก่นจักร์ ครู โรงเรียนน้ำคำวิทยา"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['th']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Fix: Change children to optional to satisfy TypeScript's check in App.tsx when passed as JSX content.
export function LanguageProvider({ children }: { children?: ReactNode }) {
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
