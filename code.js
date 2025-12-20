
/**
 * Google Apps Script Code - Premium HRMS Portal Backend
 */

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const sheetData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
    const sheetList = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("List");

    if (!sheetData || !sheetList) {
      throw new Error("Critical Failure: Required sheets 'Data' or 'List' are missing.");
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === "login") {
      return handleLogin(payload.hrmsId, payload.password, sheetData, sheetList);
    } else if (action === "save") {
      return handleSave(payload.data, sheetData, sheetList);
    } else {
      throw new Error("Invalid action request.");
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Maps headers to column indices dynamically to ensure robustness against sheet changes
 */
function getHeaderMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((header, index) => {
    const h = String(header).toLowerCase().trim();
    if (h.includes("hrms id") || h.includes("id")) map.hrmsId = index;
    if (h.includes("employee name") || (h.includes("name") && !h.includes("hindi"))) map.employeeName = index;
    if (h.includes("कर्मचारी") || h.includes("hindi")) map.hindiName = index;
    if (h.includes("designation")) map.designation = index;
    if (h.includes("dob") || h.includes("date of birth")) map.dob = index;
    if (h.includes("posting office") || h.includes("office")) map.postingOffice = index;
    if (h.includes("udise code") || h.includes("udise")) map.udiseCode = index;
    if (h.includes("adhar") || h.includes("aadhar")) map.adharNumber = index;
    if (h.includes("epic") || h.includes("voter")) map.epicNumber = index;
    if (h.includes("pan")) map.panNumber = index;
    if (h.includes("mobile") || h.includes("phone")) map.mobileNumber = index;
    if (h.includes("gmail") || h.includes("email")) map.gmailId = index;
    if (h.includes("photo")) map.photo = index;
  });
  return map;
}

function handleLogin(hrmsId, password, sheetData, sheetList) {
  const hrmsIdStr = String(hrmsId).trim();
  const passwordStr = String(password).trim(); 

  // 1. Verify Authentication against Master List
  const listMap = getHeaderMap(sheetList);
  const listValues = sheetList.getRange(1, 1, sheetList.getLastRow(), sheetList.getLastColumn()).getValues();
  let listRow = null;

  for (let i = 1; i < listValues.length; i++) {
    if (String(listValues[i][listMap.hrmsId]).trim() === hrmsIdStr) {
      listRow = listValues[i];
      break;
    }
  }

  if (!listRow) {
    throw new Error("Access Denied: HRMS ID not found in master records.");
  }

  const listDob = formatDate(listRow[listMap.dob]);
  if (listDob !== passwordStr) {
    throw new Error("Authentication Failed: Date of Birth mismatch.");
  }

  // 2. Build profile from Master List
  const masterInfo = {
    hrmsId: String(listRow[listMap.hrmsId] || "").trim(),
    employeeName: String(listRow[listMap.employeeName] || "").trim(),
    hindiName: (listMap.hindiName !== undefined) ? String(listRow[listMap.hindiName] || "").trim() : "", 
    designation: String(listRow[listMap.designation] || "").trim(),
    dob: listDob,
    postingOffice: String(listRow[listMap.postingOffice] || "").trim(),
    udiseCode: String(listRow[listMap.udiseCode] || "").trim()
  };

  // 3. Fetch existing data from "Data" sheet if available
  const dataMap = getHeaderMap(sheetData);
  const dataValues = sheetData.getDataRange().getValues();
  
  let existingData = null;
  for (let i = 1; i < dataValues.length; i++) {
    if (String(dataValues[i][dataMap.hrmsId]).trim() === hrmsIdStr) {
      const row = dataValues[i];
      existingData = {
        hindiName: (dataMap.hindiName !== undefined && row[dataMap.hindiName]) ? String(row[dataMap.hindiName]).trim() : masterInfo.hindiName,
        adharNumber: (dataMap.adharNumber !== undefined) ? String(row[dataMap.adharNumber] || "").trim() : "",
        epicNumber: (dataMap.epicNumber !== undefined) ? String(row[dataMap.epicNumber] || "").trim() : "",
        panNumber: (dataMap.panNumber !== undefined) ? String(row[dataMap.panNumber] || "").trim() : "",
        mobileNumber: (dataMap.mobileNumber !== undefined) ? String(row[dataMap.mobileNumber] || "").trim() : "",
        gmailId: (dataMap.gmailId !== undefined) ? String(row[dataMap.gmailId] || "").trim() : "",
        photo: (dataMap.photo !== undefined) ? String(row[dataMap.photo] || "") : ""
      };
      break;
    }
  }

  return createSuccessResponse({
    exists: !!existingData,
    data: existingData ? { ...masterInfo, ...existingData } : { ...masterInfo, adharNumber: "", epicNumber: "", panNumber: "", mobileNumber: "", gmailId: "", photo: "" }
  });
}

