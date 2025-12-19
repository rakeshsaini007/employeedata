
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
 * Maps headers to column indices dynamically with better variation handling
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

  // Basic master info from Master "List" sheet
  const masterInfo = {
    hrmsId: String(listRow[listMap.hrmsId] || "").trim(),
    employeeName: String(listRow[listMap.employeeName] || "").trim(),
    hindiName: String(listRow[listMap.hindiName] || "").trim(), 
    designation: String(listRow[listMap.designation] || "").trim(),
    dob: listDob,
    postingOffice: String(listRow[listMap.postingOffice] || "").trim(),
    udiseCode: String(listRow[listMap.udiseCode] || "").trim()
  };

  // Fetch all existing record data from "Data" sheet
  const dataMap = getHeaderMap(sheetData);
  const dataValues = sheetData.getDataRange().getValues();
  
  let existingData = null;
  for (let i = 1; i < dataValues.length; i++) {
    if (String(dataValues[i][dataMap.hrmsId]).trim() === hrmsIdStr) {
      const row = dataValues[i];
      existingData = {
        // Hindi Name from Data sheet prioritized if user previously corrected/updated it
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

  for (let i = 1; i < dataValues.length; i++) {
    if (String(dataValues[i][dataMap.hrmsId || 0]).trim() === hrmsIdStr) {
      rowIndex = i + 1;
      break;
    }
  }

  // Ensure row columns match headers
  const maxCol = Math.max(...Object.values(dataMap)) + 1;
  const newRow = new Array(maxCol).fill("");
  
  newRow[dataMap.hrmsId] = "'" + data.hrmsId;
  newRow[dataMap.employeeName] = data.employeeName;
  newRow[dataMap.hindiName] = data.hindiName;
  newRow[dataMap.designation] = data.designation;
  newRow[dataMap.dob] = data.dob;
  newRow[dataMap.postingOffice] = data.postingOffice;
  newRow[dataMap.udiseCode] = data.udiseCode;
  newRow[dataMap.adharNumber] = "'" + data.adharNumber;
  newRow[dataMap.epicNumber] = data.epicNumber;
  newRow[dataMap.panNumber] = data.panNumber;
  newRow[dataMap.mobileNumber] = "'" + data.mobileNumber;
  newRow[dataMap.gmailId] = data.gmailId;
  if (dataMap.photo !== undefined) newRow[dataMap.photo] = data.photo || "";

  let statusMsg = "";
  if (rowIndex !== -1) {
    sheetData.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);
    statusMsg = "Record updated successfully!";
  } else {
    sheetData.appendRow(newRow);
    statusMsg = "New record saved successfully!";
  }

  // Sync Hindi Name back to Master List for consistency
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
