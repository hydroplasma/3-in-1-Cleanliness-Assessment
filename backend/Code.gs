
// ==========================================
// 3-in-1 Cleanliness Assessment Backend (GAS)
// ==========================================

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'getAll') {
    const data = getAllData();
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'triggerReport') {
    const result = sendDailySummaryReport(true);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const payload = body.payload;
    
    if (action === 'setupTrigger') {
      setupMorningTrigger();
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Trigger installed' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (payload && payload.images && Array.isArray(payload.images)) {
      payload.images = processImages(payload.images, payload.location || 'IMG');
    }
    if (action === 'create') { saveToSheet(payload); } 
    else if (action === 'update') { updateInSheet(payload); } 
    else if (action === 'delete') { deleteFromSheet(payload); } 
    else if (action === 'testReport') {
       const res = sendDailySummaryReport(true);
       return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function setupMorningTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendDailySummaryReport') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('sendDailySummaryReport').timeBased().atHour(8).nearMinute(10).everyDays(1).create();
}

function sendDailySummaryReport(forceSend) {
  const now = new Date();
  const day = now.getDay(); 
  if (!forceSend && (day === 0 || day === 6)) return { status: 'skipped', message: 'Weekend' };

  const allData = getAllData();
  const settings = allData.find(d => d.type === 'settings');
  if (!settings || !settings.telegram_token || !settings.telegram_chat_id) {
    return { status: 'error', message: 'Telegram settings missing' };
  }

  const timeZone = "GMT+7";
  const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const dayStr = Utilities.formatDate(now, timeZone, "d");
  const monthStr = thaiMonths[parseInt(Utilities.formatDate(now, timeZone, "M")) - 1];
  const yearStr = parseInt(Utilities.formatDate(now, timeZone, "yyyy")) + 543;
  const todayKey = Utilities.formatDate(now, timeZone, "yyyy-MM-dd");
  const dayName = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"][day];

  if (!forceSend && settings.last_daily_report_date === todayKey) {
    return { status: 'skipped', message: 'Already sent today' };
  }

  const assessments = allData.filter(d => {
    if (d.type !== 'assessment' || !d.date) return false;
    let dateStr = d.date;
    if (Object.prototype.toString.call(dateStr) === '[object Date]') {
       dateStr = Utilities.formatDate(dateStr, timeZone, "yyyy-MM-dd");
    } else {
       dateStr = String(dateStr);
    }
    return dateStr.substring(0, 10) === todayKey;
  });
  
  const rooms = allData.filter(d => d.type === 'room');
  rooms.sort((a, b) => a.room_name.localeCompare(b.room_name));

  const getThaiStatus = (score) => {
    if (score >= 80) return "ดีเยี่ยม";
    if (score >= 60) return "ดี";
    return "ควรปรับปรุง";
  };

  const getScoreDetailLine = (score) => {
    if (score >= 80) return `🌟 ได้คะแนน ${score} ระดับ ดีเยี่ยม`;
    if (score >= 60) return `✅ ได้คะแนน ${score} ระดับ ดี`;
    return `📉 ได้คะแนน ${score} ระดับ ควรปรับปรุง`;
  };

  let totalScore = 0;
  let count = 0;

  const buildSection = (emojiIcon, title, type) => {
    const targetRooms = rooms.filter(r => r.room_type === type);
    if (targetRooms.length === 0) return "";
    let section = `\n${emojiIcon} ${title}\n\n`;
    targetRooms.forEach(room => {
      const matches = assessments.filter(a => a.location === room.room_name && a.assessment_type === type);
      matches.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const assessment = matches.length > 0 ? matches[0] : null;
      let roomDisplay = room.room_name;
      if (room.room_building && !roomDisplay.includes(room.room_building)) { roomDisplay += " " + room.room_building; }
      const inspectorName = room.assigned_evaluator_name || (assessment ? assessment.evaluator : "ไม่ระบุผู้ตรวจ");
      section += `${roomDisplay} (${inspectorName})\n`;
      if (assessment) {
        const score = Number(assessment.score);
        section += `${getScoreDetailLine(score)}\n\n`;
        totalScore += score;
        count++;
      } else {
        section += `❌ ไม่ได้รับการตรวจ\n\n`;
      }
    });
    return section;
  };

  // Construct Custom Telegram Message
  const reportHeader = settings.telegram_report_title || 'แบบฟอร์มรายงานความสะอาด';
  let message = `🧹 ${reportHeader} (ข้อความอัตโนมัติ)\n`;
  message += `📅 ประจำวัน${dayName}ที่ ${dayStr} เดือน${monthStr} พ.ศ. ${yearStr}\n\n`;
  message += `ตามที่คณะทำงาน 🧑‍🤝‍🧑 ได้รับมอบหมายให้ไปตรวจความสะอาด\n`;
  message += `🏫 เขตพื้นที่ | 🏫 ห้องเรียน | 🚻 ห้องน้ำ\n`;
  message += `📊 ได้ผลการประเมินดังนี้\n`;

  message += buildSection("🌳", "เขตพื้นที่", "area");
  message += buildSection("🏫", "ห้องเรียน", "classroom");
  message += buildSection("🚻", "ห้องน้ำ", "restroom");

  let avg = 0;
  let avgStatus = "ไม่ระบุ";
  let avgEmoji = "❌";
  if (count > 0) {
    avg = (totalScore / count).toFixed(2);
    const avgNum = Number(avg);
    avgStatus = getThaiStatus(avgNum);
    if (avgNum >= 80) avgEmoji = "🌟";
    else if (avgNum >= 60) avgEmoji = "✅";
    else avgEmoji = "📉";
  }
  message += `📊 คะแนนเฉลี่ยทั้งหมด เท่ากับ ${avg}\n`;
  message += `${avgEmoji} อยู่ในระดับ ${avgStatus}\n\n`;

  // Add Daily Reporters
  const reportersMap = {
    1: "ปาลิตา บุญพบ, อรอมล มีชัย, อธิชาติ นวลใส",
    2: "จิรัญญา พึ่งแพง, วรรณษา อินทร์ตา, ศิวัฒน์ คิดประเสริฐ",
    3: "ชนะชัย พันธ์ขาว, ดนัย มหาราช, ประสิทธ์ นุ่มนวน",
    4: "ศิวัฒน์ คิดประเสริฐ, อธิชาติ นวลใส, ชนะชัย พันธ์ขาว",
    5: "นันทวัน ทองสาย, ประสิทธ์ นุ่มนวน, จิรัญญา พึ่งแพง"
  };
  const reporters = reportersMap[day];
  if (reporters) {
    message += `📋 *ผู้รายงานประจำวัน:* ${reporters}\n\n`;
  }

  message += `🙏 ขอขอบคุณทุกคนที่มีจิตอาสา\n`;
  message += `💙 ร่วมกันพัฒนาโรงเรียนให้น่าอยู่ยิ่งขึ้น\n`;
  message += `😊 สวัสดีครับ / ค่ะ`;

  try {
    const url = `https://api.telegram.org/bot${settings.telegram_token}/sendMessage`;
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: settings.telegram_chat_id, text: message })
    };
    UrlFetchApp.fetch(url, options);
    if (!forceSend) {
      settings.last_daily_report_date = todayKey;
      updateInSheet(settings);
    }
    return { status: 'success', message: 'Report sent' };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

function getAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  let allData = [];
  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (name.startsWith("_")) return;
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return;
    const headers = rows[0];
    for (let i = 1; i < rows.length; i++) {
      let obj = {}; let hasData = false;
      headers.forEach((header, index) => {
        let val = rows[i][index];
        if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
           try { val = JSON.parse(val); } catch(e) {}
        }
        obj[header] = val;
        if(val !== "") hasData = true;
      });
      if(hasData) allData.push(obj);
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

function updateInSheet(item) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = getSheetNameByType(item.type);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idIndex = headers.indexOf('__backendId');
  if (idIndex === -1) return;
  Object.keys(item).forEach(key => { if (!headers.includes(key)) { const newCol = headers.length + 1; sheet.getRange(1, newCol).setValue(key); headers.push(key); } });
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) { if (data[i][idIndex] === item.__backendId) { headers.forEach((header, colIndex) => { if (item[header] !== undefined) { let val = item[header]; if (typeof val === 'object' && val !== null) val = JSON.stringify(val); sheet.getRange(i + 1, colIndex + 1).setValue(val); } }); break; } }
}

function saveToSheet(item) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = getSheetNameByType(item.type);
  let sheet = ss.getSheetByName(sheetName);
  const preferredOrder = ['__backendId'];
  const itemKeys = Object.keys(item);
  const sortedKeys = [...preferredOrder.filter(k => itemKeys.includes(k)), ...itemKeys.filter(k => !preferredOrder.includes(k)).sort()];
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(sortedKeys);
    sheet.getRange(1, 1, 1, sortedKeys.length).setFontWeight("bold").setBackground("#EFEFEF");
  }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sortedKeys.forEach(key => { if (!headers.includes(key)) { const newCol = headers.length + 1; sheet.getRange(1, newCol).setValue(key); headers.push(key); } });
  const row = headers.map(header => { let val = item[header]; if (val === undefined || val === null) return ""; if (typeof val === 'object') return JSON.stringify(val); return val; });
  sheet.appendRow(row);
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
  for (let i = 1; i < data.length; i++) { if (data[i][idIndex] === item.__backendId) { sheet.deleteRow(i + 1); break; } }
}

function processImages(images, prefix) {
  return images.map((imgStr, index) => {
    if (!imgStr.startsWith('data:image')) return imgStr;
    try {
      const folderName = "CleanlinessApp_Images";
      const folders = DriveApp.getFoldersByName(folderName);
      let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const contentType = imgStr.split(';')[0].split(':')[1];
      const base64Data = imgStr.split(',')[1];
      const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, `${prefix}_${Date.now()}_${index}.jpg`);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w1000`;
    } catch (e) { return imgStr; }
  });
}
