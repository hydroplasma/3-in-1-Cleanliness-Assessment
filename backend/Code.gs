
// ==========================================
// 3-in-1 Cleanliness Assessment Backend (GAS)
// ==========================================

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getAll') {
    const data = getAllData();
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const payload = body.payload;
    
    // จัดการรูปภาพ (ถ้ามี)
    if (payload.images && Array.isArray(payload.images)) {
      payload.images = processImages(payload.images, payload.location || 'Unknown');
    }
    
    if (action === 'create') {
      saveToSheet(payload);
    } else if (action === 'update') {
      updateInSheet(payload);
    } else if (action === 'delete') {
      deleteFromSheet(payload);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --------------------------------------------------------
// Data Handling
// --------------------------------------------------------

function getAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  let allData = [];
  
  sheets.forEach(sheet => {
    const name = sheet.getName();
    // ข้ามชีต Log หรือ Config อื่นๆ
    if (name.startsWith("_")) return;
    
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return;
    
    const headers = rows[0];
    for (let i = 1; i < rows.length; i++) {
      let obj = {};
      let hasData = false;
      headers.forEach((header, index) => {
        let val = rows[i][index];
        
        // แปลง JSON string กลับเป็น Object/Array
        if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
           try { val = JSON.parse(val); } catch(e) {}
        }
        
        obj[header] = val;
        if(val !== "") hasData = true;
      });
      
      if(hasData) {
        // กำหนด type ตามชื่อ Sheet หากในข้อมูลไม่มี
        if (!obj.type) {
           // Mapping sheet name to type (simple logic)
           if(name === 'Users') obj.type = 'user';
           else if(name === 'Rooms') obj.type = 'room';
           else if(name === 'Criteria') obj.type = 'criterion';
           else if(name === 'Assessments') obj.type = 'assessment';
           else if(name === 'Settings') obj.type = 'settings';
           else if(name === 'Goals') obj.type = 'goal';
           else if(name === 'Notifications') obj.type = 'notification';
        }
        allData.push(obj);
      }
    }
  });
  
  return allData;
}

function getSheetNameByType(type) {
  switch(type) {
    case 'user': return 'Users';
    case 'room': return 'Rooms';
    case 'criterion': return 'Criteria';
    case 'assessment': return 'Assessments';
    case 'settings': return 'Settings';
    case 'goal': return 'Goals';
    case 'notification': return 'Notifications';
    default: return 'Others';
  }
}

function saveToSheet(item) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = getSheetNameByType(item.type);
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // สร้าง Header จาก key ของ item
    const headers = Object.keys(item);
    sheet.appendRow(headers);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = [];
  
  // ตรวจสอบหัวตาราง หากมี key ใหม่ให้เพิ่มคอลัมน์
  const itemKeys = Object.keys(item);
  itemKeys.forEach(key => {
    if (!headers.includes(key)) {
      sheet.getRange(1, headers.length + 1).setValue(key);
      headers.push(key);
    }
  });
  
  headers.forEach(header => {
    let val = item[header];
    // แปลง Object/Array เป็น String
    if (typeof val === 'object' && val !== null) {
      val = JSON.stringify(val);
    }
    row.push(val === undefined ? "" : val);
  });
  
  sheet.appendRow(row);
}

function updateInSheet(item) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = getSheetNameByType(item.type);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idIndex = headers.indexOf('__backendId');
  if (idIndex === -1) return;
  
  const data = sheet.getDataRange().getValues();
  // วนลูปหาแถวที่ตรงกัน (เริ่มจากแถว 1 เพราะ 0 คือ header)
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === item.__backendId) {
      // Update data columns
      headers.forEach((header, colIndex) => {
        if (item[header] !== undefined) {
           let val = item[header];
           if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
           sheet.getRange(i + 1, colIndex + 1).setValue(val);
        }
      });
      break;
    }
  }
}

function deleteFromSheet(item) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = getSheetNameByType(item.type);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idIndex = headers.indexOf('__backendId');
  if (idIndex === -1) return;
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === item.__backendId) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

// --------------------------------------------------------
// Image Handling (Base64 -> Drive)
// --------------------------------------------------------

function processImages(images, prefix) {
  return images.map((imgStr, index) => {
    // ถ้าเป็น URL อยู่แล้ว (จาก Drive) ให้คืนค่าเดิม
    if (!imgStr.startsWith('data:image')) return imgStr;
    
    try {
      const folderName = "CleanlinessApp_Images";
      const folders = DriveApp.getFoldersByName(folderName);
      let folder;
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
        folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
      
      const contentType = imgStr.split(';')[0].split(':')[1];
      const base64Data = imgStr.split(',')[1];
      const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, `${prefix}_${Date.now()}_${index}.jpg`);
      
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      // คืนค่า Download URL หรือ Thumbnail Link
      return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    } catch (e) {
      return imgStr; // กรณี Error ให้เก็บ Base64 ไว้เหมือนเดิม
    }
  });
}