function handleSave(data, sheetData, sheetList) {
  const hrmsIdStr = String(data.hrmsId).trim();
  const dataMap = getHeaderMap(sheetData);
  const dataValues = sheetData.getDataRange().getValues();
  let rowIndex = -1;

  // Search for existing row to prevent duplicates
  for (let i = 1; i < dataValues.length; i++) {
    if (String(dataValues[i][dataMap.hrmsId]).trim() === hrmsIdStr) {
      rowIndex = i + 1; // Google Sheets is 1-indexed
      break;
    }
  }

  // Construct the row array based on detected column indices
  const maxCol = Math.max(...Object.values(dataMap)) + 1;
  const newRow = new Array(maxCol).fill("");
  
  if (dataMap.hrmsId !== undefined) newRow[dataMap.hrmsId] = "'" + data.hrmsId;
  if (dataMap.employeeName !== undefined) newRow[dataMap.employeeName] = data.employeeName;
  if (dataMap.hindiName !== undefined) newRow[dataMap.hindiName] = data.hindiName;
  if (dataMap.designation !== undefined) newRow[dataMap.designation] = data.designation;
  if (dataMap.dob !== undefined) newRow[dataMap.dob] = data.dob;
  if (dataMap.postingOffice !== undefined) newRow[dataMap.postingOffice] = data.postingOffice;
  if (dataMap.udiseCode !== undefined) newRow[dataMap.udiseCode] = data.udiseCode;
  if (dataMap.adharNumber !== undefined) newRow[dataMap.adharNumber] = "'" + data.adharNumber;
  if (dataMap.epicNumber !== undefined) newRow[dataMap.epicNumber] = data.epicNumber;
  if (dataMap.panNumber !== undefined) newRow[dataMap.panNumber] = data.panNumber;
  if (dataMap.mobileNumber !== undefined) newRow[dataMap.mobileNumber] = "'" + data.mobileNumber;
  if (dataMap.gmailId !== undefined) newRow[dataMap.gmailId] = data.gmailId;
  if (dataMap.photo !== undefined) newRow[dataMap.photo] = data.photo || "";

  let statusMsg = "";
  if (rowIndex !== -1) {
    // Update existing row
    sheetData.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);
    statusMsg = "Profile record successfully updated!";
  } else {
    // Append new row if not found
    sheetData.appendRow(newRow);
    statusMsg = "New profile record initialized successfully!";
  }

  // Sync Hindi Name to Master List if possible
  const listMap = getHeaderMap(sheetList);
  const listValues = sheetList.getRange(1, 1, sheetList.getLastRow(), sheetList.getLastColumn()).getValues();
  for (let i = 1; i < listValues.length; i++) {
    if (String(listValues[i][listMap.hrmsId]).trim() === hrmsIdStr) {
      if (listMap.hindiName !== undefined) {
        sheetList.getRange(i + 1, listMap.hindiName + 1).setValue(data.hindiName);
      }
      break;
    }
  }

  return createSuccessResponse({ message: statusMsg });
}

function createSuccessResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    ...payload
  })).setMimeType(ContentService.MimeType.JSON);
}

function formatDate(date) {
  if (!date) return "";
  if (date instanceof Date) {
     return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd-MM-yyyy");
  }
  return String(date);
}
