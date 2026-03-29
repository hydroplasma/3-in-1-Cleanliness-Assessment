
import { AnyData, Criterion, Room, User, SystemSettings } from "../types";

// ==================================================================================
// ⚠️ สำคัญ: ใส่ URL ของ Web App ที่ได้จากการ Deploy Google Apps Script ตรงนี้
// ==================================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzYXObbFWH907VtLu-BGcuSenbfmlHO7b-y5Y1ZNeHrqSd91MJUF9U8MICXrwYe5YFf_w/exec"; 

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
  
  async triggerManualReport(): Promise<any> {
    if (!API_URL || API_URL.includes("INSERT_YOUR")) {
        return { status: 'error', message: 'API URL not configured' };
    }
    try {
        const response = await fetch(`${API_URL}?action=triggerReport`);
        return await response.json();
    } catch (e) {
        console.error(e);
        return { status: 'error', message: e.toString() };
    }
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

    // Get all room names to assign permissions to teachers/admins
    const allRoomNames = initialData.filter(d => d.type === 'room').map((r: any) => r.room_name);

    // Users (Imported List)
    const mockAccounts = [
      // M.1
      { name: "กฤษฎา กาลทรัพย์", email: "nkw01477@school.demo", role: "student", class: "ม.1" },
      { name: "กฤษฎาการ์ณ มุ่งสอน", email: "nkw01478@school.demo", role: "student", class: "ม.1" },
      { name: "ชินนทร์ ไชยมบุญมา", email: "nkw01479@school.demo", role: "student", class: "ม.1" },
      { name: "ทินภัทร โดงบททด", email: "nkw01480@school.demo", role: "student", class: "ม.1" },
      { name: "นิติรัฐ คำใสย", email: "nkw01481@school.demo", role: "student", class: "ม.1" },
      { name: "ปัญญาภรณ์ มัสที", email: "nkw01482@school.demo", role: "student", class: "ม.1" },
      { name: "ภานุพงศ์ คานขุนไทย", email: "nkw01483@school.demo", role: "student", class: "ม.1" },
      { name: "สวรินทร์ พักกษา", email: "nkw01484@school.demo", role: "student", class: "ม.1" },
      { name: "อิทธิฒน์ไชย ปรามิถย", email: "nkw01485@school.demo", role: "student", class: "ม.1" },
      { name: "เบญญาภา แก้วประสงค์", email: "nkw01486@school.demo", role: "student", class: "ม.1" },
      { name: "กญญารัตน์ สาโดด", email: "nkw01487@school.demo", role: "student", class: "ม.1" },
      { name: "ชาลิศา นามพล", email: "nkw01488@school.demo", role: "student", class: "ม.1" },
      { name: "ปิชชญา เสลานอก", email: "nkw01489@school.demo", role: "student", class: "ม.1" },
      { name: "ปาริชาติ สะอาด", email: "nkw01490@school.demo", role: "student", class: "ม.1" },
      { name: "สวีรปา เจยงค์", email: "nkw01491@school.demo", role: "student", class: "ม.1" },
      { name: "สภัทรวี ปยะวงศ์", email: "nkw01492@school.demo", role: "student", class: "ม.1" },
      { name: "อักสรา พ่ไชขาว", email: "nkw01493@school.demo", role: "student", class: "ม.1" },
      
      // M.2
      { name: "จักรีภทร ดาละ", email: "nkw01455@school.demo", role: "student", class: "ม.2" },
      { name: "ฐานะพงษ์ ขันแก้ว", email: "nkw01456@school.demo", role: "student", class: "ม.2" },
      { name: "เตชัส กิ่งแก้ว", email: "nkw01457@school.demo", role: "student", class: "ม.2" },
      { name: "เทวฤทธิ์ พรหมปาถัต", email: "nkw01458@school.demo", role: "student", class: "ม.2" },
      { name: "ธนัญกันต์ บุตรใส", email: "nkw01459@school.demo", role: "student", class: "ม.2" },
      { name: "รชพล ยุคุณธ", email: "nkw01460@school.demo", role: "student", class: "ม.2" },
      { name: "อิชชา สิทธิกุล", email: "nkw01461@school.demo", role: "student", class: "ม.2" },
      { name: "อัครเดชา สัปดัด", email: "nkw01462@school.demo", role: "student", class: "ม.2" },
      { name: "จันทราพร หาญภิรมย์", email: "nkw01463@school.demo", role: "student", class: "ม.2" },
      { name: "จิรัชต้น กัดนิจจันทร์", email: "nkw01464@school.demo", role: "student", class: "ม.2" },
      { name: "จิรัชญา หว่างแสง", email: "nkw01465@school.demo", role: "student", class: "ม.2" },
      { name: "ชลลดา แสงศร", email: "nkw01466@school.demo", role: "student", class: "ม.2" },
      { name: "ณินิตา ดวงมาลา", email: "nkw01467@school.demo", role: "student", class: "ม.2" },
      { name: "ธยา รุ่งสว่าง", email: "nkw01468@school.demo", role: "student", class: "ม.2" },
      { name: "ดาริรัตน์ ต้นธร", email: "nkw01469@school.demo", role: "student", class: "ม.2" },
      { name: "บุษจิรา โป่งทอง", email: "nkw01470@school.demo", role: "student", class: "ม.2" },
      { name: "อารยา ไชยลา", email: "nkw01471@school.demo", role: "student", class: "ม.2" },

      // M.3
      { name: "กัญญ์ วิลัย", email: "nkw01423@school.demo", role: "student", class: "ม.3" },
      { name: "กมลภพ โค้ขี้ยิ่ง", email: "nkw01424@school.demo", role: "student", class: "ม.3" },
      { name: "ณรงค์ศักดิ์ เกษสระ", email: "nkw01425@school.demo", role: "student", class: "ม.3" },
      { name: "ทักษดนัย วายอัครัช", email: "nkw01426@school.demo", role: "student", class: "ม.3" },
      { name: "ธนวัฒน์ วิชัยรุกุล", email: "nkw01428@school.demo", role: "student", class: "ม.3" },
      { name: "ธนากร ไชยณารา", email: "nkw01429@school.demo", role: "student", class: "ม.3" },
      { name: "นันทภพ จันทรา", email: "nkw01430@school.demo", role: "student", class: "ม.3" },
      { name: "พชร สัปดัด", email: "nkw01431@school.demo", role: "student", class: "ม.3" },
      { name: "พร้อมฝน อาบทอง", email: "nkw01432@school.demo", role: "student", class: "ม.3" },
      { name: "มงคลราช ฤทธาพรม", email: "nkw01433@school.demo", role: "student", class: "ม.3" },
      { name: "รัชชา ดาววงค์", email: "nkw01476@school.demo", role: "student", class: "ม.3" },
      { name: "วรภพ ไชยลา", email: "nkw01434@school.demo", role: "student", class: "ม.3" },
      { name: "วรุฒศกร ช่วยนา", email: "nkw01435@school.demo", role: "student", class: "ม.3" },
      { name: "วิฒเดช ดวงมาลา", email: "nkw01436@school.demo", role: "student", class: "ม.3" },
      { name: "อรรถพร บุญหวาน", email: "nkw01438@school.demo", role: "student", class: "ม.3" },
      { name: "อิทธิพัทธ์ ดาววงค์", email: "nkw01439@school.demo", role: "student", class: "ม.3" },
      { name: "กิ่งแก้ว สัปดัด", email: "nkw01441@school.demo", role: "student", class: "ม.3" },
      { name: "ชิตกาญจน์ ฉาบไธสง", email: "nkw01442@school.demo", role: "student", class: "ม.3" },
      { name: "นภาพร มีเนวรรณ", email: "nkw01443@school.demo", role: "student", class: "ม.3" },
      { name: "พรทิพย์ นุนนวน", email: "nkw01444@school.demo", role: "student", class: "ม.3" },
      { name: "วิภาพร บุญหวาน", email: "nkw01446@school.demo", role: "student", class: "ม.3" },
      { name: "สมฤทัย นามพล", email: "nkw01447@school.demo", role: "student", class: "ม.3" },
      { name: "อนุชจีร นวลใส", email: "nkw01448@school.demo", role: "student", class: "ม.3" },

      // M.4
      { name: "ขวัญชัย เสมอไชย", email: "nkw01393@school.demo", role: "student", class: "ม.4" },
      { name: "ชนาธิป ปรินทร์", email: "nkw01394@school.demo", role: "student", class: "ม.4" },
      { name: "ตติย รุ่งสว่าง", email: "nkw01395@school.demo", role: "student", class: "ม.4" },
      { name: "ธระพล คาเคน", email: "nkw01398@school.demo", role: "student", class: "ม.4" },
      { name: "ธรัภัทร คาเคน", email: "nkw01400@school.demo", role: "student", class: "ม.4" },
      { name: "อัครพล อินทร์เอม", email: "nkw01410@school.demo", role: "student", class: "ม.4" },
      { name: "ณฏฐรินชา ปรามิถย", email: "nkw01411@school.demo", role: "student", class: "ม.4" },
      { name: "พรรณรัก ศิลปชัย", email: "nkw01454@school.demo", role: "student", class: "ม.4" },
      { name: "มลฑกานต์ ปรามิถย", email: "nkw01494@school.demo", role: "student", class: "ม.4" },
      { name: "อรปรียา ป้องกัน", email: "nkw01419@school.demo", role: "student", class: "ม.4" },
      { name: "วัชรุรัฒ กาลทรัพย์", email: "nkw01405@school.demo", role: "student", class: "ม.4" },
      { name: "ปิยมิตร อุ่นเสนีย์", email: "nkw01415@school.demo", role: "student", class: "ม.4" },
      { name: "พิตตา โป่งทอง", email: "nkw01417@school.demo", role: "student", class: "ม.4" },
      { name: "วรรณนกานต์ ยมรัมย์", email: "nkw01495@school.demo", role: "student", class: "ม.4" },

      // M.5
      { name: "ชนชัย เพชรขาว", email: "nkw01367@school.demo", role: "student", class: "ม.5" },
      { name: "ต้นย มหาราช", email: "nkw01369@school.demo", role: "student", class: "ม.5" },
      { name: "นันทวัน ทองสาย", email: "nkw01371@school.demo", role: "student", class: "ม.5" },
      { name: "ปริสิทธิ์ นุนนวน", email: "nkw01373@school.demo", role: "student", class: "ม.5" },
      { name: "ศุภกิณห์ ประเสริฐ", email: "nkw01378@school.demo", role: "student", class: "ม.5" },
      { name: "ธีรชิต นวลใส", email: "nkw01472@school.demo", role: "student", class: "ม.5" },
      { name: "จิรัญญา พงแพง", email: "nkw01473@school.demo", role: "student", class: "ม.5" },
      { name: "ปโลดา บุญพบ", email: "nkw01383@school.demo", role: "student", class: "ม.5" },
      { name: "มุขิรญ ทองสาย", email: "nkw01386@school.demo", role: "student", class: "ม.5" },
      { name: "วรรณษา อินทร์ดา", email: "nkw01474@school.demo", role: "student", class: "ม.5" },
      { name: "สัรญญา พรหมมา", email: "nkw01389@school.demo", role: "student", class: "ม.5" },
      { name: "อรอมล มัชชัย", email: "nkw01475@school.demo", role: "student", class: "ม.5" },

      // M.6
      { name: "กนกพล ผาพรรณ", email: "nkw01335@school.demo", role: "student", class: "ม.6" },
      { name: "ชาคริ บตรงาม", email: "nkw01364@school.demo", role: "student", class: "ม.6" },
      { name: "ฐาปกรณ์ ปรทิพย์อประชา", email: "nkw01336@school.demo", role: "student", class: "ม.6" },
      { name: "ธนัวฒน์ ผาชิน", email: "nkw01338@school.demo", role: "student", class: "ม.6" },
      { name: "ธนะชัย ไชยังคัน", email: "nkw01339@school.demo", role: "student", class: "ม.6" },
      { name: "ภาวิวัฒน์ พรมมิต", email: "nkw01341@school.demo", role: "student", class: "ม.6" },
      { name: "วชชากร สุมาลัย", email: "nkw01342@school.demo", role: "student", class: "ม.6" },
      { name: "ศุภสิทธิ์ ชาวเกวียน", email: "nkw01343@school.demo", role: "student", class: "ม.6" },
      { name: "อัครวินท์ อาบทอง", email: "nkw01345@school.demo", role: "student", class: "ม.6" },
      { name: "อภิสิทธิ์ แก่นนาคำ", email: "nkw01346@school.demo", role: "student", class: "ม.6" },
      { name: "กริธแก้ว โรมาลา", email: "nkw01347@school.demo", role: "student", class: "ม.6" },
      { name: "ณัฏฐนิช ดวงมาลา", email: "nkw01348@school.demo", role: "student", class: "ม.6" },
      { name: "ธนชนก พรมมา", email: "nkw01351@school.demo", role: "student", class: "ม.6" },
      { name: "ธดาวรรณ พรหมัคคัด", email: "nkw01350@school.demo", role: "student", class: "ม.6" },
      { name: "ปิพชญา ภิมังนิทก", email: "nkw01352@school.demo", role: "student", class: "ม.6" },
      { name: "พมชนก พันธขาว", email: "nkw01354@school.demo", role: "student", class: "ม.6" },
      { name: "ศิกสรา ธรรมคุณ", email: "nkw01357@school.demo", role: "student", class: "ม.6" },
      { name: "สาริศา แสงศร", email: "nkw01358@school.demo", role: "student", class: "ม.6" },
      { name: "สุพิชญา คานขุนไทย", email: "nkw01359@school.demo", role: "student", class: "ม.6" },
      { name: "อภิดา บุญหนัก", email: "nkw01361@school.demo", role: "student", class: "ม.6" },

      // Student Council
      { name: "สภานักเรียน ม.1", email: "sapa101@school.demo", role: "student_council", class: "ม.1" },
      { name: "สภานักเรียน ม.2", email: "sapa201@school.demo", role: "student_council", class: "ม.2" },
      { name: "สภานักเรียน ม.3", email: "sapa301@school.demo", role: "student_council", class: "ม.3" },
      { name: "สภานักเรียน ม.4", email: "sapa401@school.demo", role: "student_council", class: "ม.4" },
      { name: "สภานักเรียน ม.5", email: "sapa501@school.demo", role: "student_council", class: "ม.5" },
      { name: "สภานักเรียน ม.6", email: "sapa601@school.demo", role: "student_council", class: "ม.6" },

      // Admin & Teachers
      { name: "นายกิตติพงษ์ บุญสาร", email: "admin01@school.demo", role: "admin", class: "" },
      { name: "นางสาววิลัยลักษณ์ หาญสิงห์", email: "admin02@school.demo", role: "teacher", class: "" },
      { name: "นายกัมปนาท คันธร", email: "teacher01@school.demo", role: "teacher", class: "ม.3" },
      { name: "นายชาตรี ทินดา", email: "teacher02@school.demo", role: "teacher", class: "ม.4" },
      { name: "นางสาวสลักสตรี จดักกิด", email: "teacher03@school.demo", role: "teacher", class: "ม.2" },
      { name: "นางสาวสุนีย์ โป่งทอง", email: "teacher04@school.demo", role: "teacher", class: "ม.2" },
      { name: "นางสาวรัตติกานต์ ขอเจริญ", email: "teacher05@school.demo", role: "teacher", class: "ม.6" },
      { name: "นายธวัชชัย แก่นจักร์", email: "teacher06@school.demo", role: "admin", class: "" }, // Admin Role
      { name: "นางสาวนิศิมา ศรีดวง", email: "teacher07@school.demo", role: "teacher", class: "ม.1" },
      { name: "นางสาวพชรพร พิมพ์สาร", email: "teacher08@school.demo", role: "teacher", class: "ม.4" },
      { name: "นางสาวภริณภัทร์ เมธา", email: "teacher09@school.demo", role: "teacher", class: "ม.5" },
      { name: "นางสาวสิรินทร์ บุญนบผา", email: "teacher10@school.demo", role: "teacher", class: "ม.4" },
      { name: "นางกานติ์สิริ สูงใย", email: "teacher11@school.demo", role: "teacher", class: "ม.1" },
      { name: "นางหอมไกล นำจำปา", email: "teacher12@school.demo", role: "teacher", class: "ม.4" },
      { name: "นายธิติศ นามินพพรรณ", email: "teacher13@school.demo", role: "teacher", class: "ม.6" }
    ];

    mockAccounts.forEach(acc => {
        let assigned: string[] = [];
        const role = acc.role.toLowerCase();
        
        // Teachers, Admin, Student Council get access to all rooms for demo purposes
        if (role === 'teacher' || role === 'student_council' || role === 'admin') {
            assigned = allRoomNames;
        }

        // Generate ID from Email (e.g. nkw01477) or fallback
        const uid = acc.email.split('@')[0];

        initialData.push({
            type: 'user',
            user_id: uid,
            user_name: acc.name,
            user_email: acc.email,
            password: 'demo123',
            user_role: role as any,
            user_class: acc.class,
            user_status: 'active',
            assigned_locations: assigned,
            user_created_at: new Date().toISOString(),
            __backendId: `BID-${Date.now()}-${Math.random()}`
        } as User);
    });

    // Settings
    initialData.push({
        type: 'settings',
        telegram_token: '8554080642:AAGNSQK32Aw9jggjirN0YUDH5LV8Kh4m17I',
        telegram_chat_id: '-5109596055',
        notify_low_score: true,
        notify_reminders: true,
        notify_goals: true,
        themeColor: 'indigo',
        school_name: 'โรงเรียนน้ำคำวิทยา',
        school_affiliation: 'สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาศรีสะเกษ ยโสธร',
        executives: 'ผู้อำนวยการโรงเรียน',
        logo_url: 'https://i.postimg.cc/RZ0PCqVy/NKW-LOGO.png',
        showQuickLogin: true,
        __backendId: `SET-${Date.now()}`
    } as SystemSettings);

    const rawCriteria = [
        // AREA CRITERIA (4 items)
        {
          "type": "criterion", "criterion_id": "CRIT-AREA-1", "criterion_type": "area",
          "name": { "th": "ความสะอาดและปราศจากสิ่งปฏิกูล", "en": "Cleanliness and Waste Free", "isan": "ความสะอาดและบ่มีขยะ" },
          "description": { "th": "ประเมินปริมาณขยะ ฝุ่น ทราย คราบสกปรก ทั้งบนถนน พื้นอาคาร และในสวน", "en": "Assess amount of trash, dust, sand, and stains on roads, building floors, and gardens.", "isan": "เบิ่งปริมาณขยะ ฝุ่น ขี้ดิน ฮอยเปื้อน ทั้งเทิงถนน พื้นอาคาร และในสวน" },
          "rubric_5": { "th": "พื้นที่สะอาดหมดจด ไม่พบขยะ เศษใบไม้ ฝุ่นสะสม หรือคราบสกปรกใดๆ", "en": "Area is spotless. No trash, leaves, accumulated dust, or stains found.", "isan": "พื้นที่สะอาดเอี่ยม บ่มีขยะ ใบไม้ ฝุ่น หรือฮอยเปื้อนเลยจักหน่อย" },
          "rubric_4": { "th": "สภาพโดยรวมสะอาดมาก พบสิ่งแปลกปลอมเพียงเล็กน้อยในจุดสังเกตยาก", "en": "Overall condition is very clean. Only slight foreign objects in hard-to-see spots.", "isan": "โดยรวมสะอาดดีคัก พอมีใบไม้แห้งหรือเศษกระดาษน้อยๆ แหน่" },
          "rubric_3": { "th": "สะอาดในระดับมาตรฐาน พบฝุ่น ทราย หรือขยะชิ้นเล็กกระจายตัวบ้าง", "en": "Standard cleanliness. Some dust, sand, or small trash scattered.", "isan": "สะอาดพอใช้ได้ พอมีฝุ่น ขี้ดิน หรือขยะชิ้นน้อยๆ กระจายอยู่" },
          "rubric_2": { "th": "พื้นที่ดูไม่สะอาดตา พบขยะชิ้นใหญ่หรือมีกองเศษใบไม้ตกค้างชัดเจน", "en": "Area looks unclean. Found large trash or piles of leaves clearly left behind.", "isan": "เบิ่งแล้วบ่สะอาดตา ปะขยะชิ้นใหญ่หรือมีกองใบไม้ถิ่มไว้เห็นชัดเจน" },
          "rubric_1": { "th": "สกปรกมาก มีขยะเกลื่อนกราด มีคราบฝังแน่น ต้องทำความสะอาดทันที", "en": "Very dirty. Trash scattered everywhere, ingrained stains. Needs immediate cleaning.", "isan": "สกปรกคัก มีขยะเฮี่ยลาดฟาด มีคราบฝังแน่น ต้องทำความสะอาดด่วน" }
        },
        {
          "type": "criterion", "criterion_id": "CRIT-AREA-2", "criterion_type": "area",
          "name": { "th": "ความเป็นระเบียบและการจัดภูมิทัศน์", "en": "Orderliness and Landscape", "isan": "ความเป็นระเบียบและการจัดสวน" },
          "description": { "th": "การจัดวางของ และ ความเรียบร้อยของต้นไม้/หญ้า", "en": "Arrangement of items and tidiness of trees/grass.", "isan": "การจัดวางของ และ ความเรียบร้อยของต้นไม้/หญ้า" },
          "rubric_5": { "th": "เป็นระเบียบสูงสุด สิ่งของจัดวางเป็นแนวตรง หญ้าตัดสั้นเสมอ ต้นไม้รูปทรงสวยงาม", "en": "Maximum orderliness. Items aligned, grass cut evenly, trees well-shaped.", "isan": "เป็นระเบียบคักแน จัดของเป็นแถวตรง สวนงามหญ้าตัดสั้น" },
          "rubric_4": { "th": "การจัดวางเรียบร้อยดี แต่อาจมีจุดเล็กน้อยที่วางเหลื่อมล้ำ หรือกิ่งก้านยื่นเล็กน้อย", "en": "Well arranged, but may have slight misalignments or protruding branches.", "isan": "จัดวางเรียบร้อยดี แต่อาจสิมีวางเหลื่อมแหน่จักหน่อย" },
          "rubric_3": { "th": "พอใช้ได้ สิ่งของไม่กีดขวางทางเดินแต่ยังไม่เป็นหมวดหมู่ หญ้าเริ่มยาว", "en": "Fair. Items don't block paths but not categorized. Grass starting to grow.", "isan": "พอใช้ได้ ของบ่ขวางทางย่างแต่บ่เป็นหมวดหมู่ หญ้าเริ่มยาว" },
          "rubric_2": { "th": "ขาดความเป็นระเบียบ สิ่งของวางระเกะระกะ สวนดูรกรุงรัง วัชพืชสูง", "en": "Lacking order. Items cluttered, garden unkempt, high weeds.", "isan": "บ่เป็นระเบียบ ของวางระเกะระกะ สวนเบิ่งฮก หญ้าขึ้นสูง" },
          "rubric_1": { "th": "ไร้ระเบียบอย่างสิ้นเชิง กีดขวางทางสัญจร พื้นที่รกร้าง หญ้าสูงท่วม", "en": "Completely disordered. Blocking traffic, abandoned area, overgrown grass.", "isan": "บ่มีระเบียบเลยจักเม็ด ของวางขวางทางย่าง พื้นที่ฮกฮื้อ หญ้าท่วมหัว" }
        },
        {
          "type": "criterion", "criterion_id": "CRIT-AREA-3", "criterion_type": "area",
          "name": { "th": "สภาพความพร้อมใช้งานและความสมบูรณ์", "en": "Readiness and Integrity", "isan": "สภาพการใช้งานและความสมบูรณ์" },
          "description": { "th": "สภาพพื้นผิวถนน รางระบายน้ำ ผนังอาคาร และอุปกรณ์ต่างๆ", "en": "Condition of roads, drainage, walls, and equipment.", "isan": "สภาพพื้นถนน ฮางระบายน้ำ และอุปกรณ์ต่างๆ" },
          "rubric_5": { "th": "สภาพสมบูรณ์ 100% พร้อมใช้งาน ไม่มีส่วนแตกหัก รางน้ำไม่มสิ่งอุดตัน", "en": "100% perfect condition, ready to use. No breakage or clogged drains.", "isan": "สภาพดีคัก พร้อมใช้งาน 100% บ่มีแตกหัก ฮางน้ำบ่ตัน" },
          "rubric_4": { "th": "สภาพสมบูรณ์ดี แต่อาจมีร่องรอยการใช้งานตามกาลเวลาบ้าง (รอยขีดข่วน)", "en": "Good condition, some signs of wear but doesn't affect usage.", "isan": "สภาพดีอยู่ แต่อาจสิมีฮอยการใช้งานตามเวลาแหน่" },
          "rubric_3": { "th": "สภาพพอใช้ พบความชำรุดเล็กน้อย (สีซีด กระเบื้องบิ่น)", "en": "Fair. Found minor damage (faded color, chipped tiles).", "isan": "สภาพพอใช้ พอมีหม่องพังเล็กน้อย (สีซีด กระเบื้องบิ่น)" },
          "rubric_2": { "th": "เริ่มชำรุดชัดเจน มีน้ำขังบนพื้นถนน หรืออุปกรณ์บางอย่างพัง", "en": "Clearly deteriorating, water pooling or broken equipment.", "isan": "เริ่มพังชัดเจน มีน้ำขังตามถนน หรืออุปกรณ์พัง" },
          "rubric_1": { "th": "ชำรุดทรุดโทรมมาก ไม่สามารถใช้งานได้ หรือต้องซ่อมเร่งด่วน", "en": "Very dilapidated. Cannot be used or needs urgent repair.", "isan": "พังเหมิด สภาพโทรมคัก ใช้งานบ่ได้เลย" }
        },
        {
          "type": "criterion", "criterion_id": "CRIT-AREA-4", "criterion_type": "area",
          "name": { "th": "ความปลอดภัยและสุขภาวะ", "en": "Safety and Hygiene", "isan": "ความปลอดภัยและสุขอนามัย" },
          "description": { "th": "ความปลอดภัยในการเดิน กลิ่น แสงสว่าง และจุดอับสายตา", "en": "Safety in walking, odors, lighting, and blind spots.", "isan": "ความปลอดภัยในการย่าง กลิ่น แสงสว่าง และมุมอับ" },
          "rubric_5": { "th": "ปลอดภัย อากาศถ่ายเทดี ไม่มีกลิ่นรบกวน ไม่มีจุดน้ำขังหรือจุดอับสัตว์มีพิษ", "en": "Safe, well ventilated, no odors, no stagnant water/blind spots.", "isan": "ปลอดภัย อากาศถ่ายเทดีคัก บ่มีกลิ่นเหม็น บ่มีหม่องงูอยู่" },
          "rubric_4": { "th": "สภาพแวดล้อมดี ไม่มีจุดเสี่ยง แต่อาจมีมุมอับเล็กน้อยหรือกลิ่นจางๆ", "en": "Good environment. No risks, but slight blind spots or faint smells.", "isan": "สภาพแวดล้อมดี บ่มีจุดอันตราย แต่อาจสิมีมุมอับแหน่" },
          "rubric_3": { "th": "มีความเสี่ยงเล็กน้อย เช่น พื้นลื่นบางจุด ทางเดินไม่เรียบ ถังขยะเริ่มมีกลิ่น", "en": "Slight risk. Slippery spots, uneven paths, or smelly bins.", "isan": "มีความเสี่ยงจักหน่อย พื้นมื่นบางหม่อง ถังขยะเริ่มมีกลิ่น" },
          "rubric_2": { "th": "สภาพแวดล้อมไม่ดี มีกลิ่นเหม็นรบกวนชัดเจน หรือจุดเสี่ยงสะดุดล้ม", "en": "Bad environment. Strong odors or risks of tripping/slipping.", "isan": "สภาพแวดล้อมบ่ดี กลิ่นเหม็นคัก หรือเสี่ยงสิมื่นล้ม" },
          "rubric_1": { "th": "อันตรายและไม่ถูกสุขลักษณะ มีน้ำเน่า กลิ่นรุนแรง หรือแหล่งเชื้อโรค", "en": "Dangerous and unsanitary. Stagnant sewage, strong odors, germs.", "isan": "อันตรายคัก น้ำเน่าเสีย เหม็นกุ๊บ แหล่งเชื้อโรค" }
        },
        // CLASSROOM CRITERIA (4 items)
        {
          "type": "criterion", "criterion_id": "CRIT-CLASS-1", "criterion_type": "classroom",
          "name": { "th": "ความสะอาดของพื้นผิวและสภาพห้องทั่วไป", "en": "Floor and Surface Cleanliness", "isan": "ความสะอาดของพื้นและสภาพห้อง" },
          "description": { "th": "พื้นห้อง, ฝุ่นบนหลังตู้, กระจกบานเกล็ด, เพดาน/หยากไย่", "en": "Floor, dust on cabinets, windows, ceiling/cobwebs.", "isan": "พื้นห้อง ฝุ่นหลังตู้ แว่นบานเกล็ด เพดาน" },
          "rubric_5": { "th": "พื้นห้องสะอาดเงางาม ไม่มีฝุ่น ทราย หรือขยะ กระจกใส เพดานไร้หยากไย่", "en": "Floor shiny, no dust/trash. Windows clear, no cobwebs.", "isan": "พื้นห้องงามวับ บ่มีฝุ่น ขี้ดิน หรือขยะ แว่นใสกิ๊ง" },
          "rubric_4": { "th": "สะอาดมาก กวาดถูเรียบร้อย อาจพบฝุ่นเล็กน้อยตามซอกมุมอับ", "en": "Very clean. Swept/mopped well. Slight dust in hidden corners.", "isan": "โดยรวมสะอาดคัก กวาดถูเรียบร้อย อาจสิมีฝุ่นตามมุมแหน่" },
          "rubric_3": { "th": "สะอาดตามมาตรฐาน เรียบร้อยแต่ไม่เงางาม อาจมีเศษฝุ่น/ขี้ยางลบใต้โต๊ะบ้าง", "en": "Standard clean. Tidy but not shiny. Some dust/eraser crumbs.", "isan": "สะอาดพอใช้ พื้นเรียบร้อยแต่บ่เงา มีขี้ยางลบใต้โต๊ะแหน่" },
          "rubric_2": { "th": "ดูไม่สะอาดตา พื้นมีคราบรอยเท้า ฝุ่นจับหนาบนหลังตู้ หรือกระจกมัว", "en": "Unclean. Footprints on floor, thick dust on cabinets, cloudy windows.", "isan": "เบิ่งแล้วบ่สะอาด พื้นมีฮอยตีน ฝุ่นจับหนา หรือแว่นมัว" },
          "rubric_1": { "th": "สกปรกมาก ขยะเกลื่อนพื้น ดินทรายเยอะ หยากไย่ห้อยชัดเจน", "en": "Very dirty. Trash everywhere, lots of sand, clear cobwebs.", "isan": "สกปรกคัก ขยะเกลื่อนพื้น ขี้ดินหลาย หยากไย่ห้อยโต่งเต่ง" }
        },
        {
          "type": "criterion", "criterion_id": "CRIT-CLASS-2", "criterion_type": "classroom",
          "name": { "th": "ความเป็นระเบียบของโต๊ะเรียนและสัมภาระ", "en": "Orderliness of Desks and Belongings", "isan": "ความเป็นระเบียบของโต๊ะเรียนและของใช้" },
          "description": { "th": "การจัดแถวโต๊ะเก้าอี้, วางกระเป๋า, และชั้นวางรองเท้า", "en": "Desk alignment, bag placement, shoe racks.", "isan": "การจัดแถวโต๊ะตั่ง วางกระเป๋า และชั้นวางเกิบ" },
          "rubric_5": { "th": "โต๊ะเก้าอี้จัดแถวตรงเป๊ะทุกตัว เก็บเก้าอี้เรียบร้อย กระเป๋าและรองเท้าวางเป็นระเบียบ", "en": "Aligned perfectly. Chairs tucked, bags/shoes organized.", "isan": "โต๊ะตั่งเรียงแถวตรงเป๊ะทุกโต๊ะ กระเป๋าเกิบเก็บดีคัก" },
          "rubric_4": { "th": "จัดแถวเป็นระเบียบดี แต่อาจมีโต๊ะ 1-2 ตัว เลื่อนหลุดแนวเล็กน้อย", "en": "Well arranged, but 1-2 desks might be slightly off.", "isan": "จัดแถวระเบียบดี แต่อาจสิมีโต๊ะลางโตเลื่อนนิดหนึ่ง" },
          "rubric_3": { "th": "พอใช้ได้ แถวไม่ตรงนัก มีกระเป๋าวางเกะกะทางเดินบ้าง", "en": "Fair. Rows not straight, some bags blocking paths.", "isan": "พอใช้ได้ แถวบ่ตรงปานได๋ มีกระเป๋าวางเกะกะแหน่" },
          "rubric_2": { "th": "ขาดระเบียบ โต๊ะกระจัดกระจายไม่เป็นแถว รองเท้าวางขวางทางเข้า", "en": "Lacking order. Desks scattered, shoes cluttering entrance.", "isan": "บ่เป็นระเบียบ โต๊ะกระจายบ่เป็นแถว เกิบขวางทางเข้า" },
          "rubric_1": { "th": "ไร้ระเบียบอย่างมาก โต๊ะล้ม กระเป๋ากองรวมกัน ห้องวุ่นวาย", "en": "Extremely disordered. Toppled desks, bags piled up, chaotic.", "isan": "บ่มีระเบียบวินัยเลย โต๊ะล้มระเนระนาด ห้องวุ่นวายคัก" }
        },
        {
          "type": "criterion", "criterion_id": "CRIT-CLASS-3", "criterion_type": "classroom",
          "name": { "th": "ความพร้อมหน้าชั้นเรียนและป้ายนิเทศ", "en": "Front of Class and Bulletin Boards", "isan": "ความพร้อมหน้าห้องและป้ายนิเทศ" },
          "description": { "th": "กระดาน, รางวางแปรง, โต๊ะครู, และป้ายนิเทศ", "en": "Board, eraser tray, teacher's desk, bulletin boards.", "isan": "กระดาน ฮางวางแปรง โต๊ะครู และป้ายนิเทศ" },
          "rubric_5": { "th": "กระดานสะอาดเอี่ยม รางชอล์กไม่มีฝุ่น โต๊ะครูจัดระเบียบ ป้ายนิเทศสวยงาม", "en": "Board erased perfectly, tidy desk, beautiful bulletin boards.", "isan": "กระดานลบสะอาด ฮางชอล์กบ่มีฝุ่น โต๊ะครูระเบียบ ป้ายนิเทศงาม" },
          "rubric_4": { "th": "หน้าชั้นดูดี กระดานสะอาดแต่อาจมีคราบจางๆ เล็กน้อย", "en": "Front looks good. Board clean but slight stains.", "isan": "หน้าห้องเบิ่งดี กระดานสะอาดแต่อาจมีฮอยจางๆ แหน่" },
          "rubric_3": { "th": "กระดานลบแล้วแต่มีคราบฝุ่นชัดเจน รางแปรงมีฝุ่นสะสม ป้ายนิเทศเริ่มเก่า", "en": "Board has chalk stains, dust in tray, boards getting old.", "isan": "กระดานมีฝุ่นชอล์กชัดเจน ฮางแปรงมีฝุ่น ป้ายเริ่มเก่า" },
          "rubric_2": { "th": "กระดานสกปรก มีรอยขีดเขียนเล่น โต๊ะครูรก ป้ายนิเทศฉีกขาด", "en": "Board dirty, doodles present, cluttered desk, torn boards.", "isan": "กระดานลบบ่เกลี้ยง โต๊ะครูฮก ป้ายนิเทศขาด" },
          "rubric_1": { "th": "หน้าชั้นย่ำแย่ กระดานเลอะเขียนไม่ได้ อุปกรณ์หาย ป้ายชำรุดรกรุงรัง", "en": "Bad condition. Board unusable, missing tools, signs damaged.", "isan": "หน้าห้องสภาพแย่คัก กระดานเลอะเขียนบ่ได้ ป้ายพังเบิ่งฮก" }
        },
        {
          "type": "criterion", "criterion_id": "CRIT-CLASS-4", "criterion_type": "classroom",
          "name": { "th": "การจัดการขยะและอุปกรณ์ทำความสะอาด", "en": "Waste and Cleaning Tool Management", "isan": "การจัดการขยะและเครื่องมือทำความสะอาด" },
          "description": { "th": "ถังขยะ, อุปกรณ์เวร, และการปิดไฟ/พัดลม", "en": "Trash bins, duty tools, and utility shutdown.", "isan": "ถังขยะ ของเวร และการปิดไฟพัดลม" },
          "rubric_5": { "th": "ถังขยะว่าง/ขยะน้อย อุปกรณ์เก็บเข้าที่มิดชิด ปิดไฟพัดลมเรียบร้อย", "en": "Bin empty, tools stored, utilities off when unused.", "isan": "ถังขยะขยะน้อย ไม้กวาดเก็บดี ปิดไฟพัดลมเรียบร้อย" },
          "rubric_4": { "th": "ถังขยะสะอาด ไม่ล้น ไม้กวาดถูกวางรวมกลุ่มกันไว้เป็นสัดส่วน", "en": "Bin clean, not full. Brooms grouped together neatly.", "isan": "ถังขยะสะอาด บ่ล้น ไม้กวาดวางรวมกันเป็นหม่อง" },
          "rubric_3": { "th": "ขยะในถังเยอะแต่ยังไม่ล้น อุปกรณ์วางพิงผนังไว้อย่างไม่เรียบร้อยนัก", "en": "Bin full but not overflowing. Tools leaning messily.", "isan": "ขยะในถังหลายแต่บ่ล้น ไม้กวาดวางพิงฝาบ่ค่อยเรียบร้อย" },
          "rubric_2": { "th": "ขยะล้นถัง หรือเศษขยะตกอยู่รอบถัง อุปกรณ์วางระเกะระกะขวางทาง", "en": "Bin overflowing, tools cluttered, falling over paths.", "isan": "ขยะล้นถัง เศษขยะเฮี่ยรอบถัง ไม้กวาดวางระเกะระกะ" },
          "rubric_1": { "th": "สภาพเน่าเหม็น ถังขยะส่งกลิ่น อุปกรณ์กองรวมกับขยะ หรือพังเสียหาย", "en": "Foul condition. Smelly bin, tools piled with trash or broken.", "isan": "เหม็นกุ๊บ ถังขยะส่งกลิ่น ไม้กวาดกองรวมกับขยะ" }
        },
        // RESTROOM CRITERIA (4 items)
        {
          "type": "criterion", "criterion_id": "CRIT-REST-1", "criterion_type": "restroom",
          "name": { "th": "ความสะอาดของสุขภัณฑ์และพื้นผิว", "en": "Sanitary Ware and Surface Cleanliness", "isan": "ความสะอาดของส้วมและพื้น" },
          "description": { "th": "โถสุขภัณฑ์ อ่างล้างมือ กระจก ผนัง และพื้นห้องน้ำ", "en": "Toilets, sinks, mirrors, walls, and floors.", "isan": "หัวส้วม อ่างล้างมือ แว่นแยง ผนังและพื้น" },
          "rubric_5": { "th": "สะอาดหมดจด สุขภัณฑ์เงางามไม่มีคราบเหลือง พื้นแห้งสนิท กระจกใส", "en": "Spotless. Sanitary ware shines, no stains, dry floor, clear mirrors.", "isan": "สะอาดเอี่ยม ส้วมงามวับบ่มีคราบเหลือง พื้นแห้งสนิท แว่นใสกิ๊ง" },
          "rubric_4": { "th": "สะอาดมาก อาจพบคราบน้ำกระเซ็นเล็กน้อย หรือรอยเท้าจางๆ บนพื้น", "en": "Very clean. Minor water splashes or faint footprints on floor.", "isan": "โดยรวมสะอาดดีคัก มีคราบน้ำหรือฮอยตีนจางๆ บนพื้นแหน่" },
          "rubric_3": { "th": "สะอาดระดับใช้งานได้ พื้นเปียกชื้นบางจุด อาจมีคราบสบู่ตามร่องบ้าง", "en": "Usable clean. Floor damp, some soap scum in grout lines.", "isan": "สะอาดพอใช้ พื้นเปียกแหน่บางหม่อง มีคราบสบู่แหน่" },
          "rubric_2": { "th": "ดูไม่สะอาดตา พบรอยเปื้อนชัดเจนในโถสุขภัณฑ์ หรือพื้นเปียกแฉะ", "en": "Unclean. Distinct stains in toilets, or wet/slushy floor.", "isan": "เบิ่งแล้วบ่สะอาด มีฮอยเปื้อนชัดเจนในส้วม พื้นเปียกแฉะ" },
          "rubric_1": { "th": "สกปรกมาก มีคราบสิ่งปฏิกูลติดค้าง พื้นสกปรกเลอะเทอะ ไม่น่าใช้", "en": "Very dirty. Waste stains present, filthy floor. Highly unusable.", "isan": "สกปรกคัก มีคราบขี้คราบเยี่ยว พื้นเลอะเทอะ บ่เป็นตาใช้" }
        },
        {
          "type": "criterion", "criterion_id": "CRIT-REST-2", "criterion_type": "restroom",
          "name": { "th": "สภาพความพร้อมใช้งานของอุปกรณ์", "en": "Equipment Functionality and Readiness", "isan": "สภาพการใช้งานของอุปกรณ์" },
          "description": { "th": "ระบบน้ำ ระบบไฟ กลอนประตู สายชำระ และการระบายน้ำ", "en": "Water, light, locks, bidet sprayers, and drainage.", "isan": "น้ำ ไฟ กลอนประตู สายฉีดก้น และท่อระบายน้ำ" },
          "rubric_5": { "th": "อุปกรณ์ทุกชิ้นใช้งานได้สมบูรณ์ 100% น้ำแรง ล็อคแน่น ไฟสว่าง", "en": "All equipment works 100%. Strong water, secure locks, bright lights.", "isan": "ของทุกอย่างใช้ได้ดีคัก 100% น้ำแฮง ล็อคแน่น ไฟแจ้งฮุ่ง" },
          "rubric_4": { "th": "ใช้งานได้ดีเกือบทั้งหมด อาจมีก๊อกน้ำหยด หรือกลอนประตูฝืดเล็กน้อย", "en": "Almost fully functional. Minor issues like a dripping tap.", "isan": "ใช้ได้ดีเกือบเหมิด มีน้ำหยดแหน่ หรือกลอนฝืดนิดหนึ่ง" },
          "rubric_3": { "th": "พอใช้งานได้ แต่อาจมีอุปกรณ์บางส่วนชำรุด ระบายน้ำไหลช้าเล็กน้อย", "en": "Usable, but some broken equipment. Drainage slightly slow.", "isan": "พอใช้ได้ มีของพังแหน่ ท่อระบายน้ำไหลซ่าจักหน่อย" },
          "rubric_2": { "th": "ชำรุดหลายจุด เช่น สายชำระแตก น้ำไม่ไหล หรือล็อคไม่ได้", "en": "Multiple failures. Broken sprayers, no water, or won't lock.", "isan": "พังหลายหม่อง สายฉีดก้นแตก น้ำบ่ไหล ล็อคบ่ได้" },
          "rubric_1": { "th": "ระบบล้มเหลว น้ำประปาไม่ไหล ส้วมตัน หรือไฟฟ้าดับมืดสนิท", "en": "System failure. No water, all toilets clogged, or blackout.", "isan": "พังเหมิด น้ำบ่ไหล ส้วมตัน ไฟดับมิดอิ่มสิ่ม" }
        },
        {
          "type": "criterion", "criterion_id": "CRIT-REST-3", "criterion_type": "restroom",
          "name": { "th": "การจัดการขยะและสิ่งอำนวยความสะดวก", "en": "Waste Management and Supplies", "isan": "การจัดการขยะและของใช้" },
          "description": { "th": "ถังขยะ, ปริมาณขยะ, สบู่ล้างมือ และอุปกรณ์ทำความสะอาด", "en": "Bins, waste amount, soap, and cleaning tools.", "isan": "ถังขยะ ปริมาณขยะ สบู่ล้างมือ" },
          "rubric_5": { "th": "มีสิ่งอำนวยความสะดวกครบถ้วน ถังขยะว่างและมีฝาปิดมิดชิด", "en": "Full amenities, bins empty and tightly closed.", "isan": "ของใช้ครบ ถังขยะว่างและมีฝาปิดดี" },
          "rubric_4": { "th": "มีอุปกรณ์จำเป็นครบ ถังขยะมีขยะบ้างแต่ไม่ส่งกลิ่น และไม่ล้น", "en": "Necessary supplies present. Bins tidy and not overflowing.", "isan": "มีของจำเป็นครบ ถังขยะมีขยะแหน่แต่บ่ล้น" },
          "rubric_3": { "th": "ขาดสิ่งอำนวยความสะดวกบางอย่าง ถังขยะเริ่มเต็มแต่ยังไม่ล้น", "en": "Missing some supplies. Bins getting full but not overflowing.", "isan": "ขาดของใช้บางอย่าง ถังขยะเริ่มเต็มแต่บ่ทันล้น" },
          "rubric_2": { "th": "ขาดแคลนวัสดุจำเป็น ถังขยะล้นจนฝาปิดไม่ได้ หรือขยะเกลื่อนพื้น", "en": "Lack of essentials. Bins overflowing, trash on floor.", "isan": "ขาดแคลนของจำเป็น ถังขยะล้นจนปิดฝาบ่ได้" },
          "rubric_1": { "th": "ไม่มีการจัดการขยะเลย ขยะกองพะเนินเหม็น หรือไม่มีถังขยะ", "en": "No waste management. Piles of smelly trash, no bins.", "isan": "บ่มีการจัดการขยะเลย ขยะกองเอากเยากเหม็นกุ๊บ" }
        },
        {
          "type": "criterion", "criterion_id": "CRIT-REST-4", "criterion_type": "restroom",
          "name": { "th": "กลิ่นและสภาพอากาศ", "en": "Odor and Ventilation", "isan": "กลิ่นและอากาศ" },
          "description": { "th": "กลิ่นรบกวน การระบายอากาศ และความอับชื้น", "en": "Disturbing odors, ventilation, and humidity.", "isan": "กลิ่นเหม็น การระบายอากาศ และความอับชื้น" },
          "rubric_5": { "th": "อากาศสดชื่น ถ่ายเทสะดวก ไม่มีกลิ่นเหม็นใดๆ เลย", "en": "Fresh air, good ventilation, absolutely no bad smells.", "isan": "อากาศดี ถ่ายเทสะดวก บ่มีกลิ่นเหม็นเลย" },
          "rubric_4": { "th": "อากาศถ่ายเทดี ไม่มีกลิ่นเหม็นรบกวนจมูก", "en": "Good ventilation. No disturbing smells.", "isan": "อากาศถ่ายเทดี บ่มีกลิ่นเหม็นรบกวน" },
          "rubric_3": { "th": "มีกลิ่นอับชื้นเล็กน้อย หรือกลิ่นห้องน้ำจางๆ แต่พอทนได้", "en": "Slight musty smell or faint toilet odor, but bearable.", "isan": "มีกลิ่นอับจักหน่อย หรือกลิ่นห้องน้ำจางๆ พอทนได้" },
          "rubric_2": { "th": "มีกลิ่นเหม็นปัสสาวะหรือกลิ่นอับชัดเจน อากาศไม่ถ่ายเท", "en": "Distinct urine or musty smell. Poor ventilation.", "isan": "มีกลิ่นเหม็นเยี่ยวหรือกลิ่นอับคัก อากาศบ่ถ่ายเท" },
          "rubric_1": { "th": "กลิ่นเหม็นรุนแรงจนแสบจมูก อากาศอบอ้าว หายใจลำบาก", "en": "Extremely foul odor. Stuffy air, hard to breathe.", "isan": "เหม็นคักจนแสบดัง อากาศฮ้อนอ้าว หายใจยาก" }
        }
    ];

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
