
import { AnyData, Criterion, Room, User, SystemSettings } from "../types";

// ==================================================================================
// ⚠️ สำคัญ: ใส่ URL ของ Web App ที่ได้จากการ Deploy Google Apps Script ตรงนี้
// ==================================================================================
const API_URL = "INSERT_YOUR_GAS_WEB_APP_URL_HERE"; 
// ตัวอย่าง: "https://script.google.com/macros/s/AKfycbx.../exec"

class DataService {
  private data: AnyData[] = [];
  private listeners: ((data: AnyData[]) => void)[] = [];
  private isInitialized = false;

  constructor() {
    this.init();
  }

  // โหลดข้อมูลทั้งหมดจาก Google Sheets เมื่อเปิดเว็บ
  private async init() {
    if (this.isInitialized) return;
    
    // โหลดข้อมูลเบื้องต้นจาก LocalStorage ระหว่างรอ API (เพื่อให้เว็บไม่ว่างเปล่า)
    const cached = localStorage.getItem("cached_data");
    if (cached) {
        this.data = JSON.parse(cached);
        this.notify();
    }

    if (!API_URL || API_URL.includes("INSERT_YOUR")) {
        console.warn("ยังไม่ได้ใส่ API URL ใน services/dataService.ts ข้อมูลจะถูกบันทึกแค่ในเครื่อง");
        if (this.data.length === 0) this.seedData(); // Fallback to seed if offline/no api
        return;
    }

    try {
      const response = await fetch(`${API_URL}?action=getAll`);
      const result = await response.json();
      
      if (result.status === 'success') {
        this.data = result.data;
        // Cache ข้อมูลล่าสุดไว้
        localStorage.setItem("cached_data", JSON.stringify(this.data));
        
        // ถ้าเป็นครั้งแรกและไม่มีข้อมูล ให้ Seed Data และส่งขึ้น Server
        if (this.data.length === 0) {
           await this.seedData();
        }
      }
    } catch (error) {
      console.error("Failed to fetch data from GAS:", error);
    } finally {
      this.isInitialized = true;
      this.notify();
    }
  }

  private notify() {
    this.listeners.forEach((l) => l(this.data));
  }

