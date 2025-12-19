
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
 * Maps headers to column indices dynamically to ensure robustness
 */
function getHeaderMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((header, index) => {
    const h = String(header).toLowerCase().trim();
    if (h.includes("hrms id") || h.includes("id")) map.hrmsId = index;
    if (h.includes("employee name") || h.includes("name")) map.employeeName = index;
    if (h.includes("कर्मचारी") || h.includes("hindi name")) map.hindiName = index;
    if (h.includes("designation")) map.designation = index;
    if (h.includes("dob") || h.includes("date of birth")) map.dob = index;
    if (h.includes("posting office") || h.includes("office")) map.postingOffice = index;
    if (h.includes("udise code") || h.includes("udise")) map.udiseCode = index;
    if (h.includes("adhar")) map.adharNumber = index;
    if (h.includes("epic")) map.epicNumber = index;
    if (h.includes("pan")) map.panNumber = index;
    if (h.includes("mobile")) map.mobileNumber = index;
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

  const masterInfo = {
    hrmsId: String(listRow[listMap.hrmsId] || "").trim(),
    employeeName: String(listRow[listMap.employeeName] || "").trim(),
    hindiName: String(listRow[listMap.hindiName] || "").trim(),
    designation: String(listRow[listMap.designation] || "").trim(),
    dob: listDob,
    postingOffice: String(listRow[listMap.postingOffice] || "").trim(),
    udiseCode: String(listRow[listMap.udiseCode] || "").trim()
  };

  const dataMap = getHeaderMap(sheetData);
  const dataValues = sheetData.getDataRange().getValues();
  
  for (let i = 1; i < dataValues.length; i++) {
    if (String(dataValues[i][dataMap.hrmsId || 0]).trim() === hrmsIdStr) {
      const row = dataValues[i];
      return createSuccessResponse({
        exists: true,
        data: {
          ...masterInfo,
          adharNumber: String(row[dataMap.adharNumber] || "").trim(),
          epicNumber: String(row[dataMap.epicNumber] || "").trim(),
          panNumber: String(row[dataMap.panNumber] || "").trim(),
          mobileNumber: String(row[dataMap.mobileNumber] || "").trim(),
          gmailId: String(row[dataMap.gmailId] || "").trim(),
          photo: String(row[dataMap.photo] || "")
        }
      });
    }
  }

  return createSuccessResponse({
    exists: false,
    data: { ...masterInfo, adharNumber: "", epicNumber: "", panNumber: "", mobileNumber: "", gmailId: "", photo: "" }
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

  const rowData = [
    "'" + data.hrmsId,
    data.employeeName,
    data.hindiName,
    data.designation,
    data.dob,
    data.postingOffice,
    data.udiseCode,
    "'" + data.adharNumber,
    data.epicNumber,
    data.panNumber,
    "'" + data.mobileNumber,
    data.gmailId,
    data.photo || ""
  ];

  let statusMsg = "";
  if (rowIndex !== -1) {
    // STRICT OVERWRITE
    sheetData.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    statusMsg = "Data Overwritten & Updated Successfully!";
  } else {
    // FRESH SAVE
    sheetData.appendRow(rowData);
    statusMsg = "New Record Saved Successfully!";
  }

  // Mandatory Sync of Hindi Name to Master List
  const listMap = getHeaderMap(sheetList);
  const listValues = sheetList.getRange(1, 1, sheetList.getLastRow(), sheetList.getLastColumn()).getValues();
  for (let i = 1; i < listValues.length; i++) {
    if (String(listValues[i][listMap.hrmsId]).trim() === hrmsIdStr) {
      sheetList.getRange(i + 1, (listMap.hindiName || 2) + 1).setValue(data.hindiName);
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
