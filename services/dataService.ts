
import { AnyData, Criterion, Room, User, SystemSettings } from "../types";

// ==================================================================================
// ⚠️ สำคัญ: ใส่ URL ของ Web App ที่ได้จากการ Deploy Google Apps Script ตรงนี้
// ==================================================================================
const API_URL = "INSERT_YOUR_GAS_WEB_APP_URL_HERE"; 

class DataService {
  private data: AnyData[] = [];
  private listeners: ((data: AnyData[]) => void)[] = [];
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (this.isInitialized) return;
    
    const cached = localStorage.getItem("cached_data");
    if (cached) {
        this.data = JSON.parse(cached);
        this.notify();
    }

    if (!API_URL || API_URL.includes("INSERT_YOUR")) {
        console.warn("ยังไม่ได้ใส่ API URL ใน services/dataService.ts ข้อมูลจะถูกบันทึกแค่ในเครื่อง");
        if (this.data.length === 0) this.seedData(); 
        return;
    }

    try {
      const response = await fetch(`${API_URL}?action=getAll`);
      const result = await response.json();
      
      if (result.status === 'success') {
        this.data = result.data;
        localStorage.setItem("cached_data", JSON.stringify(this.data));
        
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

  async create(item: any): Promise<{ isOk: boolean }> {
    const newItem = { ...item, __backendId: item.__backendId || `BID-${Date.now()}-${Math.random()}` };
    this.data.push(newItem);
    this.notify();
    this.saveToCache();

    if (!API_URL || API_URL.includes("INSERT_YOUR")) return { isOk: true };

    try {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'create', payload: newItem })
        }).then(res => {
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

    // Multi-language Criteria as provided by the user
    const criteriaData = [
      {
        "type": "criterion",
        "criterion_id": "CRIT-AREA-001",
        "criterion_type": "area",
        "criterion_name": { "th": "ความสะอาดและปราศจากสิ่งปฏิกูล", "isan": "ความแปนของเขตพื้นที่ (ขยะ/ใบไม้)", "en": "Cleanliness & Waste Free" },
        "criterion_description": { "th": "ประเมินปริมาณขยะ ฝุ่น ทราย ใบไม้แห้ง", "isan": "เบิ่งว่ามีขี้เหยื่อ ใบไม้แห้ง ถุงพลาสติก ตกค้างตามพื่นหรือฮ่องน้ำบ่", "en": "Assess amount of trash, dust, leaves, and debris." },
        "rubric_5": { "th": "สะอาดหมดจด ไม่มีขยะแม้แต่ชิ้นเดียว", "isan": "สะอาดเอี่ยมอ่อง แปนเอิดเติด บ่มีขี้เหยื่อจักชิ้น", "en": "Spotless. No trash or debris found." },
        "rubric_4": { "th": "สะอาดดี มีใบไม้แห้งเล็กน้อยตามมุม", "isan": "สะอาดอยู่ แต่ยังมีใบไม้แห้งปลิวมาแน่จักหน่อย", "en": "Clean. Very few fallen leaves in corners." },
        "rubric_3": { "th": "พอใช้ มีขยะชิ้นเล็กๆ หรือใบไม้บางจุด", "isan": "พอเบิ่งได้ มีขยะหลงเหลือแน่ ใบไม้เริ่มหลาย", "en": "Fair. Some small trash or scattered leaves." },
        "rubric_2": { "th": "ควรปรับปรุง มีขยะหลายจุด ถังขยะล้น", "isan": "เริ่มฮกแล้ว ขยะเห็นหลายบ่อน ถังขยะกะเต็ม", "en": "Poor. Trash visible in many spots. Bins overflowing." },
        "rubric_1": { "th": "สกปรกมาก ขยะเกลื่อนกราด ไม่ได้ทำความสะอาด", "isan": "สกปรกคัก ขยะเต็มเอี้ยด ฮกอื้อตื้อ", "en": "Very Dirty. Heavily littered and uncleaned." },
        "created_at": new Date().toISOString(),
        "__backendId": `BID-${Date.now()}-1`
      },
      {
        "type": "criterion",
        "criterion_id": "CRIT-AREA-002",
        "criterion_type": "area",
        "criterion_name": { "th": "ความเป็นระเบียบและภูมิทัศน์", "isan": "ความเป็นระเบียบ (หญ้า/ของใช้)", "en": "Orderliness & Landscape" },
        "criterion_description": { "th": "การตัดหญ้า การจัดวางอุปกรณ์ทำความสะอาด", "isan": "หญ้าต้องบ่ฮก อุปกรณ์ทำความสะอาดเก็บเข้าที่เรียบร้อยบ่", "en": "Grass trimming and equipment arrangement." },
        "rubric_5": { "th": "เป็นระเบียบสูงสุด หญ้าเตียน อุปกรณ์เก็บเรียบร้อย", "isan": "หญ้าเตียนงาม ของเก็บเป็นระเบียบ เรียบร้อยดีคัก", "en": "Perfectly organized. Grass trimmed. Tools stored properly." },
        "rubric_4": { "th": "เป็นระเบียบดี หญ้าเริ่มยาวเล็กน้อย อุปกรณ์วางดี", "isan": "เป็นระเบียบอยู่ หญ้ายาวขึ้นนิดนึง ของวางดีอยู่", "en": "Well organized. Grass slightly grown. Tools okay." },
        "rubric_3": { "th": "พอใช้ หญ้ายาวบางจุด อุปกรณ์วางไม่ตรงที่", "isan": "พอได้ หญ้าเริ่มฮกตามขอบ ของวางบ่ค่อยตรงหม่อง", "en": "Fair. Grass long in spots. Tools misplaced." },
        "rubric_2": { "th": "ไม่เป็นระเบียบ หญ้ารก อุปกรณ์วางเกะกะ", "isan": "บ่เป็นระเบียบ หญ้าฮกตา ของวางเกะกะ", "en": "Disorganized. Overgrown grass. Tools scattered." },
        "rubric_1": { "th": "ไร้ระเบียบ หญ้ารกทึบ อุปกรณ์ทิ้งกระจัดกระจาย", "isan": "หญ้าท่วมหัว ของวางถิ่มไว้ทั่วทีป", "en": "Chaos. Heavy overgrowth. Tools abandoned everywhere." },
        "created_at": new Date().toISOString(),
        "__backendId": `BID-${Date.now()}-2`
      },
      {
        "type": "criterion",
        "criterion_id": "CRIT-CLASS-001",
        "criterion_type": "classroom",
        "criterion_name": { "th": "ความสะอาดพื้นและผนัง", "isan": "ความสะอาดพื่นห้อง/ฝาผนัง", "en": "Floor & Wall Cleanliness" },
        "criterion_description": { "th": "พื้นห้องเรียน กระเบื้อง ผนัง เพดาน", "isan": "พื่นห้องกวาดถูแล้วบ่ หยากเยื่อเพดานมีบ่ ฝาผนังเลอะบ่", "en": "Floor, tiles, walls, and ceiling condition." },
        "rubric_5": { "th": "สะอาดมาก พื้นเงาวับ ผนังไม่มีรอยขีดเขียน", "isan": "พื่นเงาวับ บ่มีฝุ่น แปนดีคัก ฝาผนังเกลี้ยง", "en": "Spotless. Polished floor. No marks on walls." },
        "rubric_4": { "th": "สะอาดดี มีฝุ่นเล็กน้อยตามมุมห้อง", "isan": "สะอาดดี มีฝุ่นแน่จักหน่อยนำแจมุมห้อง", "en": "Clean. Little dust in corners." },
        "rubric_3": { "th": "พอใช้ พื้นมีรอยเปื้อนบ้าง มีหยากไย่เล็กน้อย", "isan": "พอใช้ พื่นมีฮอยเปื้อน หยากเยื่อเริ่มมีให้เห็น", "en": "Fair. Some stains on floor. Some cobwebs." },
        "rubric_2": { "th": "สกปรก มีเศษขยะบนพื้น ผนังเลอะเทอะ", "isan": "สกปรก มีขี้เหยื่อนำพื่น ฝาผนังเปื้อน", "en": "Dirty. Trash on floor. Walls stained." },
        "rubric_1": { "th": "สกปรกมาก ฝุ่นหนา หยากไย่เยอะ ขยะเกลื่อน", "isan": "ฝุ่นเขรอะ ขี้ดินเต็มพื่น หยากเยื่อเต็มมุม", "en": "Filthy. Thick dust. Heavy cobwebs. Littered." },
        "created_at": new Date().toISOString(),
        "__backendId": `BID-${Date.now()}-3`
      },
      {
        "type": "criterion",
        "criterion_id": "CRIT-CLASS-002",
        "criterion_type": "classroom",
        "criterion_name": { "th": "การจัดโต๊ะเก้าอี้", "isan": "การจัดโต๊ะเก้าอี้", "en": "Furniture Arrangement" },
        "criterion_description": { "th": "ความเป็นระเบียบของแถว และความสะอาดใต้โต๊ะ", "isan": "จัดแถวตรงงามบ่ ขยะในลิ้นชักโต๊ะมีบ่", "en": "Row alignment and under-desk cleanliness." },
        "rubric_5": { "th": "เรียบร้อยทุกตัว แถวตรง ใต้โต๊ะไม่มีขยะ", "isan": "จัดแถวตรงเป๊ะ ใต้โต๊ะเกลี้ยงเกลา บ่มีขยะ", "en": "Perfectly aligned. No trash under desks." },
        "rubric_4": { "th": "เรียบร้อยดี มีเก้าอี้เบี้ยวเล็กน้อย", "isan": "เรียบร้อยดี เก้าอี้เบี้ยวแน่ตัวสองตัว", "en": "Good. Slightly misaligned chairs." },
        "rubric_3": { "th": "พอใช้ แถวไม่ตรง ใต้โต๊ะมีขยะบ้าง", "isan": "พอใช้ แถวบ่ค่อยตรง ใต้โต๊ะมีขยะซุกอยู่", "en": "Fair. Rows crooked. Some trash under desks." },
        "rubric_2": { "th": "ไม่เป็นระเบียบ โต๊ะเก้าอี้ระเกะระกะ", "isan": "บ่เป็นระเบียบ โต๊ะเก้าอี้วางขวางกันไปมา", "en": "Disorganized. Furniture scattered." },
        "rubric_1": { "th": "ยุ่งเหยิง ไม่มีการจัดแถว ขยะยัดใต้โต๊ะเพียบ", "isan": "ระเกะระกะ ยายกันทั่วทีป ขยะยัดใสใต้โต๊ะ", "en": "Messy. No rows. Trash stuffed under desks." },
        "created_at": new Date().toISOString(),
        "__backendId": `BID-${Date.now()}-4`
      },
      {
        "type": "criterion",
        "criterion_id": "CRIT-REST-001",
        "criterion_type": "restroom",
        "criterion_name": { "th": "ความสะอาดและกลิ่น", "isan": "ความสะอาดห้องน้ำ/กลิ่น", "en": "Hygiene & Odor" },
        "criterion_description": { "th": "ชักโครก อ่างล้างมือ พื้น และกลิ่นภาพรวม", "isan": "โถส้วมราดลงบ่ มีคราบเหลืองบ่ กลิ่นเหม็นบ่", "en": "Toilets, sinks, floor, and overall smell." },
        "rubric_5": { "th": "สะอาดมาก หอม พื้นแห้ง ไม่มีคราบ", "isan": "สะอาดหอมชื่นใจ นั่งได้สบายใจ พื่นแห้งสนิท", "en": "Spotless. Fresh smell. Dry floor. No stains." },
        "rubric_4": { "th": "สะอาดดี กลิ่นปกติ พื้นเปียกเล็กน้อย", "isan": "สะอาดดี กลิ่นบ่เหม็น พื่นเปียกแน่จักหน่อย", "en": "Clean. Neutral smell. Floor slightly wet." },
        "rubric_3": { "th": "พอใช้ มีกลิ่นอับ พื้นแฉะ มีคราบเล็กน้อย", "isan": "พอใช้ มีกลิ่นอับ พื่นแฉะ มีคราบเหลืองแน่", "en": "Fair. Musty smell. Wet floor. Minor stains." },
        "rubric_2": { "th": "สกปรก มีกลิ่นเหม็น คราบเหลืองชัดเจน", "isan": "สกปรก มีกลิ่นเหม็นเยี่ยว คราบเหลืองเห็นชัด", "en": "Dirty. Bad smell. Visible yellow stains." },
        "rubric_1": { "th": "สกปรกมาก เหม็นรุนแรง คราบหนา เข้าไม่ได้", "isan": "เหม็นกุ๊บ คราบเหลืองอึ้งติ้ง เข้าไปบ่ได้", "en": "Filthy. Unbearable smell. Heavy stains. Unusable." },
        "created_at": new Date().toISOString(),
        "__backendId": `BID-${Date.now()}-5`
      },
      {
        "type": "criterion",
        "criterion_id": "CRIT-REST-002",
        "criterion_type": "restroom",
        "criterion_name": { "th": "อุปกรณ์อำนวยความสะดวก", "isan": "น้ำท่าและอุปกรณ์", "en": "Facilities & Water" },
        "criterion_description": { "th": "น้ำไหล ขันน้ำ สายชำระ ถังขยะ", "isan": "ก๊อกน้ำไหลบ่ ขันตักน้ำดีบ่ ถังขยะในห้องน้ำล้นบ่", "en": "Water flow, buckets, sprayers, and bins." },
        "rubric_5": { "th": "ครบถ้วน ใช้งานได้ดีทุกจุด น้ำแรง", "isan": "น้ำไหลแฮง อุปกรณ์ครบ พร้อมใช้", "en": "Fully functional. Strong water flow. All items ready." },
        "rubric_4": { "th": "ใช้งานได้ดี น้ำไหลปกติ อุปกรณ์ชำรุดเล็กน้อย", "isan": "ใช้งานได้ดี น้ำไหลอยู่ อุปกรณ์เก่าแน่แต่ใช้ได้", "en": "Good. Normal water flow. Minor wear on tools." },
        "rubric_3": { "th": "พอใช้ น้ำไหลเบา อุปกรณ์บางอย่างเสียหาย", "isan": "พอใช้ น้ำไหลค่อย ขันแตกแน่/สายชำระพัง", "en": "Fair. Weak water flow. Some broken items." },
        "rubric_2": { "th": "แย่ น้ำไม่ไหล หรืออุปกรณ์เสียหายหลายจุด", "isan": "แย่ น้ำบ่ไหล หรืออุปกรณ์พังหลายอัน", "en": "Poor. No water or many broken items." },
        "rubric_1": { "th": "ไม่มี/พัง น้ำไม่ไหล อุปกรณ์ใช้การไม่ได้เลย", "isan": "น้ำบ่ไหล ขันแตก ถังขยะล้นจนเหม็นเน่า", "en": "Broken/Missing. No water. Unusable facilities." },
        "created_at": new Date().toISOString(),
        "__backendId": `BID-${Date.now()}-6`
      }
    ];

    criteriaData.forEach(c => initialData.push(c as any));

    this.data = initialData;
    this.saveToCache();
    this.notify();

    if (API_URL && !API_URL.includes("INSERT_YOUR")) {
        for (const item of initialData) {
            await this.create(item);
        }
    }
  }
}

export const dataService = new DataService();
