
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
        { name: "ม.1", building: "อาคาร 1", floor: "ชั้น 1", class: "ม.1", type: "classroom" },
        { name: "ม.2", building: "อาคาร 1", floor: "ชั้น 1", class: "ม.2", type: "classroom" },
        { name: "ม.3", building: "อาคาร 1", floor: "ชั้น 2", class: "ม.3", type: "classroom" },
        { name: "ม.4", building: "อาคาร 1", floor: "ชั้น 2", class: "ม.4", type: "classroom" },
        { name: "ม.5", building: "อาคาร 1", floor: "ชั้น 3", class: "ม.5", type: "classroom" },
        { name: "ม.6", building: "อาคาร 1", floor: "ชั้น 3", class: "ม.6", type: "classroom" },
        { name: "เขตพื้นที่ 1", building: "สนามหญ้าหน้าเสาธง", floor: "พื้นดิน", class: "ม.1", type: "area" }, 
        { name: "เขตพื้นที่ 2", building: "โรงอาหาร", floor: "ชั้น 1", class: "ม.2", type: "area" }, 
        { name: "ห้องน้ำชาย (โดม)", building: "อาคารอเนกประสงค์", floor: "ชั้น 1", class: "ม.3", type: "restroom" }, 
    ];
    classrooms.forEach((r) => {
        initialData.push({
          type: "room",
          room_id: "ROOM-" + Date.now() + "-" + r.name,
          room_name: r.name,
          room_building: r.building,
          room_floor: r.floor,
          room_type: r.type as any,
          responsible_class: r.class,
          created_at: new Date().toISOString(),
          __backendId: `BID-${Date.now()}-${Math.random()}`,
        } as Room);
    });

    // Users
    const mockAccounts = [
        { name: "ผู้ดูแลระบบ", email: "admin@demo.com", role: "admin" as const },
        { name: "คุณครูทดสอบ", email: "teacher@demo.com", role: "teacher" as const },
        { name: "สภานักเรียน", email: "council@demo.com", role: "student_council" as const },
        { name: "นักเรียนทดสอบ", email: "student@demo.com", role: "student" as const },
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
            assigned_locations: acc.role === 'admin' ? [] : ["ม.1", "ม.2", "เขตพื้นที่ 1"],
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
        showQuickLogin: true,
        __backendId: `SET-${Date.now()}`
    } as SystemSettings);

    // New criteria data provided by user
    const rawCriteria = [
        // AREA CRITERIA
        {
          "type": "criterion",
          "criterion_id": "CRIT-AREA-1",
          "criterion_type": "area",
          "name": { "th": "ความสะอาดและปราศจากสิ่งปฏิกูล", "en": "Cleanliness and Waste Free", "isan": "ความสะอาดและบ่มีขยะ" },
          "description": { "th": "ประเมินปริมาณขยะ ฝุ่น ทราย คราบสกปรก ทั้งบนถนน พื้นอาคาร และในสวน", "en": "Assess amount of trash, dust, sand, and stains on roads, building floors, and gardens.", "isan": "เบิ่งปริมาณขยะ ฝุ่น ขี้ดิน ฮอยเปื้อน ทั้งเทิงถนน พื้นอาคาร และในสวน" },
          "rubric_5": { "th": "พื้นที่สะอาดหมดจด ไม่พบขยะ เศษใบไม้ ฝุ่นสะสม หรือคราบสกปรกใดๆ พื้นผิวมีความเกลี้ยงเกลา ดูแล้วสบายตาที่สุด", "en": "Area is spotless. No trash, leaves, accumulated dust, or stains found. Surfaces are polished and very pleasant to look at.", "isan": "พื้นที่สะอาดเอี่ยม บ่มีขยะ ใบไม้ ฝุ่น หรือฮอยเปื้อนเลยจักหน่อย พื้นเกลี้ยงงามตาคัก" },
          "rubric_4": { "th": "สภาพโดยรวมสะอาดมาก พบสิ่งแปลกปลอม (เช่น ใบไม้แห้ง เศษกระดาษชิ้นเล็ก) เพียงเล็กน้อยในจุดสังเกตยาก ไม่เกิน 1-2 จุด", "en": "Overall condition is very clean. Only slight foreign objects (e.g., dry leaves, small paper scraps) found in hard-to-see spots, not exceeding 1-2 points.", "isan": "โดยรวมสะอาดดีคัก พอมีใบไม้แห้งหรือเศษกระดาษน้อยๆ แหน่จัก 1-2 หม่องในมุมอับ" },
          "rubric_3": { "th": "สะอาดในระดับมาตรฐาน พบฝุ่น ทราย หรือขยะชิ้นเล็กกระจายตัวบ้าง แต่ไม่ถึงกับกองรวมกันจนน่าเกลียด", "en": "Standard cleanliness. Some dust, sand, or small trash scattered, but not piled up unpleasantly.", "isan": "สะอาดพอใช้ได้ พอมีฝุ่น ขี้ดิน หรือขยะชิ้นน้อยๆ กระจายอยู่แหน่ แต่บ่ถึงกับกองรวมกันจนขี้ฮ้าย" },
          "rubric_2": { "th": "พื้นที่ดูไม่สะอาดตา พบขยะชิ้นใหญ่ (แก้วน้ำ/ถุงพลาสติก) หรือมีกองเศษใบไม้/ดินทรายตกค้างอย่างเห็นได้ชัด", "en": "Area looks unclean. Found large trash (cups/plastic bags) or piles of leaves/sand clearly left behind.", "isan": "เบิ่งแล้วบ่สะอาดตา ปะขยะชิ้นใหญ่ (แก้วน้ำ/ถุงพลาสติก) หรือมีกองใบไม้/ขี้ดินถิ่มไว้เห็นชัดเจน" },
          "rubric_1": { "th": "สกปรกมาก มีขยะเกลื่อนกราด มีคราบฝังแน่น หรือเศษดินโคลนสะสมหนา จำเป็นต้องทำความสะอาดทันที", "en": "Very dirty. Trash scattered everywhere, ingrained stains, or thick mud accumulation. Needs immediate cleaning.", "isan": "สกปรกคัก มีขยะเฮี่ยลาดฟาด เต็มไปหมด มีคราบฝังแน่น หรือขี้ตมพอกหนา ต้องทำความสะอาดด่วน" }
        },
        {
          "type": "criterion",
          "criterion_id": "CRIT-AREA-2",
          "criterion_type": "area",
          "name": { "th": "ความเป็นระเบียบและการจัดภูมิทัศน์", "en": "Orderliness and Landscape", "isan": "ความเป็นระเบียบและการจัดสวน" },
          "description": { "th": "การจัดวางของ (ใต้อาคาร/โรงอาหาร) และ ความเรียบร้อยของต้นไม้/หญ้า (สวน/สนาม)", "en": "Arrangement of items (under buildings/canteen) and tidiness of trees/grass (garden/field).", "isan": "การจัดวางของ (ใต้อาคาร/โรงอาหาร) และ ความเรียบร้อยของต้นไม้/หญ้า (สวน/สนาม)" },
          "rubric_5": { "th": "เป็นระเบียบสูงสุด: สิ่งของจัดวางเป็นแนวตรง เป็นหมวดหมู่ / ภูมิทัศน์สวยงาม: หญ้าตัดสั้นเสมอ ต้นไม้รูปทรงสวยงาม ไม่มีวัชพืช", "en": "Maximum orderliness: Items arranged in straight lines and categories. Beautiful landscape: Grass cut short evenly, trees well-shaped, no weeds.", "isan": "เป็นระเบียบคักแน: จัดของเป็นแถวตรง เป๊ะเว่อร์ / สวนงาม: หญ้าตัดสั้นเสมอ ต้นไม้งาม บ่มีหญ้าฮก" },
          "rubric_4": { "th": "การจัดวางเรียบร้อยดี แต่อาจมีจุดเล็กน้อยที่วางเหลื่อมล้ำ หรือต้นไม้มีกิ่งก้านยื่นออกมาเล็กน้อย แต่ภาพรวมยังดูดี", "en": "Arrangement is neat, but may have slight misalignments or trees with slightly protruding branches. Overall look is still good.", "isan": "จัดวางเรียบร้อยดี แต่อาจสิมีวางเหลื่อมแหน่จักหน่อย หรือต้นไม้มีกิ่งยื่นออกมานิดหนึ่ง แต่ภาพรวมยังเบิ่งดี" },
          "rubric_3": { "th": "พอใช้ได้ สิ่งของไม่กีดขวางทางเดินแต่ยังไม่เป็นหมวดหมู่ชัดเจน / หญ้าเริ่มยาวหรือมีวัชพืชแซมบ้างเล็กน้อย", "en": "Fair. Items do not block paths but are not clearly categorized. Grass starting to grow long or some weeds appearing.", "isan": "พอใช้ได้ ของบ่ขวางทางย่าง แต่กะยังบ่เป็นหมวดหมู่ปานได๋ / หญ้าเริ่มยาวหรือมีหญ้าขึ้นแซมแหน่" },
          "rubric_2": { "th": "ขาดความเป็นระเบียบ สิ่งของวางระเกะระกะขวางตา / สภาพสวนดูรกรุงรัง วัชพืชสูง หรือต้นไม้ขาดการดูแล", "en": "Lacking order. Items placed cluttered and unsightly. Garden looks unkempt, high weeds, or trees uncared for.", "isan": "บ่เป็นระเบียบ ของวางระเกะระกะขวางหูขวางตา / สวนเบิ่งฮก หญ้าขึ้นสูง หรือต้นไม้บ่ได้ดูแล" },
          "rubric_1": { "th": "ไร้ระเบียบอย่างสิ้นเชิง สิ่งของกีดขวางทางสัญจร / พื้นที่รกร้าง หญ้าสูงท่วม หรือดูเหมือนพื้นที่ทิ้งร้าง", "en": "Completely disordered. Items blocking traffic paths. Area looks abandoned, grass overgrown, or like a wasteland.", "isan": "บ่มีระเบียบเลยจักเม็ด ของวางขวางทางย่าง / พื้นที่ฮกฮื้อ หญ้าท่วมหัว หรือคือจั่งป่าละเมาะ" }
        },
        {
            "type": "criterion",
            "criterion_id": "CRIT-AREA-3",
            "criterion_type": "area",
            "name": { "th": "สภาพความพร้อมใช้งานและความสมบูรณ์", "en": "Readiness and Integrity", "isan": "สภาพการใช้งานและความสมบูรณ์" },
            "description": { "th": "สภาพพื้นผิวถนน รางระบายน้ำ ผนังอาคาร และอุปกรณ์ต่างๆ ว่าชำรุดหรือไม่", "en": "Condition of road surfaces, drainage, building walls, and equipment for damage.", "isan": "สภาพพื้นถนน ฮางระบายน้ำ ฝาผนังอาคาร และอุปกรณ์ต่างๆ ว่าพังบ่" },
            "rubric_5": { "th": "วัสดุอุปกรณ์และโครงสร้างอยู่ในสภาพสมบูรณ์ 100% พร้อมใช้งาน ไม่มีส่วนแตกหัก สีไม่ลอกร่อน รางน้ำไม่มีสิ่งอุดตัน", "en": "Materials and structures are in 100% perfect condition, ready to use. No breakage, peeling paint, or clogged drains.", "isan": "ของทุกอย่างสภาพดีคัก พร้อมใช้งาน 100% บ่มีแตกหัก สีบ่ลอก ฮางน้ำบ่ตัน" },
            "rubric_4": { "th": "สภาพสมบูรณ์ดี แต่อาจมีร่องรอยการใช้งานตามกาลเวลาบ้าง (เช่น รอยขีดข่วน รอยเปื้อน) แต่ไม่มีผลต่อการใช้งาน", "en": "Good condition, but may have some signs of wear over time (e.g., scratches, stains) that do not affect usage.", "isan": "สภาพดีอยู่ แต่อาจสิมีฮอยการใช้งานตามเวลาแหน่ (คือจั่ง ฮอยขีดข่วน ฮอยเปื้อน) แต่บ่มีผลต่อการใช้งาน" },
            "rubric_3": { "th": "สภาพพอใช้ พบความชำรุดเสียหายเล็กน้อย (เช่น สีซีดจาง พื้นกระเบื้องบิ่น รอยร้าวเล็กน้อยบนถนน)", "en": "Fair condition. Found minor damage (e.g., faded color, chipped tiles, slight cracks on the road).", "isan": "สภาพพอใช้ พอมีหม่องพังเสียหายเล็กน้อย (สีซีด กระเบื้องบิ่น ฮอยร้าวตามถนนแหน่)" },
            "rubric_2": { "th": "เริ่มชำรุดเสียหายชัดเจน เช่น มีน้ำขังบนพื้นถนน อุปกรณ์ทำความสะอาดพังเสียหาย หรือโต๊ะเก้าอี้โยกเยก", "en": "Clearly starting to deteriorate, e.g., water pooling on the road, cleaning equipment broken, or wobbly tables/chairs.", "isan": "เริ่มพังเสียหายชัดเจน เช่น มีน้ำขังตามถนน อุปกรณ์ทำความสะอาดพัง หรือโต๊ะเก้าอี้โยกเยก" },
            "rubric_1": { "th": "ชำรุดทรุดโทรมมาก ไม่สามารถใช้งานได้จริง หรือมีความเสียหายที่ต้องซ่อมแซมเร่งด่วน", "en": "Very dilapidated. Cannot be actually used or has damage requiring urgent repair.", "isan": "พังเหมิด สภาพโทรมคัก ใช้งานบ่ได้เลย หรือเสียหายจนต้องซ่อมด่วน" }
        },
        {
            "type": "criterion",
            "criterion_id": "CRIT-AREA-4",
            "criterion_type": "area",
            "name": { "th": "ความปลอดภัยและสุขภาวะ", "en": "Safety and Hygiene", "isan": "ความปลอดภัยและสุขอนามัย" },
            "description": { "th": "ความปลอดภัยในการเดิน กลิ่น แสงสว่าง และจุดอับสายตา", "en": "Safety in walking, odors, lighting, and blind spots.", "isan": "ความปลอดภัยในการย่าง กลิ่น แสงสว่าง และมุมอับ" },
            "rubric_5": { "th": "ปลอดภัยและน่าใช้งาน อากาศถ่ายเทดี ไม่มีกลิ่นรบกวน ไม่มีจุดน้ำขังหรือจุดอับที่สัตว์มีพิษจะอาศัยอยู่ได้", "en": "Safe and pleasant to use. Good ventilation, no disturbing odors, no stagnant water or blind spots where poisonous animals could hide.", "isan": "ปลอดภัยและน่าใช้งาน อากาศถ่ายเทดีคัก บ่มีกลิ่นเหม็น บ่มีน้ำขังหรือมุมอับที่งูเงี้ยวเขี้ยวขอสิมาอยู่" },
            "rubric_4": { "th": "สภาพแวดล้อมดี ไม่มีจุดเสี่ยงอันตราย แต่อาจมีมุมอับเล็กน้อยที่แสงสว่างเข้าไม่ถึง หรือมีกลิ่นอับจางๆ ชั่วคราว", "en": "Good environment. No dangerous spots, but may have slight blind spots with low light or temporary faint musty smells.", "isan": "สภาพแวดล้อมดี บ่มีจุดอันตราย แต่อาจสิมีมุมอับแหน่ที่แสงเข้าบ่ถึง หรือมีกลิ่นอับจักหน่อย" },
            "rubric_3": { "th": "มีความเสี่ยงเล็กน้อย เช่น พื้นลื่นบางจุด ทางเดินไม่เรียบ หรือถังขยะเริ่มส่งกลิ่นแต่ยังไม่รุนแรง", "en": "Slight risk, e.g., some slippery spots, uneven paths, or trash bins starting to smell but not strongly.", "isan": "มีความเสี่ยงจักหน่อย เช่น พื้นมื่นบางหม่อง ทางย่างบ่เรียบ หรือถังขยะเริ่มส่งกลิ่นแต่บ่แฮง" },
            "rubric_2": { "th": "สภาพแวดล้อมไม่ดี มีกลิ่นเหม็นรบกวน (จากท่อ/ขยะ) หรือมีจุดเสี่ยงต่อการสะดุดล้ม/ลื่นไถล", "en": "Bad environment. Disturbing odors (from drains/trash) or risks of tripping/slipping.", "isan": "สภาพแวดล้อมบ่ดี มีกลิ่นเหม็นรบกวน (จากท่อ/ขยะ) หรือมีจุดเสี่ยงสิสะดุดล้ม/มื่นล้ม" },
            "rubric_1": { "th": "อันตรายและไม่ถูกสุขลักษณะอย่างมาก มีน้ำเน่าเสีย กลิ่นเหม็นรุนแรง หรือเป็นแหล่งเพาะพันธุ์เชื้อโรค/สัตว์พาหะ", "en": "Very dangerous and unsanitary. Stagnant sewage water, strong foul odors, or breeding grounds for germs/vectors.", "isan": "อันตรายและบ่ถูกสุขลักษณะคัก มีน้ำเน่าเสีย กลิ่นเหม็นกุ๊บ หรือเป็นแหล่งเพาะเชื้อโรค/สัตว์พาหะ" }
        },
        // RESTROOM CRITERIA
        {
            "type": "criterion",
            "criterion_id": "CRIT-REST-1",
            "criterion_type": "restroom",
            "name": { "th": "ความสะอาดของสุขภัณฑ์และพื้นผิว", "en": "Sanitary Ware and Surface Cleanliness", "isan": "ความสะอาดของส้วมและพื้น" },
            "description": { "th": "โถสุขภัณฑ์ อ่างล้างมือ กระจก ผนัง และพื้นห้องน้ำ (เน้นความสะอาดตาและคราบสกปรก)", "en": "Toilet bowls, sinks, mirrors, walls, and floors (focusing on visual cleanliness and stains).", "isan": "หัวส้วม อ่างล้างมือ แว่นแยง ผาผนัง และพื้นห้องน้ำ (เน้นความสะอาดและคราบเปื้อน)" },
            "rubric_5": { "th": "สะอาดหมดจดทุกจุด สุขภัณฑ์เงางามไม่มีคราบเหลืองหรือคราบน้ำ พื้นแห้งสนิท กระจกใสไม่มีรอยนิ้วมือ/คราบสบู่", "en": "Spotlessly clean. Sanitary ware shines with no yellow stains or water marks. Floor is completely dry. Mirrors are clear with no fingerprints/soap scum.", "isan": "สะอาดเอี่ยมอ่อง ส้วมงามวับบ่มีคราบเหลือง พื้นแห้งสนิท แว่นแยงใสกิ๊งบ่มีฮอยมือ" },
            "rubric_4": { "th": "สภาพโดยรวมสะอาดมาก อาจพบคราบน้ำกระเซ็นเล็กน้อยบริเวณอ่างล้างมือ หรือรอยเท้าจางๆ บนพื้น แต่ไม่มีคราบสกปรกสะสม", "en": "Overall very clean. Minor water splashes near sinks or faint footprints on the floor, but no accumulated dirt.", "isan": "โดยรวมสะอาดดีคัก อาจสิมีคราบน้ำกระเซ็นแหน่แถวอ่างล้างมือ หรือฮอยตีนจางๆ บนพื้น แต่บ่มีขี้ตมสะสม" },
            "rubric_3": { "th": "สะอาดระดับใช้งานได้ พื้นเปียกชื้นบางจุด (แต่ไม่นอง) อาจมีคราบสบู่หรือคราบไคลตามร่องยาแนวหรือขอบสุขภัณฑ์บ้าง", "en": "Usable cleanliness. Floor damp in spots (not flooded). Some soap scum or grime in grout lines or edges.", "isan": "สะอาดพอใช้ได้ พื้นเปียกแหน่บางหม่อง (แต่บ่ท่วม) อาจสิมีคราบสบู่หรือขี้ไคลตามฮ่องกระเบื้องแหน่" },
            "rubric_2": { "th": "ดูไม่สะอาดตา พบรอยเปื้อนหรือคราบสกปรกชัดเจนในโถสุขภัณฑ์ พื้นเปียกแฉะ หรือกระจกมัวหมอง", "en": "Looks unclean. Distinct stains in toilet bowls, wet/slushy floor, or cloudy mirrors.", "isan": "เบิ่งแล้วบ่สะอาด มีฮอยเปื้อนหรือคราบสกปรกชัดเจนในส้วม พื้นเปียกแฉะ หรือแว่นแยงมัว" },
            "rubric_1": { "th": "สกปรกมาก มีคราบอุจจาระ/ปัสสาวะติดค้าง พื้นสกปรกเลอะเทอะ หรือมีตะไคร่น้ำจับ ไม่น่าใช้งานอย่างยิ่ง", "en": "Very dirty. Feces/urine stains present. Floor is filthy or has algae buildup. Highly unusable.", "isan": "สกปรกคัก มีคราบขี้คราบเยี่ยวติดอยู่ พื้นเลอะเทอะ หรือมีตะไคร่น้ำจับ บ่เป็นตาใช้เลย" }
        },
        {
            "type": "criterion",
            "criterion_id": "CRIT-REST-2",
            "criterion_type": "restroom",
            "name": { "th": "สภาพความพร้อมใช้งานของอุปกรณ์", "en": "Equipment Functionality and Readiness", "isan": "สภาพการใช้งานของอุปกรณ์" },
            "description": { "th": "ระบบน้ำ ระบบไฟ กลอนประตู สายชำระ และการระบายน้ำ", "en": "Water system, lighting, door latches, bidet sprayers, and drainage.", "isan": "น้ำ ไฟ กลอนประตู สายฉีดก้น และท่อระบายน้ำ" },
            "rubric_5": { "th": "อุปกรณ์ทุกชิ้นใช้งานได้สมบูรณ์ 100% น้ำไหลแรง กดชักโครกลงดี กลอนประตูล็อคแน่น ไฟสว่างทุกดวง ไม่มีจุดรั่วซึม", "en": "All equipment works 100%. Strong water flow, flush works well, door locks securely, all lights bright, no leaks.", "isan": "ของทุกอย่างใช้ได้ดีคัก 100% น้ำแฮง กดส้วมลงดี กลอนประตูล็อคแน่น ไฟแจ้งฮุ่งเหมิด บ่มีฮั่ว" },
            "rubric_4": { "th": "ใช้งานได้ดีเกือบทั้งหมด อาจมีจุดเล็กน้อย เช่น ก๊อกน้ำปิดแล้วหยดบ้าง หรือกลอนประตูฝืดเล็กน้อยแต่ยังล็อคได้", "en": "Almost fully functional. Minor issues like a dripping tap or a slightly stiff latch that still locks.", "isan": "ใช้ได้ดีเกือบเหมิด อาจสิมีนิดหน่อย เช่น ก๊อกน้ำหยดแหน่ หรือกลอนประตูฝืดแต่กะยังล็อคได้" },
            "rubric_3": { "th": "พอใช้งานได้ แต่อาจมีอุปกรณ์บางส่วนชำรุด (เช่น ห้องน้ำ 1 ห้องใช้งานไม่ได้ หรือหลอดไฟกระพริบ) ท่อระบายน้ำไหลช้าเล็กน้อย", "en": "Usable, but some equipment is broken (e.g., 1 stall out of order, flickering light). Drainage slightly slow.", "isan": "พอใช้ได้ แต่อาจสิมีของพังแหน่ (เช่น ห้องน้ำห้องหนึ่งใช้บ่ได้ หรือไฟกระพริบ) ท่อระบายน้ำไหลซ่าจักหน่อย" },
            "rubric_2": { "th": "ชำรุดหลายจุด เช่น สายชำระแตก น้ำไม่ไหล กดชักโครกไม่ลง หรือประตูห้องน้ำพังจนล็อคไม่ได้ จำเป็นต้องเรียกช่าง", "en": "Multiple failures. Broken sprayers, no water, flush broken, or door won't lock. Needs repair.", "isan": "พังหลายหม่อง เช่น สายฉีดก้นแตก น้ำบ่ไหล กดส้วมบ่ลง หรือประตูพังล็อคบ่ได้ ต้องเอิ้นซ่าง" },
            "rubric_1": { "th": "ระบบล้มเหลว น้ำประปาไม่ไหล ส้วมตันทุกห้อง หรือไฟฟ้าดับมืดสนิท ไม่สามารถใช้งานได้จริง", "en": "System failure. No water, all toilets clogged, or complete blackout. Cannot be used.", "isan": "พังเหมิด น้ำบ่ไหล ส้วมตันคู่ห้อง หรือไฟดับมิดอิ่มสิ่ม ใช้งานบ่ได้อีหลี" }
        },
        // CLASSROOM CRITERIA
        {
            "type": "criterion",
            "criterion_id": "CRIT-CLASS-1",
            "criterion_type": "classroom",
            "name": { "th": "ความสะอาดของพื้นผิวและสภาพห้องทั่วไป", "en": "Floor and Surface Cleanliness", "isan": "ความสะอาดของพื้นและสภาพห้อง" },
            "description": { "th": "พื้นห้อง (กวาด/ถู), ฝุ่นบนหลังตู้, กระจกบานเกล็ด, เพดาน/หยากไย่", "en": "Floor condition (sweeping/mopping), dust on cabinets, louver windows, ceiling/cobwebs.", "isan": "พื้นห้อง (กวาด/ถู) ฝุ่นหลังตู้ แว่นบานเกล็ด เพดาน/หยากไย่" },
            "rubric_5": { "th": "พื้นห้องสะอาดเงางาม ไม่มีฝุ่น ทราย หรือเศษขยะแม้แต่ชิ้นเดียว กระจกใสสะอาดไม่มีรอยนิ้วมือ เพดานและมุมห้องไร้หยากไย่", "en": "Floor is shiny clean, no dust, sand, or trash at all. Windows are clear without fingerprints. Ceiling and corners free of cobwebs.", "isan": "พื้นห้องงามวับ บ่มีฝุ่น ขี้ดิน หรือขยะจักชิ้น แว่นใสกิ๊งบ่มีฮอยมือ เพดานบ่มีหยากไย่" },
            "rubric_4": { "th": "สภาพโดยรวมสะอาดมาก พื้นถูกกวาดถูเรียบร้อย อาจพบฝุ่นจับเล็กน้อยตามซอกมุมอับ หรือรอยคราบจางๆ บนกระจก", "en": "Overall very clean. Floor swept/mopped well. Slight dust in hidden corners or faint stains on windows.", "isan": "โดยรวมสะอาดคัก กวาดถูเรียบร้อย อาจสิมีฝุ่นจับตามแจมุมอับแหน่ หรือฮอยจางๆ บนแว่น" },
            "rubric_3": { "th": "สะอาดตามมาตรฐาน พื้นดูเรียบร้อยแต่ยังไม่เงางาม อาจมีเศษฝุ่นผง หรือเศษยางลบตกหล่นอยู่บ้างตามใต้โต๊ะเรียน", "en": "Standard cleanliness. Floor looks tidy but not shiny. Some dust or eraser crumbs under desks.", "isan": "สะอาดพอใช้ พื้นเบิ่งเรียบร้อยแต่บ่เงา อาจสิมีฝุ่นผง หรือขี้ยางลบตกอยู่ใต้โต๊ะเรียนแหน่" },
            "rubric_2": { "th": "ดูไม่สะอาดตา พื้นมีคราบรอยเท้าหรือคราบน้ำที่แห้งกรัง มีฝุ่นจับหนาบนหลังตู้ หรือกระจกมัวหมอง", "en": "Looks unclean. Floor has footprints or dried water stains. Thick dust on cabinets or cloudy windows.", "isan": "เบิ่งแล้วบ่สะอาด พื้นมีฮอยตีนหรือคราบน้ำแห้งเขรอะ ฝุ่นจับหนาเทิงหลังตู้ หรือแว่นมัว" },
            "rubric_1": { "th": "สกปรกมาก มีขยะเกลื่อนพื้น เศษดิน/ทรายจำนวนมากเหมือนไม่ได้กวาด มีหยากไย่ห้อยชัดเจน บรรยากาศไม่เหมาะแก่การเรียน", "en": "Very dirty. Trash scattered, lots of soil/sand like it wasn't swept. Cobwebs hanging clearly. Unsuitable for learning.", "isan": "สกปรกคัก ขยะเกลื่อนพื้น ขี้ดินหลายคือจั่งบ่ได้กวาด หยากไย่ห้อยโต่งเต่ง บรรยากาศบ่เป็นตาเรียน" }
        },
        {
            "type": "criterion",
            "criterion_id": "CRIT-CLASS-2",
            "criterion_type": "classroom",
            "name": { "th": "ความเป็นระเบียบของโต๊ะเรียนและสัมภาระ", "en": "Orderliness of Desks and Belongings", "isan": "ความเป็นระเบียบของโต๊ะเรียนและของใช้" },
            "description": { "th": "การจัดแถวโต๊ะเก้าอี้, การวางกระเป๋านักเรียน, และชั้นวางรองเท้า", "en": "Arrangement of desk/chair rows, student bag placement, and shoe racks.", "isan": "การจัดแถวโต๊ะตั่ง วางกระเป๋านักเรียน และชั้นวางเกิบ" },
            "rubric_5": { "th": "โต๊ะเก้าอี้จัดเรียงเป็นแถวแนวตรงเป๊ะทุกตัว เก้าอี้สอดเก็บใต้โต๊ะเรียบร้อย กระเป๋านักเรียนจัดเก็บเข้าที่ (หรือแขวน) เป็นระเบียบ รองเท้าวางบนชั้นเรียงคู่สวยงาม", "en": "Desks/chairs aligned perfectly. Chairs tucked in. Bags stored/hung neatly. Shoes arranged beautifully on racks.", "isan": "โต๊ะตั่งเรียงแถวตรงเป๊ะทุกโต๊ะ เก้าอี้สอดเก็บดี กระเป๋าจัดเก็บเข้าที่ (หรือแขวน) เป็นระเบียบ เกิบวางเทิงชั้นเรียงคู่กันงามๆ" },
            "rubric_4": { "th": "จัดแถวเป็นระเบียบดี แต่อาจมีโต๊ะบางตัว (1-2 ตัว) ที่เลื่อนหลุดแนวเล็กน้อย รองเท้าวางเรียบร้อยแต่อาจมีบางคู่ไม่ชิดกัน", "en": "Well arranged rows, but 1-2 desks might be slightly off. Shoes tidy but some pairs not close together.", "isan": "จัดแถวระเบียบดี แต่อาจสิมีโต๊ะลางโต (1-2 โต) ที่เลื่อนหลุดแนวแหน่ เกิบวางเรียบร้อยแต่ลางคู่บ่ชิดกัน" },
            "rubric_3": { "th": "พอใช้ได้ โต๊ะเก้าอี้เป็นกลุ่มก้อนแต่แถวไม่ตรงนัก มีกระเป๋าวางเกะกะทางเดินบ้าง หรือรองเท้าวางล้นออกมานอกชั้นวาง", "en": "Fair. Desks/chairs grouped but rows not straight. Some bags blocking paths or shoes overflowing from racks.", "isan": "พอใช้ได้ โต๊ะตั่งเป็นกลุ่มแต่แถวบ่ตรงปานได๋ มีกระเป๋าวางเกะกะทางย่างแหน่ หรือเกิบวางล้นออกมานอกชั้น" },
            "rubric_2": { "th": "ขาดความเป็นระเบียบ โต๊ะเก้าอี้กระจัดกระจายไม่เป็นแถว เก้าอี้ไม่ถูกสอดเก็บ รองเท้าวางระเกะระกะขวางทางเข้าห้อง", "en": "Lacking order. Desks/chairs scattered, not in rows. Chairs not tucked. Shoes cluttering the entrance.", "isan": "บ่เป็นระเบียบ โต๊ะตั่งกระจัดกระจายบ่เป็นแถว เก้าอี้บ่สอดเก็บ เกิบวางระเกะระกะขวางทางเข้าห้อง" },
            "rubric_1": { "th": "ไร้ระเบียบวินัยอย่างมาก โต๊ะล้มระเนระนาด กระเป๋ากองรวมกันเหมือนห้องเก็บของ สภาพห้องดูวุ่นวายสับสน", "en": "Extremely disordered. Desks toppled. Bags piled up like a storage room. Chaotic atmosphere.", "isan": "บ่มีระเบียบวินัยเลย โต๊ะล้มระเนระนาด กระเป๋ากองรวมกันคือห้องเก็บของ สภาพห้องวุ่นวายคัก" }
        }
    ];

    // Fix: Using unknown cast to bypass strict property checks for translation objects on line 304
    rawCriteria.forEach((c, idx) => {
        initialData.push({
            type: 'criterion',
            criterion_id: c.criterion_id,
            criterion_type: c.criterion_type as any,
            criterion_name: c.name,
            criterion_description: c.description,
            rubric_5: c.rubric_5,
            rubric_4: c.rubric_4,
            rubric_3: c.rubric_3,
            rubric_2: c.rubric_2,
            rubric_1: c.rubric_1,
            created_at: new Date().toISOString(),
            __backendId: `BID-CRIT-${idx}-${Date.now()}`
        } as unknown as Criterion);
    });

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