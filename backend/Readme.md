
# วิธีการติดตั้ง Backend (Google Apps Script)

1. ไปที่ [Google Sheets](https://sheets.google.com) และสร้าง Spreadsheet ใหม่
2. ไปที่เมนู **Extensions** > **Apps Script**
3. ลบโค้ดเก่าทิ้ง และนำโค้ดจากไฟล์ `backend/Code.gs` ไปวาง
4. กด Save (Icon แผ่นดิสก์)
5. กดปุ่ม **Deploy** (สีฟ้ามุมขวาบน) > **New deployment**
6. ช่อง **Select type** เลือก **Web app**
   - Description: "Cleanliness API V1"
   - Execute as: **Me** (ใส่อีเมลของคุณ)
   - Who has access: **Anyone** (สำคัญมาก! เพื่อให้ Web App เรียกใช้ได้โดยไม่ต้อง Login Google)
7. กด **Deploy** > ให้สิทธิ์เข้าถึง (Authorize access) > Advanced > Go to ... (unsafe) > Allow
8. คัดลอก **Web app URL** (ที่ขึ้นต้นด้วย `https://script.google.com/macros/s/...`)
9. นำ URL ไปวางในไฟล์ `services/dataService.ts` ตรงตัวแปร `API_URL`
10. เรียบร้อย! ระบบจะเชื่อมต่อกับ Google Sheets และ Google Drive อัตโนมัติ

**หมายเหตุ:** รูปภาพที่อัปโหลดจะถูกเก็บใน Google Drive ในโฟลเดอร์ชื่อ `CleanlinessApp_Images`