  subscribe(listener: (data: AnyData[]) => void) {
    this.listeners.push(listener);
    listener(this.data);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getAll(): AnyData[] {
    return this.data;
  }

  // ส่งข้อมูลไปบันทึกที่ Google Sheets
  async create(item: any): Promise<{ isOk: boolean }> {
    const newItem = { ...item, __backendId: item.__backendId || `BID-${Date.now()}-${Math.random()}` };
    
    // Optimistic Update (แสดงผลทันทีไม่ต้องรอ Server)
    this.data.push(newItem);
    this.notify();
    this.saveToCache();

    if (!API_URL || API_URL.includes("INSERT_YOUR")) return { isOk: true };

    try {
        // ส่งข้อมูลไป Backend (ทำใน Background)
        fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', // GAS Web App requires no-cors for simple requests or handling redirects carefully, but usually standard POST works with redirects. 
            // Note: 'no-cors' makes response opaque. For reading response we need CORS setup in GAS or accept opaque.
            // For this implementation, we use standard POST with redirect following (default fetch behavior).
            // To make it robust with GAS, we use text/plain content type to avoid preflight options check issues in some envs.
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'create', payload: newItem })
        }).then(res => {
            // หากต้องการอัปเดตข้อมูลที่ได้จาก Server (เช่น URL รูปภาพที่เปลี่ยนจาก Base64 -> Drive URL)
            // ต้องเขียน Logic เพิ่มเพื่อ fetch getAll อีกครั้ง หรือรอ Server ตอบกลับ
            // ในที่นี้เราจะ re-fetch data หลังจากผ่านไปสักพักเพื่อให้ได้ URL รูปภาพ
            if(newItem.type === 'assessment' && newItem.images?.length > 0) {
                setTimeout(() => this.init(), 3000); 
            }
        });
        
        return { isOk: true };
    } catch (e) {
        console.error(e);
        return { isOk: false };
    }
  }

  async update(item: any): Promise<{ isOk: boolean }> {
    const index = this.data.findIndex((d) => d.__backendId === item.__backendId);
    if (index !== -1) {
      this.data[index] = item;
      this.notify();
      this.saveToCache();

      if (API_URL && !API_URL.includes("INSERT_YOUR")) {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'update', payload: item })
        });
      }
      return { isOk: true };
    }
    return { isOk: false };
  }

  async delete(item: any): Promise<{ isOk: boolean }> {
    this.data = this.data.filter((d) => d.__backendId !== item.__backendId);
    this.notify();
    this.saveToCache();

    if (API_URL && !API_URL.includes("INSERT_YOUR")) {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'delete', payload: item })
        });
    }
    return { isOk: true };
  }

  private saveToCache() {
      localStorage.setItem("cached_data", JSON.stringify(this.data));
  }

  // ฟังก์ชัน Seed Data จะทำงานเมื่อเริ่มระบบครั้งแรก และส่งข้อมูลชุดแรกขึ้น Server
  private async seedData() {
    const initialData: AnyData[] = [];

    // Rooms
    const classrooms = [
        { name: "M.1", building: "Main Building", floor: "1st Floor", class: "M.1" },
        { name: "M.2", building: "Main Building", floor: "1st Floor", class: "M.2" },
        { name: "M.3", building: "Main Building", floor: "2nd Floor", class: "M.3" },
        { name: "M.4", building: "Main Building", floor: "2nd Floor", class: "M.4" },
        { name: "M.5", building: "Main Building", floor: "3rd Floor", class: "M.5" },
        { name: "M.6", building: "Main Building", floor: "3rd Floor", class: "M.6" },
        { name: "Zone A", building: "Garden", floor: "Ground", class: "M.1" }, 
        { name: "Zone B", building: "Canteen", floor: "Ground", class: "M.2" }, 
    ];
    classrooms.forEach((r) => {
        initialData.push({
          type: "room",
          room_id: "ROOM-" + Date.now() + "-" + r.name,
          room_name: r.name,
          room_building: r.building,
          room_floor: r.floor,
          responsible_class: r.class,
          created_at: new Date().toISOString(),
          __backendId: `BID-${Date.now()}-${Math.random()}`,
        } as Room);
    });

    // Users
    const mockAccounts = [
        { name: "Admin User", email: "admin@demo.com", role: "admin" as const },
        { name: "Teacher User", email: "teacher@demo.com", role: "teacher" as const },
        { name: "Student Council", email: "council@demo.com", role: "student_council" as const },
        { name: "Student User", email: "student@demo.com", role: "student" as const },
    ];
    mockAccounts.forEach(acc => {
        initialData.push({
            type: 'user',
            user_id: 'USR-' + Date.now() + Math.random(),
            user_name: acc.name,
            user_email: acc.email,
            password: 'demo123',
            user_role: acc.role,
            user_status: 'active',
            assigned_locations: acc.role === 'admin' ? [] : ["M.1", "M.2", "Zone A"],
            user_created_at: new Date().toISOString(),
            __backendId: `BID-${Date.now()}-${Math.random()}`
        } as User);
    });

    // Students
    const sampleStudents = [
        { name: "ด.ช. รักเรียน เพียรศึกษา", class: "M.1" },
        { name: "ด.ญ. มานี มีตา", class: "M.1" },
        { name: "ด.ช. กล้าหาญ ชาญชัย", class: "M.2" },
    ];
    sampleStudents.forEach(s => {
        initialData.push({
            type: 'user',
            user_id: 'USR-' + Date.now() + Math.random(),
            user_name: s.name,
            user_email: `${s.name.split(' ')[0]}@demo.com`,
            password: 'demo123',
            user_role: 'student',
            user_class: s.class,
            user_status: 'active',
            user_created_at: new Date().toISOString(),
            __backendId: `BID-${Date.now()}-${Math.random()}`
        } as User);
    });

    // Settings
    initialData.push({
        type: 'settings',
        telegram_token: '',
        telegram_chat_id: '',
        notify_low_score: true,
        notify_reminders: true,
        notify_goals: true,
        themeColor: 'indigo',
        school_name: 'โรงเรียนน้ำคำวิทยา',
        school_affiliation: 'สังกัดองค์การบริหารส่วนจังหวัดศรีสะเกษ',
        executives: 'ผู้บริหารโรงเรียน',
        logo_url: '',
        __backendId: `SET-${Date.now()}`
    } as SystemSettings);

    // Criteria - Helper function
    const addCriteria = (type: 'area' | 'classroom' | 'restroom', items: any[]) => {
        items.forEach(c => {
            initialData.push({
                type: 'criterion',
                criterion_id: 'CRIT-' + type.toUpperCase() + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                criterion_type: type,
                criterion_name: c.name,
                criterion_description: c.description,
                rubric_5: c.rubric_5,
                rubric_4: c.rubric_4,
                rubric_3: c.rubric_3,
                rubric_2: c.rubric_2,
                rubric_1: c.rubric_1,
                created_at: new Date().toISOString(),
                __backendId: `BID-${Date.now()}-${Math.random()}`,
            } as Criterion);
        });
    };

    // Add Criteria Data (ย่อข้อมูลลงเพื่อความกระชับ)
    // [Area Criteria]
    addCriteria('area', [
        { name: 'ความสะอาดและปราศจากสิ่งปฏิกูล', description: 'ประเมินปริมาณขยะ ฝุ่น ทราย...', rubric_5: 'สะอาดหมดจด...', rubric_1: 'สกปรกมาก...' },
        { name: 'ความเป็นระเบียบ', description: 'การจัดวางของและภูมิทัศน์...', rubric_5: 'เป็นระเบียบสูงสุด...', rubric_1: 'ไร้ระเบียบ...' }
    ]);
    // [Classroom Criteria]
    addCriteria('classroom', [
        { name: 'ความสะอาดพื้น/ผนัง', description: 'พื้นห้องเรียน กระเบื้อง ผนัง', rubric_5: 'สะอาดมาก...', rubric_1: 'สกปรกมาก...' },
        { name: 'การจัดโต๊ะเก้าอี้', description: 'ความเป็นระเบียบ', rubric_5: 'เรียบร้อยทุกตัว...', rubric_1: 'ยุ่งเหยิง...' }
    ]);
    // [Restroom Criteria]
    addCriteria('restroom', [
        { name: 'ความสะอาดห้องน้ำ', description: 'ชักโครก อ่างล้างมือ พื้น', rubric_5: 'สะอาดมาก หอม...', rubric_1: 'สกปรกมาก เหม็น...' },
        { name: 'อุปกรณ์อำนวยความสะดวก', description: 'สบู่ กระดาษ', rubric_5: 'ครบถ้วน...', rubric_1: 'ไม่มี/พัง...' }
    ]);

    this.data = initialData;
    this.saveToCache();
    this.notify();

    // Send each seed item to backend
    if (API_URL && !API_URL.includes("INSERT_YOUR")) {
        for (const item of initialData) {
            await this.create(item);
        }
    }
  }
}

export const dataService = new DataService();
